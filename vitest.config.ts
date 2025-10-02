import { defineConfig } from 'vitest/config'
import path from 'path'
import fs from 'fs'

// Lightweight manual alias extraction from tsconfig (if paths defined)
const alias: Record<string, string> = {}
try {
  const tsconfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'tsconfig.json'), 'utf-8'))
  const paths = tsconfig.compilerOptions?.paths || {}
  for (const [key, value] of Object.entries(paths)) {
    const normalizedKey = key.replace(/\/*$/, '')
    const target = Array.isArray(value) ? value[0] : value
    if (typeof target === 'string') {
      alias[normalizedKey] = path.resolve(__dirname, target.replace(/\/*$/, ''))
    }
  }
} catch {
  // ignore
}

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src'), ...alias } },
  test: {
    environment: 'node',
    reporters: ['default'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text','html'],
      exclude: ['src/app/**','**/*.d.ts','**/.next/**']
    }
  }
})
