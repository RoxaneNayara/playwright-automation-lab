import type { Locator, Page } from '@playwright/test';

export class SauceInventoryPage {
  constructor(private readonly page: Page) {}

  get tituloProdutos(): Locator {
    return this.page.getByText('Products', { exact: true });
  }

  get contadorCarrinho(): Locator {
    return this.page.locator('[data-test="shopping-cart-badge"]');
  }

  get linkCarrinho(): Locator {
    return this.page.locator('[data-test="shopping-cart-link"]');
  }

  produtoPorNome(nomeProduto: string): Locator {
    return this.page.locator('[data-test="inventory-item"]').filter({ hasText: nomeProduto });
  }

  botaoAdicionarProduto(nomeProduto: string): Locator {
    return this.produtoPorNome(nomeProduto).getByRole('button', {
      name: 'Add to cart',
    });
  }

  botaoRemoverProduto(nomeProduto: string): Locator {
    return this.produtoPorNome(nomeProduto).getByRole('button', {
      name: 'Remove',
    });
  }

  async adicionarProdutoAoCarrinho(nomeProduto: string): Promise<void> {
    await this.botaoAdicionarProduto(nomeProduto).click();
  }

  async abrirCarrinho(): Promise<void> {
    await this.linkCarrinho.click();
  }

  get seletorOrdenacao(): Locator {
    return this.page.locator('[data-test="product-sort-container"]');
  }

  get precosDosProdutos(): Locator {
    return this.page.locator('[data-test="inventory-item-price"]');
  }

  async ordenarPorMenorPreco(): Promise<void> {
    await this.seletorOrdenacao.selectOption('lohi');
  }

  async ordenarPorMaiorPreco(): Promise<void> {
    await this.seletorOrdenacao.selectOption('hilo');
  }

  async obterPrecos(): Promise<number[]> {
    const textosDosPrecos = await this.precosDosProdutos.allTextContents();

    return textosDosPrecos.map((texto) => Number(texto.replace('$', '').trim()));
  }
}
