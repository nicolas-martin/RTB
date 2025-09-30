import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
	plugins: [react()],
	publicDir: 'data',
	resolve: {
		alias: {
			'@data': '/data'
		}
	},
	server: {
		proxy: {
			'/api/goldsky': {
				target: 'https://api.goldsky.com',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api\/goldsky/, ''),
				secure: false
			}
		}
	}
})
