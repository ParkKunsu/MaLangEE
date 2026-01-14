import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["**/node_modules/**", "**/e2e/**", "**/.next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "src/features/**/*.{ts,tsx}",
        "src/shared/**/*.{ts,tsx}",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.stories.{ts,tsx}",
        "**/index.ts",
        "**/__init__.ts",
        "src/app/**",
      ],
      thresholds: {
        // Phase 5 목표: 핵심 코드 테스트 완료
        // WebSocket, API 클라이언트 등 통합 테스트 필요 영역은 E2E로 커버
        statements: 20,
        branches: 60,
        functions: 35,
        lines: 20,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});

