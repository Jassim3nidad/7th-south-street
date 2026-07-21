
$status = git status -s
foreach ($line in $status) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    # Extract filename (handle renamed files if necessary, but here we just split by space)
    $file = $line.Substring(3).Trim()
    
    # Escape quotes if any
    $fileEscaped = $file -replace "`"", "\`""
    
    Write-Host "Processing $file..."
    
    # 1. Stage ONLY that specific file
    git add $file
    
    # 2 & 3. Commit the file
    git commit -m "Update $fileEscaped"
    
    # 4. Push the commit to the remote repository
    git push origin 7th-south-street
}

