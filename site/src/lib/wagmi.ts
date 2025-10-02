import { http, createConfig } from 'wagmi';
import { plasma, plasmaTestnet } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
	chains: [plasma, plasmaTestnet],
	connectors: [
		injected(), // MetaMask and other injected wallets
	],
	transports: {
		[plasma.id]: http(),
		[palmTestnet.id]: http(),
	},
	ssr: true,
});
