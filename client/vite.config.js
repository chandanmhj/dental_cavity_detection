import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Allow the dev server to accept requests proxied through the provided host
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Add the exact host you saw in the error message here
    allowedHosts: [
      'unforcibly-meritless-aurore.ngrok-free.dev'
    ]
  }
})
