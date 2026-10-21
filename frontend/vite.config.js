import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const srcPath = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3001'
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@components': path.resolve(srcPath, 'components'),
        '@features': path.resolve(srcPath, 'features'),
        '@hooks': path.resolve(srcPath, 'hooks'),
        '@services': path.resolve(srcPath, 'services'),
        '@utils': path.resolve(srcPath, 'utils'),
        '@context': path.resolve(srcPath, 'context'),
        '@constants': path.resolve(srcPath, 'constants'),
        '@layouts': path.resolve(srcPath, 'layouts'),
        '@app': path.resolve(srcPath, 'app'),
        '@styles': path.resolve(srcPath, 'styles'),
        '@assets': path.resolve(srcPath, 'assets'),
        '@': srcPath,
      },
    },
    server: { proxy: { '/api': apiTarget, '/health': apiTarget } },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-framework': ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
  }
})
