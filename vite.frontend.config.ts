import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  root: 'src/frontend',
  base: '/react/',
  build: {
    outDir: '../../public/react',
    emptyOutDir: true,
  },
})
