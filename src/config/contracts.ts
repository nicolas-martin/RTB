export const CONTRACT_CONFIG = {
  RideTheBus: {
    address: '0x0000000000000000000000000000000000000000', // Replace with deployed address on Plasma Testnet
    abi: [
      {
        inputs: [
          { internalType: 'address', name: 'trustedForwarder', type: 'address' },
          { internalType: 'contract IERC20', name: '_treasuryToken', type: 'address' },
          { internalType: 'address', name: 'vrfCoordinator', type: 'address' },
          { internalType: 'bytes32', name: '_keyHash', type: 'bytes32' },
          { internalType: 'uint256', name: '_subId', type: 'uint256' },
          { internalType: 'uint256', name: '_maxPayout', type: 'uint256' },
        ],
        stateMutability: 'nonpayable',
        type: 'constructor',
      },
      {
        anonymous: false,
        inputs: [
          { indexed: true, internalType: 'uint256', name: 'gameId', type: 'uint256' },
        ],
        name: 'Busted',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          { indexed: true, internalType: 'uint256', name: 'gameId', type: 'uint256' },
          { indexed: true, internalType: 'address', name: 'player', type: 'address' },
          { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'CashedOut',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          { indexed: true, internalType: 'uint256', name: 'gameId', type: 'uint256' },
          { indexed: true, internalType: 'address', name: 'player', type: 'address' },
          { indexed: false, internalType: 'uint256', name: 'wager', type: 'uint256' },
        ],
        name: 'GameStarted',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'HouseFunded',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'HouseWithdrawn',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          { indexed: true, internalType: 'uint256', name: 'gameId', type: 'uint256' },
          { indexed: false, internalType: 'uint8', name: 'roundIndex', type: 'uint8' },
          { indexed: false, internalType: 'uint8', name: 'card', type: 'uint8' },
          { indexed: false, internalType: 'bytes', name: 'extra', type: 'bytes' },
          { indexed: false, internalType: 'bool', name: 'win', type: 'bool' },
          { indexed: false, internalType: 'uint256', name: 'newPayout', type: 'uint256' },
        ],
        name: 'RoundPlayed',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          { indexed: true, internalType: 'uint256', name: 'gameId', type: 'uint256' },
          { indexed: false, internalType: 'bytes32', name: 'seed', type: 'bytes32' },
        ],
        name: 'SeedFulfilled',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          { indexed: true, internalType: 'uint256', name: 'gameId', type: 'uint256' },
          { indexed: false, internalType: 'uint256', name: 'requestId', type: 'uint256' },
        ],
        name: 'SeedRequested',
        type: 'event',
      },
      {
        inputs: [{ internalType: 'uint256', name: 'gameId', type: 'uint256' }],
        name: 'cashOut',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
        name: 'fundHouse',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        name: 'games',
        outputs: [
          { internalType: 'address', name: 'player', type: 'address' },
          { internalType: 'address', name: 'token', type: 'address' },
          { internalType: 'uint128', name: 'wager', type: 'uint128' },
          { internalType: 'uint128', name: 'currentPayout', type: 'uint128' },
          { internalType: 'uint64', name: 'startedAt', type: 'uint64' },
          { internalType: 'uint8', name: 'roundIndex', type: 'uint8' },
          { internalType: 'uint64', name: 'usedMaskLo', type: 'uint64' },
          { internalType: 'uint64', name: 'usedMaskHi', type: 'uint64' },
          { internalType: 'bytes32', name: 'seed', type: 'bytes32' },
          { internalType: 'bool', name: 'live', type: 'bool' },
          { internalType: 'bool', name: 'ended', type: 'bool' },
          { internalType: 'uint32', name: 'deadline', type: 'uint32' },
          { internalType: 'uint8', name: 'lastRank1', type: 'uint8' },
          { internalType: 'uint8', name: 'lastRank2', type: 'uint8' },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'houseLiquidity',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'maxPayout',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [
          { internalType: 'uint256', name: 'gameId', type: 'uint256' },
          { internalType: 'bytes', name: 'choice', type: 'bytes' },
        ],
        name: 'playRound',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        name: 'roundConfigs',
        outputs: [
          { internalType: 'enum RideTheBus.RoundType', name: 'rtype', type: 'uint8' },
          { internalType: 'uint32', name: 'multiplierBps', type: 'uint32' },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [{ internalType: 'uint256', name: 'v', type: 'uint256' }],
        name: 'setMaxPayout',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            components: [
              { internalType: 'enum RideTheBus.RoundType', name: 'rtype', type: 'uint8' },
              { internalType: 'uint32', name: 'multiplierBps', type: 'uint32' },
            ],
            internalType: 'struct RideTheBus.RoundConfig[]',
            name: 'cfgs',
            type: 'tuple[]',
          },
        ],
        name: 'setRoundConfigs',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          { internalType: 'bytes32', name: '_keyHash', type: 'bytes32' },
          { internalType: 'uint16', name: '_minConf', type: 'uint16' },
          { internalType: 'uint32', name: '_cbGas', type: 'uint32' },
        ],
        name: 'setVRF',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          { internalType: 'uint128', name: 'wager', type: 'uint128' },
          { internalType: 'uint32', name: 'actionDeadlineSec', type: 'uint32' },
        ],
        name: 'startGame',
        outputs: [{ internalType: 'uint256', name: 'gameId', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [],
        name: 'treasuryToken',
        outputs: [{ internalType: 'contract IERC20', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
        name: 'withdrawHouse',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ],
  },
};

export const PLASMA_TESTNET = {
  chainId: 9746,
  chainName: 'Plasma Testnet',
  rpcUrl: 'https://testnet-rpc.plasma.to',
  blockExplorer: 'https://testnet-plasmascan.to',
  nativeCurrency: {
    name: 'Plasma',
    symbol: 'XPL',
    decimals: 18,
  },
};