import type { Locator, Page } from '@playwright/test';

export class SauceCheckoutOverviewPage {
  constructor(private readonly page: Page) {}

  get tituloRevisao(): Locator {
    return this.page.getByText('Checkout: Overview', {
      exact: true,
    });
  }

  get itensDoPedido(): Locator {
    return this.page.locator('[data-test="inventory-item"]');
  }

  get subtotal(): Locator {
    return this.page.locator('[data-test="subtotal-label"]');
  }

  get imposto(): Locator {
    return this.page.locator('[data-test="tax-label"]');
  }

  get total(): Locator {
    return this.page.locator('[data-test="total-label"]');
  }

  get botaoFinalizar(): Locator {
    return this.page.getByRole('button', {
      name: 'Finish',
    });
  }

  get botaoCancelar(): Locator {
    return this.page.locator('[data-test="cancel"]');
  }

  async cancelarCheckout(): Promise<void> {
    await this.botaoCancelar.click();
  }

  itemPorNome(nomeProduto: string): Locator {
    return this.itensDoPedido.filter({
      hasText: nomeProduto,
    });
  }

  nomeDoProduto(nomeProduto: string): Locator {
    return this.itemPorNome(nomeProduto).locator('[data-test="inventory-item-name"]');
  }

  precoDoProduto(nomeProduto: string): Locator {
    return this.itemPorNome(nomeProduto).locator('[data-test="inventory-item-price"]');
  }

  async finalizarCompra(): Promise<void> {
    await this.botaoFinalizar.click();
  }
}
