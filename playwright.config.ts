import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: "features/**/*.feature",
  steps: "features/**/*.ts",
});

export default defineConfig({
  testDir,
  reporter: 'html',
  use: {
    testIdAttribute: 'id' //default = 'data-testid'
  }
});
