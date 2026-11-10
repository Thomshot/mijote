import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Publié sur GitHub Pages sous /mijote/
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1000 },
});
