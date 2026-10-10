import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react({ jsxRuntime: 'automatic' })],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
  },
})
