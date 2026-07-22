import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { config } from '@core/config/configurationManager';
import { SauceLoginPage } from '@web/pages/sauceDemo/sauceLoginPage';
import { sauceUsuarios } from '@web/support/sauceDemo/sauceTestData';

test.describe('Web · SauceDemo · Login', () => {
  test(
    'credenciais inválidas devem impedir o acesso ao catálogo',
    { tag: ['@web', '@sauceDemo', '@login', '@negative'] },
    async ({ page }) => {
      await allure.epic('Web');
      await allure.feature('SauceDemo');
      await allure.story('Login inválido');
      await allure.owner('Roxy');

      const baseUrl = config.getBaseUrl('SauceDemoWeb');

      expect(baseUrl, 'BaseUrl não configurada para SauceDemoWeb').toBeTruthy();

      const loginPage = new SauceLoginPage(page);
      const credenciais = sauceUsuarios.credencialInvalida;

      await loginPage.abrir(baseUrl as string);

      await loginPage.entrar(credenciais.usuario, credenciais.senha);

      await expect(loginPage.mensagemErro).toBeVisible();

      await expect(loginPage.mensagemErro).toContainText(
        'Username and password do not match any user in this service'
      );

      await expect(page).toHaveURL(baseUrl as string);
    }
  );
});
