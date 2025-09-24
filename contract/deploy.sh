#!/bin/bash

# Deploy script for RideTheBus contract

# Load environment variables
source .env

echo "Deploying RideTheBus contract..."
echo "Network: $RPC_URL"

# Deploy the contract
forge script script/Deploy.s.sol \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    -vvv

echo "Deployment complete!"