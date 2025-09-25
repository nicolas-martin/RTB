// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "forge-std/Script.sol";
import {RideTheBus} from "../RideTheBus.sol";

contract FundHouse is Script {
    function run() external {
        // Get the deployed contract address from env
        address contractAddress = vm.envAddress("CONTRACT_ADDRESS");
        uint256 fundAmount = vm.envOr("FUND_AMOUNT", uint256(10 ether));

        vm.startBroadcast();

        RideTheBus game = RideTheBus(payable(contractAddress));

        // Fund the house with native XPL
        game.fundHouse{value: fundAmount}();

        console.log("Funded house with:", fundAmount / 1e18, "XPL");
        console.log("New house liquidity:", game.houseLiquidity());

        vm.stopBroadcast();
    }
}
