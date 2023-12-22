/// <reference types="vitest" />
import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],

  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Sinai',
      fileName: 'sinai',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },

  test: {
    environment: 'jsdom',
  },
})
