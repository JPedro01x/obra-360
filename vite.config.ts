import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: { include: ['web-ifc', 'react-dom/server'] },
  server: {
    port: 3000,
    open: false,
    watch: {
      ignored: [
        '**/releases/**',
        '**/backups/**',
        '**/test-results/**',
        '**/scratch/**',
        '**/obra360-backend/**',
      ],
    },
    fs: {
      deny: [
        '.env',
        '.env.*',
        '*.{crt,pem}',
        '**/.git/**',
        '**/.aws/**',
        '**/.codex/**',
        '**/.agents/**',
        '**/obra360-backend/**',
        '**/releases/**',
        '**/backups/**',
        '**/test-results/**',
        '**/scratch/**',
        '**/*.local',
        '**/*.{key,p12,pfx,jks,mv.db,dump}',
      ],
    },
    proxy: {
      '/api': {
        target: process.env.OBRA360_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-three': ['three'],
          'vendor-ui': ['lucide-react', 'framer-motion', 'canvas-confetti'],
        },
      },
    },
  },
});
