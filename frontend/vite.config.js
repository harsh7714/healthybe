import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-framework': ['react', 'react-dom', 'react-router-dom'],
          'vendor-jspdf': ['jspdf'],
        },
      },
    },
  },
})
