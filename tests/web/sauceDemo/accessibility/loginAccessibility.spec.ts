import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as allure from 'allure-js-commons';
import { config } from '@core/config/configurationManager';
import { SauceLoginPage } from '@web/pages/sauceDemo/sauceLoginPage';

test.describe('Web · SauceDemo · Acessibilidade', () => {
  test(
    'tela de login não deve possuir violações automáticas WCAG A e AA',
    { tag: ['@web', '@sauceDemo', '@accessibility'] },
    async ({ page }) => {
      await allure.epic('Web');
      await allure.feature('SauceDemo');
      await allure.story('Acessibilidade da tela de login');
      await allure.owner('Roxy');

      const baseUrl = config.getBaseUrl('SauceDemoWeb');

      expect(baseUrl, 'BaseUrl não configurada para SauceDemoWeb').toBeTruthy();

      const loginPage = new SauceLoginPage(page);

      await loginPage.abrir(baseUrl as string);

      const resultadoAcessibilidade = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(resultadoAcessibilidade.violations).toEqual([]);
    }
  );
});
