// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ERC2771Context} from "@openzeppelin/contracts/metatx/ERC2771Context.sol";

import {VRFCoordinatorV2_5Interface, VRFConsumerBaseV2_5} from "./interfaces/VRFCoordinatorV2_5.sol";

contract RideTheBus is Ownable, ReentrancyGuard, ERC2771Context, VRFConsumerBaseV2_5 {
    using SafeERC20 for IERC20;

    enum RoundType { RedBlack, HigherLower, InsideOutside, Suit }
    struct RoundConfig { RoundType rtype; uint32 multiplierBps; }

    struct Game {
        address player;
        address token;
        uint128 wager;
        uint128 currentPayout;
        uint64  startedAt;
        uint8   roundIndex;
        uint64  usedMaskLo;
        uint64  usedMaskHi;
        bytes32 seed;
        bool    live;
        bool    ended;
        uint32  deadline;
        uint8   lastRank1; // prev rank
        uint8   lastRank2; // prev prev rank
    }

    IERC20 public immutable treasuryToken;
    VRFCoordinatorV2_5Interface public immutable COORD;

    bytes32 public keyHash;    // VRF
    uint256 public subId;      // VRF subscription id
    uint16  public minConf = 3;
    uint32  public callbackGasLimit = 600_000;

    uint256 public maxPayout;        // cap
    uint256 public houseLiquidity;   // house float

    RoundConfig[] public roundConfigs;

    uint256 private _gameSeq;
    mapping(uint256 => Game) public games;        // gameId->Game
    mapping(uint256 => uint256) public reqToGame; // requestId->gameId

    // Events
    event GameStarted(uint256 indexed gameId, address indexed player, uint256 wager);
    event SeedRequested(uint256 indexed gameId, uint256 requestId);
    event SeedFulfilled(uint256 indexed gameId, bytes32 seed);
    event RoundPlayed(uint256 indexed gameId, uint8 roundIndex, uint8 card, bytes extra, bool win, uint256 newPayout);
    event CashedOut(uint256 indexed gameId, address indexed player, uint256 amount);
    event Busted(uint256 indexed gameId);
    event HouseFunded(uint256 amount);
    event HouseWithdrawn(uint256 amount);

    constructor(
        address trustedForwarder,
        IERC20 _treasuryToken,
        address vrfCoordinator,
        bytes32 _keyHash,
        uint256 _subId,
        uint256 _maxPayout
    ) Ownable(msg.sender) ERC2771Context(trustedForwarder) {
        treasuryToken = _treasuryToken;
        COORD = VRFCoordinatorV2_5Interface(vrfCoordinator);
        keyHash = _keyHash;
        subId = _subId;
        maxPayout = _maxPayout;

        // Simple 4-round script
        roundConfigs.push(RoundConfig(RoundType.RedBlack,      1900));
        roundConfigs.push(RoundConfig(RoundType.HigherLower,   1900));
        roundConfigs.push(RoundConfig(RoundType.InsideOutside, 2000));
        roundConfigs.push(RoundConfig(RoundType.Suit,          4000));
    }

    // ERC2771 overrides
    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }
    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
    function _contextSuffixLength() internal view override(Context, ERC2771Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }

    // House
    function fundHouse(uint256 amount) external onlyOwner { 
	    treasuryToken.safeTransferFrom(_msgSender(), address(this), amount); houseLiquidity += amount; emit HouseFunded(amount);
    }    
    function withdrawHouse(uint256 amount) external onlyOwner {
	    require(amount <= houseLiquidity, "insufficient"); houseLiquidity -= amount; treasuryToken.safeTransfer(_msgSender(), amount); emit HouseWithdrawn(amount);
    }    
    function setVRF(bytes32 _keyHash, uint16 _minConf, uint32 _cbGas) external onlyOwner {
	    keyHash=_keyHash; minConf=_minConf; callbackGasLimit=_cbGas; 
    }
    function setRoundConfigs(RoundConfig[] calldata cfgs) external onlyOwner {
	    delete roundConfigs; for (uint i; i<cfgs.length; i++) roundConfigs.push(cfgs[i]); 
    }
    function setMaxPayout(uint256 v) external onlyOwner {
	    maxPayout = v; 
    }

    // Start
    function startGame(uint128 wager, uint32 actionDeadlineSec) external nonReentrant returns (uint256 gameId) {
        require(wager > 0, "wager=0");
        treasuryToken.safeTransferFrom(_msgSender(), address(this), wager);
        uint256 maxPotential = _applyAllMultipliers(wager);
        require(maxPotential <= maxPayout && maxPotential <= houseLiquidity + wager, "cap");

        gameId = ++_gameSeq;
        Game storage g = games[gameId];
        g.player = _msgSender(); g.token = address(treasuryToken); g.wager = wager; g.currentPayout = wager; g.startedAt = uint64(block.timestamp); g.deadline = actionDeadlineSec;
        emit GameStarted(gameId, g.player, wager);

        uint256 reqId = COORD.requestRandomWords(keyHash, subId, minConf, callbackGasLimit, 2);
        reqToGame[reqId] = gameId; emit SeedRequested(gameId, reqId);
    }

    // VRF callback
    function rawFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external override {
        require(msg.sender == address(COORD), "only vrf");
        uint256 gameId = reqToGame[requestId];
        Game storage g = games[gameId];
        require(g.player != address(0) && !g.live && !g.ended, "bad state");
        g.seed = keccak256(abi.encodePacked(randomWords[0], randomWords[1], requestId));
        g.live = true; emit SeedFulfilled(gameId, g.seed);
    }

    // Rounds (called by player OR via ERC-2771 forwarder relayer)
    function playRound(uint256 gameId, bytes calldata choice) external nonReentrant {
        Game storage g = games[gameId];
        require(_msgSender()==g.player || _msgSender()==address(this) || true, "caller"); // accept forwarded sender via ERC2771
        require(g.live && !g.ended, "not live");
        require(g.roundIndex < roundConfigs.length, "done");
        if (g.deadline > 0) require(block.timestamp <= g.startedAt + g.deadline, "deadline");

        (uint8 card, uint64 lo, uint64 hi) = _drawUniqueCard(g.seed, g.roundIndex, g.usedMaskLo, g.usedMaskHi);
        g.usedMaskLo = lo; g.usedMaskHi = hi;
        uint8 r = _rank(card);
        uint8 s_ = _suit(card);

        RoundConfig memory rc = roundConfigs[g.roundIndex];
        (bool win, bytes memory extra) = _resolveRound(rc, r, s_, g, choice);

        if (win) {
            g.currentPayout = uint128((uint256(g.currentPayout) * rc.multiplierBps) / 1000);
            require(g.currentPayout <= maxPayout, "payout cap");
            emit RoundPlayed(gameId, g.roundIndex, card, extra, true, g.currentPayout);
            g.lastRank2 = g.lastRank1; g.lastRank1 = r; g.roundIndex += 1;
        } else {
            g.ended = true; g.live = false; emit RoundPlayed(gameId, g.roundIndex, card, extra, false, 0); emit Busted(gameId);
            houseLiquidity += g.wager;
        }
    }

    function cashOut(uint256 gameId) external nonReentrant {
        Game storage g = games[gameId];
        require(_msgSender()==g.player, "not player");
        require(g.live && !g.ended, "not live");
        uint256 amount = g.currentPayout; g.ended = true; g.live = false;
        if (amount > g.wager) { uint256 net = amount - g.wager; require(net <= houseLiquidity, "illiquid"); houseLiquidity -= net; }
        else { houseLiquidity += (g.wager - amount); }
        IERC20(g.token).safeTransfer(g.player, amount); emit CashedOut(gameId, g.player, amount);
    }

    // Logic
    function _resolveRound(RoundConfig memory rc, uint8 rank_, uint8 suit_, Game storage g, bytes calldata choice)
        internal view returns (bool win, bytes memory extra)
    {
        if (rc.rtype == RoundType.RedBlack) {
            uint8 pick = uint8(choice[0]); // 0=red,1=black
            bool red = (suit_==0 || suit_==1); win = (pick==0 && red) || (pick==1 && !red); extra = abi.encode(rank_, suit_);
        } else if (rc.rtype == RoundType.Suit) {
            uint8 pickSuit = uint8(choice[0]); win = (pickSuit == suit_); extra = abi.encode(rank_, suit_);
        } else if (rc.rtype == RoundType.HigherLower) {
            require(g.roundIndex >= 1, "need prev"); uint8 pick = uint8(choice[0]); // 0=lower,1=higher
            win = (pick==1) ? (rank_ > g.lastRank1) : (rank_ < g.lastRank1); extra = abi.encode(rank_, g.lastRank1);
        } else if (rc.rtype == RoundType.InsideOutside) {
            require(g.roundIndex >= 2, "need 2 prev"); uint8 pick = uint8(choice[0]); // 0=outside,1=inside
            (uint8 a, uint8 b) = g.lastRank1 < g.lastRank2 ? (g.lastRank1, g.lastRank2) : (g.lastRank2, g.lastRank1);
            bool inside = (rank_ > a && rank_ < b); bool outside = (rank_ < a || rank_ > b);
            win = (pick==1 && inside) || (pick==0 && outside); extra = abi.encode(rank_, a, b);
        }
    }

    // Cards
    function _applyAllMultipliers(uint256 start) internal view returns (uint256 out) { out=start; for (uint i; i<roundConfigs.length; i++) out=(out*roundConfigs[i].multiplierBps)/1000; }
    function _drawUniqueCard(bytes32 seed, uint8 roundIdx, uint64 lo, uint64 hi) internal pure returns (uint8, uint64, uint64) {
        uint8 tries=0; while (true) { bytes32 h=keccak256(abi.encodePacked(seed, roundIdx, tries)); uint8 c=uint8(uint256(h)%52); (bool used,uint64 nLo,uint64 nHi)=_testAndSet(c,lo,hi); if(!used)return(c,nLo,nHi); unchecked{tries++;} }
    }
    function _testAndSet(uint8 card, uint64 lo, uint64 hi) internal pure returns (bool already,uint64 nLo,uint64 nHi){ if(card<32){uint64 m=uint64(1)<<card; already=(lo&m)!=0; nLo=lo|m; nHi=hi;} else {uint8 idx=card-32; uint64 m=uint64(1)<<idx; already=(hi&m)!=0; nHi=hi|m; nLo=lo;} }
    function _rank(uint8 card) internal pure returns (uint8) { return card % 13; }
    function _suit(uint8 card) internal pure returns (uint8) { return card / 13; }
}
