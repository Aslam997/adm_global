import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,        // equivalent to 0.0.0.0
    port: 5173,
    strictPort: true,
    // For Docker on Windows you may also want:
    watch: { usePolling: true },
  },
  plugins: [
    react(),
    tailwindcss()
  ],
})
