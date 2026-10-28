$versions = @("es2015", "es2016", "es2017", "es2018", "es2019", "es2020", "es2021", "es2022", "es2023", "es2024", "es2025")
$outBase = "C:\workspace\RepoApps\Preparation\ECMAScript-features"

Write-Host "Downloading ECMAScript features..." -ForegroundColor Green

foreach ($version in $versions) {
    $versionPath = $outBase + "\" + $version
    New-Item -ItemType Directory -Force -Path $versionPath | Out-Null
    Write-Host ("Processing " + $version + "...") -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri ("https://api.github.com/repos/sudheerj/ECMAScript-features/contents/" + $version) -Headers @{"Accept"="application/vnd.github.v3+json"} -UseBasicParsing -ErrorAction Stop
        $items = $response.Content | ConvertFrom-Json
        
        foreach ($item in $items) {
            if ($item.type -eq "file") {
                $url = $item.download_url
                $outFile = $versionPath + "\" + $item.name
                try {
                    Invoke-WebRequest -Uri $url -OutFile $outFile -UseBasicParsing -ErrorAction Stop
                    Write-Host ("  Downloaded " + $item.name) -ForegroundColor Gray
                }
                catch {
                    Write-Warning ("  Failed to download " + $item.name)
                }
            }
        }
    }
    catch {
        Write-Warning ("Failed to list " + $version)
    }
}

# Download images
$imagesBase = $outBase + "\images"
New-Item -ItemType Directory -Force -Path $imagesBase | Out-Null
try {
    $response = Invoke-WebRequest -Uri "https://api.github.com/repos/sudheerj/ECMAScript-features/contents/images" -Headers @{"Accept"="application/vnd.github.v3+json"} -UseBasicParsing -ErrorAction Stop
    $items = $response.Content | ConvertFrom-Json
    
    foreach ($item in $items) {
        if ($item.type -eq "file") {
            $url = $item.download_url
            $outFile = $imagesBase + "\" + $item.name
            try {
                Invoke-WebRequest -Uri $url -OutFile $outFile -UseBasicParsing -ErrorAction Stop
                Write-Host ("  Downloaded images/" + $item.name) -ForegroundColor Gray
            }
            catch {
                # Silently ignore
            }
        }
    }
}
catch {
    Write-Warning "Failed to download images"
}

Write-Host "Done!" -ForegroundColor Green