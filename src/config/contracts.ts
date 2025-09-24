import { ContractAbi } from 'web3';

// @ts-expect-error - JSON import not typed by default
const ABI_JSON = require('../abi.json');

interface ContractABI {
	abi: ContractAbi;
	bytecode: string;
}

export const CONTRACT_CONFIG = {
	RideTheBus: {
		address: '0x6Db8D133FE92F74F0F7CB45704394331E9593D89', // TODO: Replace with deployed address after running deploy.sh
		abi: (ABI_JSON as ContractABI).abi,
		bytecode: (ABI_JSON as ContractABI).bytecode,
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
