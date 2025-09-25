import { ContractAbi } from 'web3';
import ABI from '../contracts/RideTheBusABI';

export const CONTRACT_CONFIG = {
	RideTheBus: {
		address: '0xD0213A1413821344a9A440D560a98b032647a1eE', // Native XPL version
		abi: ABI as ContractAbi,
	},
};

export const PLASMA_TESTNET = {
	chainId: 9746,
	chainName: 'Plasma Testnet',
	rpcUrl: 'https://testnet-rpc.plasma.to',
	blockExplorer: 'https://testnet.plasmascan.to/',
	nativeCurrency: {
		name: 'Plasma',
		symbol: 'XPL',
		decimals: 18,
	},
};
