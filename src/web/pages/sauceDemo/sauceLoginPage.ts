import type { Locator, Page } from '@playwright/test';

export class SauceLoginPage {
  constructor(private readonly page: Page) {}

  get campoUsuario(): Locator {
    return this.page.getByPlaceholder('Username');
  }

  get campoSenha(): Locator {
    return this.page.getByPlaceholder('Password');
  }

  get botaoLogin(): Locator {
    return this.page.getByRole('button', { name: 'Login' });
  }

  get mensagemErro(): Locator {
    return this.page.locator('[data-test="error"]');
  }

  async abrir(baseUrl: string): Promise<void> {
    await this.page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  }

  async entrar(usuario: string, senha: string): Promise<void> {
    await this.campoUsuario.fill(usuario);
    await this.campoSenha.fill(senha);
    await this.botaoLogin.click();
  }
}
