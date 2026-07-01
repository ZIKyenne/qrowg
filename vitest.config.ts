import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["apps/web/**/*.{test,spec}.ts", "apps/web/**/*.{test,spec}.tsx"],
    environment: "node",
    reporters: "default",
  },
})
