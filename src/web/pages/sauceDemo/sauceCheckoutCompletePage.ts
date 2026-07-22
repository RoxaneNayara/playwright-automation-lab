import type { Locator, Page } from '@playwright/test';

export class SauceCheckoutCompletePage {
  constructor(private readonly page: Page) {}

  get mensagemCompraConcluida(): Locator {
    return this.page.getByText('Thank you for your order!', {
      exact: true,
    });
  }

  get textoConfirmacao(): Locator {
    return this.page.getByText(
      'Your order has been dispatched, and will arrive just as fast as the pony can get there!',
      { exact: true }
    );
  }

  get botaoVoltarParaInicio(): Locator {
    return this.page.locator('[data-test="back-to-products"]');
  }

  async voltarParaInicio(): Promise<void> {
    await this.botaoVoltarParaInicio.click();
  }
}
