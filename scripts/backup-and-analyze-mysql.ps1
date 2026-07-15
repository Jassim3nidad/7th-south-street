param(
  [string]$EnvFile = (Join-Path $PSScriptRoot '..\backend\.env'),
  [string]$BackupRoot = (Join-Path $HOME '7ss-migration-backups'),
  [string]$MySqlBin = 'C:\Program Files\MySQL\MySQL Server 8.0\bin'
)

$ErrorActionPreference = 'Stop'

function Read-EnvFile([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) { throw "Environment file not found: $Path" }
  $values = @{}
  Get-Content -LiteralPath $Path | ForEach-Object {
    if ($_ -match '^\s*([^#=\s]+)\s*=\s*(.*)\s*$') {
      $value = $matches[2].Trim()
      if (($value.StartsWith('"') -and $value.EndsWith('"')) -or
          ($value.StartsWith("'") -and $value.EndsWith("'"))) {
        $value = $value.Substring(1, $value.Length - 2)
      }
      $values[$matches[1]] = $value
    }
  }
  return $values
}

$config = Read-EnvFile $EnvFile
foreach ($key in @('DB_HOST', 'DB_NAME', 'DB_USER')) {
  if (-not $config.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($config[$key])) {
    throw "Required setting $key is missing"
  }
}

