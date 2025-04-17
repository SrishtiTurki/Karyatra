import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Default Vite port
    strictPort: true, // Ensures Vite doesn't switch to another port
    cors: true, // Enable CORS (if needed)
    configureServer: (server) => {
      server.middlewares.use((req, res, next) => {
        res.setHeader(
          "Content-Security-Policy",
          "script-src 'self' https://apis.google.com; frame-src 'self' https://accounts.google.com; connect-src 'self' https://www.googleapis.com;"
        );
        next();
      });
    },
  },
});


