import type { Locator, Page } from '@playwright/test';

export class SauceCheckoutInformationPage {
  constructor(private readonly page: Page) {}

  get tituloCheckout(): Locator {
    return this.page.getByText('Checkout: Your Information', { exact: true });
  }

  get campoNome(): Locator {
    return this.page.locator('[data-test="firstName"]');
  }

  get campoSobrenome(): Locator {
    return this.page.locator('[data-test="lastName"]');
  }

  get campoCep(): Locator {
    return this.page.locator('[data-test="postalCode"]');
  }

  get botaoContinuar(): Locator {
    return this.page.getByRole('button', { name: 'Continue' });
  }

  get mensagemErro(): Locator {
    return this.page.locator('[data-test="error"]');
  }

  get botaoCancelar(): Locator {
    return this.page.locator('[data-test="cancel"]');
  }

  async cancelarCheckout(): Promise<void> {
    await this.botaoCancelar.click();
  }

  async preencherDados(nome: string, sobrenome: string, cep: string): Promise<void> {
    await this.campoNome.fill(nome);
    await this.campoSobrenome.fill(sobrenome);
    await this.campoCep.fill(cep);
  }

  async continuar(): Promise<void> {
    await this.botaoContinuar.click();
  }
}
