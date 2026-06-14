import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Use /Calendar/ base on GitHub Pages, / everywhere else
  base: process.env.GITHUB_ACTIONS ? '/Calendar/' : '/',
})
