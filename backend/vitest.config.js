import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 20000, // mongodb-memory-server can take a few seconds to spin up
    hookTimeout: 30000,
    fileParallelism: false, // avoid running multiple in-memory Mongo instances at once
  },
});
