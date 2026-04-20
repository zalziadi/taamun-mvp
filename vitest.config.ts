import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

/**
 * Minimal vitest config — enables .tsx tests (JSX transform) and the `@/*`
 * path alias used throughout `src/`.
 *
 * Added during Phase 11.05 because AwarenessTrajectory is the first component
 * that requires a JSX-transformed test (project tsconfig uses jsx:"preserve",
 * which vite's default SSR transform cannot handle). Zero new deps — vitest
 * ships esbuild for JSX transform.
 */
export default defineConfig({
  oxc: {
    jsx: {
      runtime: "automatic",
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
