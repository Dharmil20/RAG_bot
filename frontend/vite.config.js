import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    host: '0.0.0.0', // Important for ngrok access
    port: 5173, // Default Vite port, adjust if needed
    allowedHosts: [
      "6b19-49-36-113-17.ngrok-free.app",
      "93a5-49-36-115-7.ngrok-free.app"
    ],
    cors: true, // Allow CORS requests
  }
});
