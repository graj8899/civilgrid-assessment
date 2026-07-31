/// <reference types="vitest" />

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // No jsdom is needed because spatial.ts is pure.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
