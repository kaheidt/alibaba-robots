#!/bin/bash

# Get the bucket name from terraform.tfvars
BUCKET_NAME=$(grep "oss_bucket_name" terraform.tfvars | cut -d '=' -f2 | tr -d '" ' | tr -d "\r")
REGION=$(grep "region" terraform.tfvars | cut -d '=' -f2 | tr -d '" ' | tr -d "\r")

echo "Attempting to import OSS bucket: $BUCKET_NAME in region: $REGION"

# Run the terraform import command
terraform import -var-file=terraform.tfvars alicloud_oss_bucket.game_bucket $BUCKET_NAME