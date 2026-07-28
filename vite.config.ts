import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1100,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@stellar") || id.includes("stellar-sdk")) return "stellar";
          if (id.includes("framer-motion") || id.includes("motion-dom")) return "motion";
          if (id.includes("@sentry")) return "monitoring";
          if (id.includes("@radix-ui")) return "radix";
          return "vendor";
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
