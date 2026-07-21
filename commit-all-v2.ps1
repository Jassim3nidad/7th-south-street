
$files = git ls-files -m -o --exclude-standard
foreach ($file in $files) {
    if ([string]::IsNullOrWhiteSpace($file)) { continue }
    
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

