import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    // Exclude optional dependencies that may not be installed
    exclude: ['@sentry/react', '@sentry/tracing'],
  },
  resolve: {
    alias: {
      // Prevent Vite from trying to resolve optional Sentry imports
      '@sentry/react': '@sentry/react',
      '@sentry/tracing': '@sentry/tracing',
    },
  },
  build: {
    // Enable code splitting and optimization
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@headlessui/react', '@heroicons/react'],
          // API and utilities
          'api-client': ['axios'],
        },
      },
    },
    // Minification and optimization
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
})