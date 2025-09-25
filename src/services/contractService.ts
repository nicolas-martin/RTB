import Web3, { Contract, ContractAbi } from 'web3';
import { CONTRACT_CONFIG, PLASMA_TESTNET } from '../config/contracts';
import type { Game, RoundType, CardSuit } from '../types/contract';

interface GameEvent {
	returnValues: {
		gameId?: string;
		seed?: string;
		roundIndex?: number;
		card?: number;
		win?: boolean;
		newPayout?: string;
		amount?: string;
		player?: string;
	};
}

interface TransactionReceipt {
	events?: {
		GameStarted?: GameEvent;
		RoundPlayed?: GameEvent;
		CashedOut?: GameEvent;
		[key: string]: GameEvent | undefined;
	};
}

class ContractService {
	private web3: Web3;
	private contract: Contract<ContractAbi> | null = null;
	private account: string | null = null;

	constructor() {
		this.web3 = new Web3(PLASMA_TESTNET.rpcUrl);
	}

	async connectWallet(privateKey: string) {
		const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
		this.web3.eth.accounts.wallet.add(account);
		this.account = account.address;
		this.contract = new this.web3.eth.Contract(
			CONTRACT_CONFIG.RideTheBus.abi as ContractAbi,
			CONTRACT_CONFIG.RideTheBus.address
		);

		return this.account;
	}

	async connectWithProvider() {
		if (!window.ethereum) throw new Error('MetaMask not installed');

		this.web3 = new Web3(window.ethereum);
		const accounts = await this.web3.eth.requestAccounts();
		this.account = accounts[0];
		this.contract = new this.web3.eth.Contract(
			CONTRACT_CONFIG.RideTheBus.abi as ContractAbi,
			CONTRACT_CONFIG.RideTheBus.address
		);

		return this.account;
	}

	async getBalance(address: string): Promise<string> {
		const balance = await this.web3.eth.getBalance(address);
		return this.web3.utils.fromWei(balance, 'ether');
	}

	async startGame(
		wagerAmount: string,
		deadlineSeconds: number = 300
	): Promise<string> {
		if (!this.contract || !this.account)
			throw new Error('Wallet not connected');

		try {
			// Get treasury token address
			const treasuryToken = await this.getTreasuryToken();

			// Check if treasury token is properly configured
			if (treasuryToken === '0x0000000000000000000000000000000000000000') {
				throw new Error('Contract not properly configured: Missing treasury token. The contract needs to be redeployed with a valid ERC20 token address.');
			}

			const wager = this.web3.utils.toWei(wagerAmount, 'ether');

			// Approve the ERC20 token
			const approvalAmount = (parseFloat(wagerAmount) * 1.1).toString();
			await this.approveToken(treasuryToken, approvalAmount);

			// Send transaction
			const tx = (await this.contract.methods
				.startGame(wager, deadlineSeconds)
				.send({
					from: this.account,
					gas: '300000',
				})) as TransactionReceipt;

			const gameStartedEvent = tx.events?.GameStarted;
			if (gameStartedEvent) {
				return gameStartedEvent.returnValues.gameId.toString();
			}
			throw new Error('Failed to get game ID');
		} catch (error: any) {
			// Parse and throw a more user-friendly error
			if (error.message?.includes('insufficient')) {
				throw new Error('Insufficient balance or house liquidity');
			}
			if (error.message?.includes('treasury token')) {
				throw error; // Pass through our custom error
			}
			throw error;
		}
	}

	async playRound(
		gameId: string,
		roundType: RoundType,
		choice: number | CardSuit
	): Promise<boolean> {
		if (!this.contract || !this.account)
			throw new Error('Wallet not connected');

		const choiceBytes = this.web3.utils.padLeft(
			this.web3.utils.toHex(choice),
			2
		);
		const tx = (await this.contract.methods
			.playRound(gameId, choiceBytes)
			.send({
				from: this.account,
				gas: '300000',
			})) as TransactionReceipt;

		const roundPlayedEvent = tx.events?.RoundPlayed;
		if (roundPlayedEvent) {
			return roundPlayedEvent.returnValues.win;
		}
		return false;
	}

	async cashOut(gameId: string): Promise<string> {
		if (!this.contract || !this.account)
			throw new Error('Wallet not connected');

		const tx = (await this.contract.methods.cashOut(gameId).send({
			from: this.account,
			gas: '300000',
		})) as TransactionReceipt;

		const cashedOutEvent = tx.events?.CashedOut;
		if (cashedOutEvent) {
			return this.web3.utils.fromWei(
				cashedOutEvent.returnValues.amount,
				'ether'
			);
		}
		throw new Error('Failed to cash out');
	}

	async getGame(gameId: string): Promise<Game> {
		if (!this.contract) throw new Error('Wallet not connected');

		const game = (await this.contract.methods.games(gameId).call()) as any;
		return {
			player: game.player,
			token: game.token,
			wager: game.wager,
			currentPayout: game.currentPayout,
			startedAt: game.startedAt,
			roundIndex: game.roundIndex,
			usedMaskLo: game.usedMaskLo,
			usedMaskHi: game.usedMaskHi,
			seed: game.seed,
			live: game.live,
			ended: game.ended,
			deadline: game.deadline,
			lastRank1: game.lastRank1,
			lastRank2: game.lastRank2,
		};
	}

	async getHouseLiquidity(): Promise<string> {
		if (!this.contract) throw new Error('Wallet not connected');
		const liquidity = (await this.contract.methods
			.houseLiquidity()
			.call()) as string;
		return this.web3.utils.fromWei(liquidity, 'ether');
	}

