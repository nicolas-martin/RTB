// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface VRFCoordinatorV2_5Interface {
    function requestRandomWords(
        bytes32 keyHash,
        uint256 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId);
}

abstract contract VRFConsumerBaseV2_5 {
    function rawFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external virtual;
}
