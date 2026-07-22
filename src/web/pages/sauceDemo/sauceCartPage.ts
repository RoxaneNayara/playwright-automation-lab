import type { Locator, Page } from '@playwright/test';

export class SauceCartPage {
  constructor(private readonly page: Page) {}

  get tituloCarrinho(): Locator {
    return this.page.getByText('Your Cart', { exact: true });
  }

  get itensDoCarrinho(): Locator {
    return this.page.locator('[data-test="inventory-item"]');
  }

  get botaoCheckout(): Locator {
    return this.page.getByRole('button', { name: 'Checkout' });
  }

  itemPorNome(nomeProduto: string): Locator {
    return this.itensDoCarrinho.filter({ hasText: nomeProduto });
  }

  nomeDoProduto(nomeProduto: string): Locator {
    return this.itemPorNome(nomeProduto).locator('[data-test="inventory-item-name"]');
  }

  precoDoProduto(nomeProduto: string): Locator {
    return this.itemPorNome(nomeProduto).locator('[data-test="inventory-item-price"]');
  }

  quantidadeDoProduto(nomeProduto: string): Locator {
    return this.itemPorNome(nomeProduto).locator('[data-test="item-quantity"]');
  }

  async iniciarCheckout(): Promise<void> {
    await this.botaoCheckout.click();
  }

  botaoRemoverProduto(nomeProduto: string): Locator {
    return this.itemPorNome(nomeProduto).getByRole('button', {
      name: 'Remove',
    });
  }

  async removerProduto(nomeProduto: string): Promise<void> {
    await this.botaoRemoverProduto(nomeProduto).click();
  }

  get botaoContinuarComprando(): Locator {
    return this.page.locator('[data-test="continue-shopping"]');
  }

  async continuarComprando(): Promise<void> {
    await this.botaoContinuarComprando.click();
  }
}
