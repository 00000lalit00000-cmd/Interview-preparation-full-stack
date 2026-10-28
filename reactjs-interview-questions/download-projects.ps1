#!/usr/bin/env pwsh
# Script to download all coding-projects from the GitHub repo
# Run this from the reactjs-interview-questions directory

$baseUrl = "https://raw.githubusercontent.com/sudheerj/reactjs-interview-questions/master"
$projects = @(
    "accordion-app",
    "autocomplete-app",
    "carousel-app",
    "data-table-app",
    "hacker-news-jobs",
    "infinite-scroll-app",
    "nested-comments",
    "react-modal",
    "shopping-cart",
    "star-rating",
    "theme-switcher",
    "todo-app",
    "tree-view-app"
)

$files = @(
    ".gitignore",
    ".oxlintrc.json",
    "README.md",
    "index.html",
    "package.json",
    "package-lock.json",
    "tsconfig.app.json",
    "tsconfig.json",
    "tsconfig.node.json",
    "vite.config.ts"
)

Write-Host "Downloading coding-projects..." -ForegroundColor Green

foreach ($project in $projects) {
    $projectPath = "coding-projects/$project"
    Write-Host "Processing $project..." -ForegroundColor Cyan
    
    # Create directories
    New-Item -ItemType Directory -Force -Path $projectPath | Out-Null
    New-Item -ItemType Directory -Force -Path "$projectPath/public" | Out-Null
    New-Item -ItemType Directory -Force -Path "$projectPath/src" | Out-Null
    
    # Download files
    foreach ($file in $files) {
        $url = "$baseUrl/$projectPath/$file"
        $outPath = "$projectPath/$file"
        try {
            Invoke-WebRequest -Uri $url -OutFile $outPath -ErrorAction Stop
            Write-Host ("  Downloaded " + $file) -ForegroundColor Gray
        }
        catch {
            $err = $_.Exception.Message
            Write-Warning ("  Failed to download " + $file + ": " + $err)
        }
    }
    
    # Try to download src contents
    $srcFiles = @("main.tsx", "App.tsx", "App.css", "index.css", "vite-env.d.ts")
    foreach ($srcFile in $srcFiles) {
        $url = "$baseUrl/$projectPath/src/$srcFile"
        $outPath = "$projectPath/src/$srcFile"
        try {
            Invoke-WebRequest -Uri $url -OutFile $outPath -ErrorAction Stop
            Write-Host ("  Downloaded src/" + $srcFile) -ForegroundColor Gray
        }
        catch {
            # Silently ignore missing src files
        }
    }
    
    # Try to download public contents
    $publicFiles = @("vite.svg")
    foreach ($pubFile in $publicFiles) {
        $url = "$baseUrl/$projectPath/public/$pubFile"
        $outPath = "$projectPath/public/$pubFile"
        try {
            Invoke-WebRequest -Uri $url -OutFile $outPath -ErrorAction Stop
            Write-Host ("  Downloaded public/" + $pubFile) -ForegroundColor Gray
        }
        catch {
            # Silently ignore
        }
    }
}

Write-Host "Done!" -ForegroundColor Green