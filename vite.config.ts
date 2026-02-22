import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react';
          if (id.includes('node_modules/react-router')) return 'router';
          if (id.includes('node_modules/recharts')) return 'recharts';
          if (id.includes('node_modules/lucide-react')) return 'lucide';
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
})
