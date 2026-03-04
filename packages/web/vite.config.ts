import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default ({ mode }) => {
  // Load .env variables based on current mode
  const env = loadEnv(mode, process.cwd(), '')

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: env.VITE_API_URL || 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
})
