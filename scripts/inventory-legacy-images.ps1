param(
  [string[]]$Roots = @((Join-Path $PSScriptRoot '..\backend\uploads')),
  [string]$OutputDirectory = (Join-Path $HOME '7ss-migration-backups\image-inventory')
)

$ErrorActionPreference = 'Stop'

function Test-ImageSignature([string]$Path, [string]$Extension) {
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  switch ($Extension.ToLowerInvariant()) {
    '.jpg' { return $bytes.Length -ge 3 -and $bytes[0] -eq 0xff -and $bytes[1] -eq 0xd8 -and $bytes[2] -eq 0xff }
    '.jpeg' { return $bytes.Length -ge 3 -and $bytes[0] -eq 0xff -and $bytes[1] -eq 0xd8 -and $bytes[2] -eq 0xff }
    '.png' {
      $signature = @(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
      if ($bytes.Length -lt $signature.Count) { return $false }
      for ($i = 0; $i -lt $signature.Count; $i++) {
        if ($bytes[$i] -ne $signature[$i]) { return $false }
      }
      return $true
    }
    '.webp' {
      if ($bytes.Length -lt 12) { return $false }
      return [Text.Encoding]::ASCII.GetString($bytes, 0, 4) -eq 'RIFF' -and
        [Text.Encoding]::ASCII.GetString($bytes, 8, 4) -eq 'WEBP'
    }
    default { return $false }
  }
}

$files = foreach ($root in $Roots) {
  if (Test-Path -LiteralPath $root) {
    Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object {
      $_.Extension -match '^\.(jpg|jpeg|png|webp)$'
    }
  }
}

$manifest = foreach ($file in $files) {
  $valid = Test-ImageSignature $file.FullName $file.Extension
  [ordered]@{
    source_path = $file.FullName
    relative_path = $file.FullName
    extension = $file.Extension.ToLowerInvariant()
    bytes = $file.Length
    sha256 = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    signature_valid = $valid
  }
}

$duplicateCount = @($manifest | Group-Object sha256 | Where-Object Count -gt 1 |
  ForEach-Object { $_.Count - 1 } | Measure-Object -Sum).Sum
if ($null -eq $duplicateCount) { $duplicateCount = 0 }

$report = [ordered]@{
  generated_at = (Get-Date).ToUniversalTime().ToString('o')
  roots = $Roots
  source_images = @($manifest).Count
  valid_images = @($manifest | Where-Object signature_valid).Count
  corrupt_images = @($manifest | Where-Object { -not $_.signature_valid }).Count
  duplicate_images = $duplicateCount
  images = $manifest
}

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$path = Join-Path $OutputDirectory ("image-inventory-{0}.json" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
$report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $path -Encoding utf8
Write-Output "Image inventory completed: $path"
