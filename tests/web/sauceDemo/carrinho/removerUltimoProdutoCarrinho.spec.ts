import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { SauceLoginFlow } from '@web/flows/sauceDemo/sauceLoginFlow';
import { SauceInventoryPage } from '@web/pages/sauceDemo/sauceInventoryPage';
import { SauceCartPage } from '@web/pages/sauceDemo/sauceCartPage';
import { sauceProdutos, sauceUsuarios } from '@web/support/sauceDemo/sauceTestData';

test.describe('Web · SauceDemo · Carrinho', () => {
  test(
    'remover o último produto deve deixar o carrinho vazio',
    {
      tag: ['@web', '@sauceDemo', '@carrinho', '@regression'],
    },
    async ({ page }) => {
      await allure.epic('Web');
      await allure.feature('SauceDemo');
      await allure.story('Remoção do último produto do carrinho');
      await allure.owner('Roxy');

      const inventoryPage = new SauceInventoryPage(page);
      const cartPage = new SauceCartPage(page);

      const credenciais = sauceUsuarios.usuarioPadrao;
      const produto = sauceProdutos.mochila;

      await SauceLoginFlow.entrar(page, credenciais.usuario, credenciais.senha);

      await inventoryPage.adicionarProdutoAoCarrinho(produto.nome);

      await expect(inventoryPage.contadorCarrinho).toHaveText('1');

      await inventoryPage.abrirCarrinho();

      await expect(cartPage.itensDoCarrinho).toHaveCount(1);

      await expect(cartPage.itemPorNome(produto.nome)).toBeVisible();

      await cartPage.removerProduto(produto.nome);

      await expect(cartPage.itemPorNome(produto.nome)).toHaveCount(0);

      await expect(cartPage.itensDoCarrinho).toHaveCount(0);

      await expect(inventoryPage.contadorCarrinho).toHaveCount(0);
    }
  );
});
