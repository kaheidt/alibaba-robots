# PowerShell script to import existing OSS bucket

# Get the bucket name from terraform.tfvars
$tfvarsContent = Get-Content -Path terraform.tfvars
$bucketLine = $tfvarsContent | Where-Object { $_ -match "oss_bucket_name" }
$bucketName = $bucketLine -replace '.*=\s*"?([^"]*)"?.*', '$1'
$bucketName = $bucketName.Trim()

$regionLine = $tfvarsContent | Where-Object { $_ -match "region" }
$region = $regionLine -replace '.*=\s*"?([^"]*)"?.*', '$1'
$region = $region.Trim()

Write-Host "Attempting to import OSS bucket: $bucketName in region: $region"

# Run the terraform import command
terraform import -var-file="terraform.tfvars" alicloud_oss_bucket.game_bucket $bucketName