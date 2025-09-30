import { createRoot } from 'react-dom/client'
import App from './App'
import { MetaMaskProvider } from './hooks/useMetaMask'

createRoot(document.getElementById('root')!).render(
	<MetaMaskProvider>
		<App />
	</MetaMaskProvider>
)
