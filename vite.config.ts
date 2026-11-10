import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base: works at kjusino.github.io/lean-design-patterns/ today
// and at a custom domain root later, with no change.
export default defineConfig({
  base: './',
  plugins: [react()],
})
