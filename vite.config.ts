import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { UserConfig } from 'vitest/config'

const testConfig: UserConfig['test'] = {
  environment: 'happy-dom',
  globals: true,
}

export default defineConfig({
  // @ts-expect-error vitest injeta `test` no config do vite em runtime
  test: testConfig,
  plugins: [react()],
  server: {
    port: 3010,
    host: '0.0.0.0',
  },
  preview: {
    port: 3010,
    host: '0.0.0.0',
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
