// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "forge-std/Script.sol";
import {RideTheBus} from "../RideTheBus.sol";

contract Deploy is Script {
    function run() external {
        address forwarder = vm.envOr("FORWARDER", address(0));
        uint256 maxPayout = vm.envOr("MAX_PAYOUT", uint256(100 ether));

        vm.startBroadcast();

        // Deploy with native XPL support
        RideTheBus game = new RideTheBus(forwarder, maxPayout);

        console.log("RideTheBus deployed at:", address(game));
        console.log("Using native XPL tokens");
        console.log("Max Payout:", maxPayout);

        // Optional: Fund the house with initial liquidity
        // Uncomment and adjust the value as needed
        // game.fundHouse{value: 10 ether}();

        vm.stopBroadcast();
    }
}
