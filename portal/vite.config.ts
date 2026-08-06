import react from "@vitejs/plugin-react";
import { microfrontends } from "@vercel/microfrontends/experimental/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), microfrontends()],
});
