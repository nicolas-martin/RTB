import { ContractAbi } from 'web3';
import ABI from '../contracts/RideTheBusABI';

export const CONTRACT_CONFIG = {
	RideTheBus: {
		address: '0x6Db8D133FE92F74F0F7CB45704394331E9593D89',
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
