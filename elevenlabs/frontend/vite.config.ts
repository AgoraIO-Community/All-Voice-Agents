import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const frontendDirectory = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  envDir: resolve(frontendDirectory, "../.."),
  plugins: [react()],
});
