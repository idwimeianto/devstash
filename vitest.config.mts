import { defineConfig } from "vitest/config";

// Unit tests cover server actions and utilities only, so they run in Node without a DOM.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
  },
});
