import { defineConfig } from "@playwright/test";
import fs from "fs";

const isReplit = Boolean(process.env.REPL_ID || process.env.REPLIT_DEV_DOMAIN);
const nixChromium = "/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium";
const executablePath = process.env.CHROMIUM_PATH
  ? process.env.CHROMIUM_PATH
  : isReplit && fs.existsSync(nixChromium)
    ? nixChromium
    : undefined;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: "http://localhost:5000",
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: {
    command: "npm run dev",
    port: 5000,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
