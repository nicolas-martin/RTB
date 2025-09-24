// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "forge-std/Script.sol";
import {RideTheBus} from "../RideTheBus.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DeployNative is Script {
    function run() external {
        address forwarder = vm.envAddress("FORWARDER");
        // Use address(0) to indicate native XPL usage
        address token = address(0);
        uint256 maxPayout = vm.envUint("MAX_PAYOUT");

        vm.startBroadcast();

        // For native XPL, you might need to modify the contract
        // Or deploy a wrapped XPL contract first
        RideTheBus game = new RideTheBus(forwarder, IERC20(token), maxPayout);

        console.log("RideTheBus deployed at:", address(game));
        console.log("Using native XPL for treasury");

        vm.stopBroadcast();
    }
}
