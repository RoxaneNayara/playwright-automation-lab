import type { Page } from '@playwright/test';
import { config } from '@core/config/configurationManager';
import { SauceLoginPage } from '@web/pages/sauceDemo/sauceLoginPage';

export class SauceLoginFlow {
  static async entrar(page: Page, usuario: string, senha: string): Promise<void> {
    const baseUrl = config.getBaseUrl('SauceDemoWeb');

    if (!baseUrl) {
      throw new Error('BaseUrl não configurada para SauceDemoWeb');
    }

    const loginPage = new SauceLoginPage(page);

    await loginPage.abrir(baseUrl);
    await loginPage.entrar(usuario, senha);
  }
}
