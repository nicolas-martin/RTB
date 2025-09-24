import { ethers } from 'ethers';
import { CONTRACT_CONFIG, PLASMA_TESTNET } from '../config/contracts';
import type { Game, RoundType, CardSuit, RoundChoice } from '../types/contract';

class ContractService {
	private provider: ethers.JsonRpcProvider;
	private contract: ethers.Contract | null = null;
	private signer: ethers.Signer | null = null;

	constructor() {
		this.provider = new ethers.JsonRpcProvider(PLASMA_TESTNET.rpcUrl);
	}

	async connectWallet(privateKey: string) {
		this.signer = new ethers.Wallet(privateKey, this.provider);
		this.contract = new ethers.Contract(
			CONTRACT_CONFIG.RideTheBus.address,
			CONTRACT_CONFIG.RideTheBus.abi,
			this.signer
		);
		return await this.signer.getAddress();
	}

	async connectWithProvider(provider: ethers.BrowserProvider) {
		this.signer = await provider.getSigner();
		this.contract = new ethers.Contract(
			CONTRACT_CONFIG.RideTheBus.address,
			CONTRACT_CONFIG.RideTheBus.abi,
			this.signer
		);
		return await this.signer.getAddress();
	}

	async getBalance(address: string): Promise<string> {
		const balance = await this.provider.getBalance(address);
		return ethers.formatEther(balance);
	}

	async startGame(
		wagerAmount: string,
		deadlineSeconds: number = 300
	): Promise<string> {
		if (!this.contract || !this.signer) throw new Error('Wallet not connected');

		const wager = ethers.parseEther(wagerAmount);
		const tx = await this.contract.startGame(wager, deadlineSeconds);
		const receipt = await tx.wait();

		const event = receipt.logs.find((log: any) => {
			try {
				const parsed = this.contract!.interface.parseLog(log);
				return parsed?.name === 'GameStarted';
			} catch {
				return false;
			}
		});

		if (event) {
			const parsed = this.contract.interface.parseLog(event);
			return parsed?.args.gameId.toString();
		}
		throw new Error('Failed to get game ID');
	}

	async playRound(
		gameId: string,
		roundType: RoundType,
		choice: number | CardSuit
	): Promise<boolean> {
		if (!this.contract) throw new Error('Wallet not connected');

		const choiceBytes = ethers.zeroPadValue(ethers.toBeHex(choice), 1);
		const tx = await this.contract.playRound(gameId, choiceBytes);
		const receipt = await tx.wait();

		const event = receipt.logs.find((log: any) => {
			try {
				const parsed = this.contract!.interface.parseLog(log);
				return parsed?.name === 'RoundPlayed';
			} catch {
				return false;
			}
		});

		if (event) {
			const parsed = this.contract.interface.parseLog(event);
			return parsed?.args.win;
		}
		return false;
	}

	async cashOut(gameId: string): Promise<string> {
		if (!this.contract) throw new Error('Wallet not connected');

		const tx = await this.contract.cashOut(gameId);
		const receipt = await tx.wait();

		const event = receipt.logs.find((log: any) => {
			try {
				const parsed = this.contract!.interface.parseLog(log);
				return parsed?.name === 'CashedOut';
			} catch {
				return false;
			}
		});

		if (event) {
			const parsed = this.contract.interface.parseLog(event);
			return ethers.formatEther(parsed?.args.amount);
		}
		throw new Error('Failed to cash out');
	}

	async getGame(gameId: string): Promise<Game> {
		if (!this.contract) throw new Error('Wallet not connected');

		const game = await this.contract.games(gameId);
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
		const liquidity = await this.contract.houseLiquidity();
		return ethers.formatEther(liquidity);
	}

	async getMaxPayout(): Promise<string> {
		if (!this.contract) throw new Error('Wallet not connected');
		const maxPayout = await this.contract.maxPayout();
		return ethers.formatEther(maxPayout);
	}

	async getTreasuryToken(): Promise<string> {
		if (!this.contract) throw new Error('Wallet not connected');
		return await this.contract.treasuryToken();
	}

	async approveToken(tokenAddress: string, amount: string): Promise<void> {
		if (!this.signer) throw new Error('Wallet not connected');

		const tokenAbi = [
			'function approve(address spender, uint256 amount) returns (bool)',
		];

		const tokenContract = new ethers.Contract(
			tokenAddress,
			tokenAbi,
			this.signer
		);
		const tx = await tokenContract.approve(
			CONTRACT_CONFIG.RideTheBus.address,
			ethers.parseEther(amount)
		);
		await tx.wait();
	}

	async getTokenBalance(
		tokenAddress: string,
		userAddress: string
	): Promise<string> {
		const tokenAbi = [
			'function balanceOf(address account) view returns (uint256)',
			'function decimals() view returns (uint8)',
		];

		const tokenContract = new ethers.Contract(
			tokenAddress,
			tokenAbi,
			this.provider
		);
		const [balance, decimals] = await Promise.all([
			tokenContract.balanceOf(userAddress),
			tokenContract.decimals(),
		]);

		return ethers.formatUnits(balance, decimals);
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

		const gameIdBn = ethers.toBigInt(gameId);

		if (callbacks.onSeedFulfilled) {
			this.contract.on(
				this.contract.filters.SeedFulfilled(gameIdBn),
				(gameId, seed) => callbacks.onSeedFulfilled!(seed)
			);
		}

		if (callbacks.onRoundPlayed) {
			this.contract.on(
				this.contract.filters.RoundPlayed(gameIdBn),
				(gameId, roundIndex, card, extra, win, newPayout) =>
					callbacks.onRoundPlayed!(
						roundIndex,
						card,
						win,
						ethers.formatEther(newPayout)
					)
			);
		}

		if (callbacks.onCashedOut) {
			this.contract.on(
				this.contract.filters.CashedOut(gameIdBn),
				(gameId, player, amount) =>
					callbacks.onCashedOut!(ethers.formatEther(amount))
			);
		}

		if (callbacks.onBusted) {
			this.contract.on(this.contract.filters.Busted(gameIdBn), () =>
				callbacks.onBusted!()
			);
		}
	}

	removeAllListeners() {
		if (this.contract) {
			this.contract.removeAllListeners();
		}
	}

	async switchToPlasmaTestnet() {
		if (!window.ethereum) throw new Error('MetaMask not installed');

		try {
			await window.ethereum.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: ethers.toQuantity(PLASMA_TESTNET.chainId) }],
			});
		} catch (error: any) {
			if (error.code === 4902) {
				await window.ethereum.request({
					method: 'wallet_addEthereumChain',
					params: [
						{
							chainId: ethers.toQuantity(PLASMA_TESTNET.chainId),
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
}

export const contractService = new ContractService();

