import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: { include: ['web-ifc', 'react-dom/server'] },
  server: {
    port: 3000,
    open: false,
    proxy: { '/api': { target: process.env.OBRA360_PROXY_TARGET || 'http://localhost:8080', changeOrigin: true } }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-three': ['three'],
          'vendor-ui': ['lucide-react', 'framer-motion', 'canvas-confetti']
        }
      }
    }
  }
})
