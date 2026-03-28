import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/images': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        bypass(req) {
          // Only proxy if it looks like an image file request
          if (req.url && /\.(png|jpg|jpeg|gif|webp)(\?.*)?$/.test(req.url)) {
            return undefined; // proxy it
          }
          return req.url; // let Vite handle it
        },
      },
    },
  },
})