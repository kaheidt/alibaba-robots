# Stop Docker Desktop
$process = Get-Process 'Docker Desktop' -ErrorAction SilentlyContinue
if ($process) {
    $process | Stop-Process -Force
    Start-Sleep -Seconds 5
}

# Update Docker Desktop settings
$settingsPath = "$env:APPDATA\Docker\settings.json"
$settings = Get-Content $settingsPath -Raw | ConvertFrom-Json

# Add Alibaba domains to noProxy if not already present
$noProxyList = @(
    "hubproxy.docker.internal",
    "*.aliyuncs.com",
    "*.cr.aliyuncs.com",
    "*.personal.cr.aliyuncs.com",
    "crpi-znjjqc6013d4jsqd.us-west-1.personal.cr.aliyuncs.com"
)

if (-not $settings.proxyHttpsNoProxy) {
    $settings | Add-Member -NotePropertyName "proxyHttpsNoProxy" -NotePropertyValue ""
}

$currentNoProxy = $settings.proxyHttpsNoProxy -split ','
$newNoProxy = ($currentNoProxy + $noProxyList | Select-Object -Unique) -join ','
$settings.proxyHttpsNoProxy = $newNoProxy

# Save the updated settings
$settings | ConvertTo-Json -Depth 10 | Set-Content $settingsPath

Write-Host "Docker Desktop settings updated. Please restart Docker Desktop manually."