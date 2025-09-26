declare module '../abi.json' {
	import { ContractAbi } from 'web3';
	const abi: {
		abi: ContractAbi;
		bytecode: string;
	};
	export = abi;
}
