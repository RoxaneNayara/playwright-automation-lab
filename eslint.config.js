import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

/**
 * ESLint flat config (ESLint 9 + typescript-eslint). Cobre o codigo-fonte TS e
 * os specs do Playwright.
 */
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-empty-pattern': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-skipped-test': 'off',
      'playwright/expect-expect': [
        'warn',
        { assertFunctionNames: ['expect', 'status', 'badRequestComMensagem', 'graphQLData'] },
      ],
      'playwright/prefer-hooks-on-top': 'off',
    },
  },
  {
    ignores: [
      'node_modules/',
      'allure-results/',
      'allure-report/',
      'playwright-report/',
      'test-results/',
      '.auth/',
    ],
  }
);
