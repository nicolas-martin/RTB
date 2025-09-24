// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "forge-std/Script.sol";
import {RideTheBus} from "../RideTheBus.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Deploy is Script {
    function run() external {
        address forwarder = vm.envAddress("FORWARDER");
        address token     = vm.envAddress("TREASURY_TOKEN");
        address coord     = vm.envAddress("VRF_COORD");
        bytes32 keyHash   = vm.envBytes32("VRF_KEYHASH");
        uint256 subId     = vm.envUint("VRF_SUBID");
        uint256 maxPayout = vm.envUint("MAX_PAYOUT");
        vm.startBroadcast(); new RideTheBus(forwarder, IERC20(token), coord, keyHash, subId, maxPayout); vm.stopBroadcast();
    }
}
