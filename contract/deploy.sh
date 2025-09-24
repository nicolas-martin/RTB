#!/bin/bash

# Deploy script for RideTheBus contract

# Load environment variables
source .env

echo "Deploying RideTheBus contract..."
echo "Network: $RPC_URL"

# Deploy the contract
forge script script/Deploy.s.sol \
    --rpc-url $RPC_URL \
		--sender $ADDRESS \
		--private-key $PRIVATE_KEY \
    --broadcast \
    --verify \
    -vvv

echo "Deployment complete!"
