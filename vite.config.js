import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    assetsDir: '',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
          }
        }
      }
    }
  },
  resolve: {
    preserveSymlinks: true,
    dedupe: ['react', 'react-dom']
  },
  server: {
    port: 3000,
    open: true
  }
})
