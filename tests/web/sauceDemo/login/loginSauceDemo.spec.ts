import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { config } from '@core/config/configurationManager';
import { SauceLoginPage } from '@web/pages/sauceDemo/sauceLoginPage';
import { sauceUsuarios } from '@web/support/sauceDemo/sauceTestData';

test.describe('Web · SauceDemo · Login', () => {
  test(
    'login com credenciais válidas deve acessar o catálogo de produtos',
    { tag: ['@web', '@sauceDemo', '@smoke'] },
    async ({ page }) => {
      await allure.epic('Web');
      await allure.feature('SauceDemo');
      await allure.story('Login com sucesso');
      await allure.owner('Roxane');

      const baseUrl = config.getBaseUrl('SauceDemoWeb');
      expect(baseUrl, 'BaseUrl não configurada para SauceDemoWeb').toBeTruthy();

      const loginPage = new SauceLoginPage(page);
      const credenciais = sauceUsuarios.usuarioPadrao;

      await loginPage.abrir(baseUrl as string);
      await loginPage.entrar(credenciais.usuario, credenciais.senha);

      await expect(page).toHaveURL(/inventory\.html/);
      await expect(page.getByText('Products', { exact: true })).toBeVisible();
    }
  );
});
