import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // The dummy API keeps its data in localStorage, which a browser-like
    // environment provides
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});
