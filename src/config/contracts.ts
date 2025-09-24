// @ts-expect-error - JSON import not typed by default
import * as ABI_JSON from '../abi.json';

import { ContractAbi } from 'web3';

interface ContractABI {
	abi: ContractAbi;
	bytecode: string;
}

export const CONTRACT_CONFIG = {
	RideTheBus: {
		address: '0x0000000000000000000000000000000000000000', // Replace with deployed address on Plasma Testnet
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