$mysql = Join-Path $MySqlBin 'mysql.exe'
$mysqldump = Join-Path $MySqlBin 'mysqldump.exe'
if (-not (Test-Path $mysql) -or -not (Test-Path $mysqldump)) {
  throw "MySQL client tools were not found in $MySqlBin"
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$artifactDirectory = Join-Path $BackupRoot $timestamp
New-Item -ItemType Directory -Path $artifactDirectory -Force | Out-Null
$fullBackup = Join-Path $artifactDirectory '7th-south-street-full.sql'
$dataBackup = Join-Path $artifactDirectory '7th-south-street-data.sql'
$reportPath = Join-Path $artifactDirectory 'source-analysis.json'

$env:MYSQL_PWD = $config['DB_PASS']
try {
  $connection = @(
    '--protocol=tcp', '-h', $config['DB_HOST'], '-u', $config['DB_USER'],
    '--database', $config['DB_NAME'], '--batch', '--raw', '--skip-column-names'
  )

  function Invoke-SourceQuery([string]$Sql) {
    $result = & $mysql @connection -e $Sql
    if ($LASTEXITCODE -ne 0) { throw 'A source query failed; credentials were not printed' }
    return @($result)
  }

  function Test-SourceColumn([string]$Table, [string]$Column) {
    $sql = "select count(*) from information_schema.columns where table_schema = database() and table_name = '$Table' and column_name = '$Column';"
    return [int](Invoke-SourceQuery $sql)[0] -eq 1
  }

  $server = Invoke-SourceQuery 'select version(), @@system_time_zone, @@global.time_zone;'
  $tables = Invoke-SourceQuery 'show tables;'

  $dumpOptions = @(
    '--protocol=tcp', '-h', $config['DB_HOST'], '-u', $config['DB_USER'],
    '--single-transaction', '--routines', '--triggers', '--events', '--hex-blob',
    '--set-gtid-purged=OFF', '--default-character-set=utf8mb4',
    "--result-file=$fullBackup", $config['DB_NAME']
  )
  & $mysqldump @dumpOptions
  if ($LASTEXITCODE -ne 0) { throw 'Full MySQL backup failed' }

  $dataOptions = @(
    '--protocol=tcp', '-h', $config['DB_HOST'], '-u', $config['DB_USER'],
    '--single-transaction', '--no-create-info', '--skip-triggers', '--hex-blob',
    '--set-gtid-purged=OFF', '--default-character-set=utf8mb4',
    "--result-file=$dataBackup", $config['DB_NAME']
  )
  & $mysqldump @dataOptions
  if ($LASTEXITCODE -ne 0) { throw 'Data-only MySQL backup failed' }

  foreach ($backup in @($fullBackup, $dataBackup)) {
    if ((Get-Item -LiteralPath $backup).Length -lt 100) {
      throw "Backup is unexpectedly small: $backup"
    }
  }

  $counts = [ordered]@{}
  foreach ($table in $tables) {
    if ($table -match '^[A-Za-z0-9_]+$') {
      $counts[$table] = [int64](Invoke-SourceQuery "select count(*) from ``$table``;")[0]
    }
  }

  $anomalies = [ordered]@{}
  if ($tables -contains 'customers') {
    $anomalies.duplicate_customer_emails = [int64](Invoke-SourceQuery "select count(*) from (select lower(email) from customers group by lower(email) having count(*) > 1) x;")[0]
  }
  if ($tables -contains 'products') {
    $anomalies.duplicate_product_slugs = [int64](Invoke-SourceQuery "select count(*) from (select slug from products group by slug having count(*) > 1) x;")[0]
    $anomalies.duplicate_product_skus = [int64](Invoke-SourceQuery "select count(*) from (select sku from products where sku is not null and sku <> '' group by sku having count(*) > 1) x;")[0]
    $anomalies.invalid_product_prices = [int64](Invoke-SourceQuery 'select count(*) from products where price < 0 or price is null;')[0]
  }
  if (($tables -contains 'inventory') -and ($tables -contains 'products')) {
    $anomalies.negative_inventory = [int64](Invoke-SourceQuery 'select count(*) from inventory where stock_quantity < 0;')[0]
    $anomalies.orphan_inventory = [int64](Invoke-SourceQuery 'select count(*) from inventory i left join products p on p.id=i.product_id where p.id is null;')[0]
  }
  if (($tables -contains 'product_images') -and ($tables -contains 'products')) {
    $anomalies.orphan_product_images = [int64](Invoke-SourceQuery 'select count(*) from product_images i left join products p on p.id=i.product_id where p.id is null;')[0]
    $anomalies.missing_image_paths = [int64](Invoke-SourceQuery "select count(*) from product_images where image_url is null or trim(image_url) = ''; ")[0]
  }
  if (($tables -contains 'order_items') -and ($tables -contains 'orders')) {
    $anomalies.orphan_order_items = [int64](Invoke-SourceQuery 'select count(*) from order_items i left join orders o on o.id=i.order_id where o.id is null;')[0]
    if (Test-SourceColumn 'order_items' 'subtotal') {
      $anomalies.invalid_order_item_totals = [int64](Invoke-SourceQuery 'select count(*) from order_items where subtotal <> round(unit_price * quantity, 2);')[0]
    }
  }
  if ($tables -contains 'orders') {
    if (Test-SourceColumn 'orders' 'discount_amount') {
      $anomalies.invalid_order_totals = [int64](Invoke-SourceQuery 'select count(*) from orders where total <> round(subtotal + shipping_fee - discount_amount, 2);')[0]
    } elseif (Test-SourceColumn 'orders' 'discount') {
      $anomalies.invalid_order_totals = [int64](Invoke-SourceQuery 'select count(*) from orders where total <> round(subtotal + shipping_fee - discount, 2);')[0]
    }
  }
  if ($tables -contains 'newsletter_subscribers') {
    $anomalies.duplicate_newsletter_emails = [int64](Invoke-SourceQuery "select count(*) from (select lower(email) from newsletter_subscribers group by lower(email) having count(*) > 1) x;")[0]
  }

  $report = [ordered]@{
    generated_at = (Get-Date).ToUniversalTime().ToString('o')
    database = $config['DB_NAME']
    server = $server
    backups = @(
      [ordered]@{ file = $fullBackup; bytes = (Get-Item $fullBackup).Length; sha256 = (Get-FileHash $fullBackup -Algorithm SHA256).Hash.ToLower() },
      [ordered]@{ file = $dataBackup; bytes = (Get-Item $dataBackup).Length; sha256 = (Get-FileHash $dataBackup -Algorithm SHA256).Hash.ToLower() }
    )
    counts = $counts
    anomalies = $anomalies
  }
  $report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $reportPath -Encoding utf8
  Write-Output "Backup and source analysis completed: $artifactDirectory"
} finally {
  Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
}
