import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Database tests share the local ganira_test database, so run files one at a time.
    fileParallelism: false,
  },
});
