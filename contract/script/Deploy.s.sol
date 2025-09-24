// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "forge-std/Script.sol";
import {RideTheBus} from "../RideTheBus.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Deploy is Script {
    function run() external {
        address forwarder = vm.envAddress("FORWARDER");
        address token     = vm.envAddress("TREASURY_TOKEN");
        uint256 maxPayout = vm.envUint("MAX_PAYOUT");
        vm.startBroadcast();
        RideTheBus game = new RideTheBus(forwarder, IERC20(token), maxPayout);
        console.log("RideTheBus deployed at:", address(game));
        vm.stopBroadcast();
    }
}
