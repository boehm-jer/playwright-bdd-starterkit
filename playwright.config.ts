import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: "features/**/*.feature",
  steps: ["steps/**/*.ts", "fixtures.ts"],
});

export default defineConfig({
  testDir,
  snapshotDir: 'snapshots',
  reporter: 'html',
  retries: process.env.CI ? 2 : 0,
  fullyParallel: true,
  timeout: 30000,
  use: {}
});
