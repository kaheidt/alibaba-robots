#!/bin/bash

# Exit on error
set -e

# Configure proxy settings
unset http_proxy
unset https_proxy
export no_proxy=".aliyuncs.com,.cr.aliyuncs.com"

# Registry endpoints to try
REGISTRY_ENDPOINTS=(
    "registry.us-west-1.aliyuncs.com"
    "registry-intl.us-west-1.aliyuncs.com"
    "registry-vpc.us-west-1.aliyuncs.com"
)

# Function to attempt login
try_login() {
    local endpoint=$1
    echo "Attempting to login to $endpoint..."
    if echo "$ALIBABA_ACCESS_KEY_SECRET" | docker login --username="$ALIBABA_ACCESS_KEY_ID" --password-stdin "$endpoint" 2>/dev/null; then
        echo "Successfully logged in to $endpoint"
        return 0
    fi
    return 1
}

# Try each endpoint with retries
MAX_RETRIES=3
for endpoint in "${REGISTRY_ENDPOINTS[@]}"; do
    RETRY_COUNT=0
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if try_login "$endpoint"; then
            echo "LOGIN_SUCCESS=$endpoint" > registry_endpoint.txt
            exit 0
        fi
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "Retrying in 5 seconds... (Attempt $RETRY_COUNT of $MAX_RETRIES)"
            sleep 5
        fi
    done
done

echo "Failed to login to any registry endpoint after multiple attempts"
exit 1