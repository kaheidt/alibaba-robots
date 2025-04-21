import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(),
      {
        name: 'html-env-variables',
        transformIndexHtml: {
          enforce: 'pre',
          transform(html) {
            return html.replace(/%VITE_CDN_URL%/g, env.VITE_CDN_URL || '')
          }
        }
      }
    ],
    optimizeDeps: {
      include: ['ali-oss']
    },
    build: {
      rollupOptions: {
        external: ['mysql2', 'crypto']
      }
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        }
      }
    }
  }
})
