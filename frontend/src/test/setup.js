import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// RTL's automatic cleanup-between-tests relies on detecting a global
// `afterEach` — since this project intentionally runs with `globals: false`
// (explicit imports over ambient globals), it has to be wired up manually
// here instead. Without this, every test in a file renders into the same
// unclean DOM as every test before it.
afterEach(() => {
  cleanup();
});
