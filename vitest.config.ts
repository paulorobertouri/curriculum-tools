/// <reference types="vitest" />
import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    setupFiles: ['./tests/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
