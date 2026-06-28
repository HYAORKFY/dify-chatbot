import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 通过本地代理转发 Dify API 请求，避免浏览器跨域 (CORS) 限制
      '/dify-api': {
        target: 'https://api.dify.ai/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dify-api/, ''),
      },
    },
  },
})
