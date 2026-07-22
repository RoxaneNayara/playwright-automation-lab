import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { config } from '@core/config/configurationManager';
import { SauceLoginPage } from '@web/pages/sauceDemo/sauceLoginPage';
import { sauceUsuarios } from '@web/support/sauceDemo/sauceTestData';

test.describe('Web · SauceDemo · Login', () => {
  test(
    'usuário bloqueado deve visualizar mensagem de acesso impedido',
    { tag: ['@web', '@sauceDemo', '@login', '@negative'] },
    async ({ page }) => {
      await allure.epic('Web');
      await allure.feature('SauceDemo');
      await allure.story('Usuário bloqueado');
      await allure.owner('Roxy');

      const baseUrl = config.getBaseUrl('SauceDemoWeb');

      expect(baseUrl, 'BaseUrl não configurada para SauceDemoWeb').toBeTruthy();

      const loginPage = new SauceLoginPage(page);
      const credenciais = sauceUsuarios.usuarioBloqueado;

      await loginPage.abrir(baseUrl as string);
      await loginPage.entrar(credenciais.usuario, credenciais.senha);

      await expect(loginPage.mensagemErro).toBeVisible();

      await expect(loginPage.mensagemErro).toContainText('Sorry, this user has been locked out');

      await expect(page).toHaveURL(baseUrl as string);
    }
  );
});
