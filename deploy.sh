#!/bin/bash

# Exit on error
set -e

# Unset any existing proxy settings that might interfere
unset http_proxy
unset https_proxy

echo "Building Docker image..."
docker build -t roboverse .


# echo "Authenticating with container registry..."
# cd ..
# chmod +x login-registry.sh
# ./login-registry.sh

# if [ ! -f registry_endpoint.txt ]; then
#     echo "Failed to authenticate with container registry"
#     exit 1
# fi

# # Read the successful registry endpoint
# REGISTRY_URL=$(grep LOGIN_SUCCESS registry_endpoint.txt | cut -d= -f2)

# echo "Tagging and pushing Docker image..."
# docker tag roboverse:latest $REGISTRY_URL/roboverse/app:latest
# docker push $REGISTRY_URL/roboverse/app:latest

echo "Initializing Terraform..."
cd terraform
terraform init

echo "Applying Terraform changes..."
terraform apply -var-file=terraform.tfvars -auto-approve

echo "Getting application URL..."
APP_URL=$(terraform output -raw application_url)

echo "Deployment complete!"
echo "Your application is available at: $APP_URL"