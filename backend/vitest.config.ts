import { defineConfig } from 'vitest/config';

// `tsc` emits compiled test files into dist/; running those twice would fail on stale copies.
export default defineConfig({ test: { exclude: ['dist/**', 'node_modules/**'] } });