	async getMaxPayout(): Promise<string> {
		if (!this.contract) throw new Error('Wallet not connected');
		const maxPayout = (await this.contract.methods
			.maxPayout()
			.call()) as string;
		return this.web3.utils.fromWei(maxPayout, 'ether');
	}

	async getTreasuryToken(): Promise<string> {
		if (!this.contract) throw new Error('Wallet not connected');
		return await this.contract.methods.treasuryToken().call();
	}

	async approveToken(tokenAddress: string, amount: string): Promise<void> {
		if (!this.account) throw new Error('Wallet not connected');

		const tokenAbi = [
			{
				name: 'approve',
				type: 'function',
				inputs: [
					{ name: 'spender', type: 'address' },
					{ name: 'amount', type: 'uint256' },
				],
				outputs: [{ name: '', type: 'bool' }],
			},
		];

		const tokenContract = new this.web3.eth.Contract(tokenAbi, tokenAddress);
		await tokenContract.methods
			.approve(
				CONTRACT_CONFIG.RideTheBus.address,
				this.web3.utils.toWei(amount, 'ether')
			)
			.send({ from: this.account });
	}

	async getTokenBalance(
		tokenAddress: string,
		userAddress: string
	): Promise<string> {
		const tokenAbi = [
			{
				name: 'balanceOf',
				type: 'function',
				inputs: [{ name: 'account', type: 'address' }],
				outputs: [{ name: '', type: 'uint256' }],
			},
			{
				name: 'decimals',
				type: 'function',
				inputs: [],
				outputs: [{ name: '', type: 'uint8' }],
			},
		];

		const tokenContract = new this.web3.eth.Contract(tokenAbi, tokenAddress);
		const balanceRaw = (await tokenContract.methods
			.balanceOf(userAddress)
			.call()) as string;
		await tokenContract.methods.decimals().call();

		return this.web3.utils.fromWei(balanceRaw, 'ether');
	}

	listenToGameEvents(
		gameId: string,
		callbacks: {
			onSeedFulfilled?: (seed: string) => void;
			onRoundPlayed?: (
				roundIndex: number,
				card: number,
				win: boolean,
				newPayout: string
			) => void;
			onCashedOut?: (amount: string) => void;
			onBusted?: () => void;
		}
	) {
		if (!this.contract) throw new Error('Wallet not connected');

		const options = {
			filter: { gameId },
			fromBlock: 'latest',
		};

		if (callbacks.onSeedFulfilled) {
			this.contract.events
				.SeedFulfilled(options)
				.on('data', (event: GameEvent) => {
					callbacks.onSeedFulfilled!(event.returnValues.seed!);
				});
		}

		if (callbacks.onRoundPlayed) {
			this.contract.events
				.RoundPlayed(options)
				.on('data', (event: GameEvent) => {
					const { roundIndex, card, win, newPayout } = event.returnValues;
					callbacks.onRoundPlayed!(
						roundIndex!,
						card!,
						win!,
						this.web3.utils.fromWei(newPayout!, 'ether')
					);
				});
		}

		if (callbacks.onCashedOut) {
			this.contract.events.CashedOut(options).on('data', (event: GameEvent) => {
				callbacks.onCashedOut!(
					this.web3.utils.fromWei(event.returnValues.amount!, 'ether')
				);
			});
		}

		if (callbacks.onBusted) {
			this.contract.events.Busted(options).on('data', () => {
				callbacks.onBusted!();
			});
		}
	}

	removeAllListeners() {
		if (this.contract) {
			this.contract.events.allEvents().unsubscribe();
		}
	}

	async switchToPlasmaTestnet() {
		if (!window.ethereum) throw new Error('MetaMask not installed');

		const chainIdHex = '0x' + PLASMA_TESTNET.chainId.toString(16);

		try {
			await window.ethereum.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: chainIdHex }],
			});
		} catch (error) {
			if (error.code === 4902) {
				await window.ethereum.request({
					method: 'wallet_addEthereumChain',
					params: [
						{
							chainId: chainIdHex,
							chainName: PLASMA_TESTNET.chainName,
							nativeCurrency: PLASMA_TESTNET.nativeCurrency,
							rpcUrls: [PLASMA_TESTNET.rpcUrl],
							blockExplorerUrls: [PLASMA_TESTNET.blockExplorer],
						},
					],
				});
			} else {
				throw error;
			}
		}
	}

	async estimateGas(method: string, params: unknown[]): Promise<bigint> {
		if (!this.contract || !this.account)
			throw new Error('Wallet not connected');

		const gas = await this.contract.methods[method](...params).estimateGas({
			from: this.account,
		});

		return BigInt(gas);
	}

	async getBlockNumber(): Promise<bigint> {
		return await this.web3.eth.getBlockNumber();
	}

	async getGasPrice(): Promise<string> {
		const gasPrice = await this.web3.eth.getGasPrice();
		return this.web3.utils.fromWei(gasPrice, 'gwei');
	}

	async getTransactionReceipt(txHash: string) {
		return await this.web3.eth.getTransactionReceipt(txHash);
	}

	async getTransaction(txHash: string) {
		return await this.web3.eth.getTransaction(txHash);
	}

	async sendTransaction(to: string, value: string, data?: string) {
		if (!this.account) throw new Error('Wallet not connected');

		return await this.web3.eth.sendTransaction({
			from: this.account,
			to,
			value: this.web3.utils.toWei(value, 'ether'),
			data,
		});
	}
}

export const contractService = new ContractService();
