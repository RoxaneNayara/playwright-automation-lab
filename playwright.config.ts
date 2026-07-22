import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  fullyParallel: true,

  forbidOnly: Boolean(process.env.CI),

  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['allure-playwright', { resultsDir: 'allure-results' }],
  ],

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'web-todo-chromium',
      testDir: './tests/web/todo',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'web-todo-firefox',
      testDir: './tests/web/todo',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'web-todo-webkit',
      testDir: './tests/web/todo',
      use: {
        ...devices['Desktop Safari'],
      },
    },

    {
      name: 'web-saucedemo-chromium',
      testDir: './tests/web/sauceDemo',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'web-saucedemo-firefox',
      testDir: './tests/web/sauceDemo',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'web-saucedemo-webkit',
      testDir: './tests/web/sauceDemo',
      use: {
        ...devices['Desktop Safari'],
      },
    },
  ],
});
