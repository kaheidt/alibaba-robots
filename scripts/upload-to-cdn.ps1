#!/usr/bin/env pwsh
# PowerShell script to upload assets to OSS for CDN delivery
# A wrapper around the Node.js script for PowerShell users

param(
    [switch]$Build
)

# Set the working directory to the project root
$scriptPath = $MyInvocation.MyCommand.Path
$scriptDir = Split-Path -Parent $scriptPath
$projectRoot = Split-Path -Parent $scriptDir

# Navigate to project root
Set-Location $projectRoot

# Ensure the dotenv package is installed
$packageJson = Get-Content -Path "$projectRoot\package.json" -Raw | ConvertFrom-Json
$hasDotEnv = $packageJson.dependencies.dotenv -or $packageJson.devDependencies.dotenv
if (-not $hasDotEnv) {
    Write-Host "Installing dotenv package..." -ForegroundColor Yellow
    npm install dotenv --save
}

# Build command parameter
$buildParam = if ($Build) { "--build" } else { "" }

# Run the Node.js script
Write-Host "Running asset upload script..." -ForegroundColor Cyan
try {
    if ($Build) {
        Write-Host "Building project and uploading assets..." -ForegroundColor Green
        node $projectRoot\scripts\upload-to-cdn.js --build
    } else {
        Write-Host "Uploading assets without build..." -ForegroundColor Green
        node $projectRoot\scripts\upload-to-cdn.js
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Upload completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Upload process exited with code $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "Error running upload script: $_" -ForegroundColor Red
}