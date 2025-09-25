#!/bin/bash

# Contract address from deployment
CONTRACT_ADDRESS="0xD0213A1413821344a9A440D560a98b032647a1eE"

# Amount to fund (in XPL)
FUND_AMOUNT="0.4ether"

# RPC URL
RPC_URL="https://testnet-rpc.plasma.to"

# Load private key from .env
source .env

echo "Funding contract at: $CONTRACT_ADDRESS"
echo "Amount: $FUND_AMOUNT"

# Export env vars for the script
export CONTRACT_ADDRESS=$CONTRACT_ADDRESS
export FUND_AMOUNT=$FUND_AMOUNT

# Run the fund script
forge script script/FundHouse.s.sol:FundHouse \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    -vvv \
    --legacy \
    --with-gas-price 2500000007

echo "Done!"
