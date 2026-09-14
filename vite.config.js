import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createKvMiddleware } from './local/dev-kv.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'edgeone-kv-mock',
      configureServer(server) {
        server.middlewares.use(createKvMiddleware(resolve(__dirname, 'data/dev-kv.json')))
      }
    }
  ]
})
