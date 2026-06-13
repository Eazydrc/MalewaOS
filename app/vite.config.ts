import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: './',          // Chemins relatifs — requis pour Electron (file://)
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',  // Force IPv4
    port: 4000,
    strictPort: false, // Laisse Vite choisir si occupé
    open: false,
  },
});
