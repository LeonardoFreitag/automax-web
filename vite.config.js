import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: './chamados',
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  }
})
