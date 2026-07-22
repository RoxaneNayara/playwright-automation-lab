import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { SauceLoginFlow } from '@web/flows/sauceDemo/sauceLoginFlow';
import { SauceInventoryPage } from '@web/pages/sauceDemo/sauceInventoryPage';
import { SauceCartPage } from '@web/pages/sauceDemo/sauceCartPage';
import { sauceProdutos, sauceUsuarios } from '@web/support/sauceDemo/sauceTestData';

test.describe('Web · SauceDemo · Carrinho', () => {
  test(
    'remover um produto deve atualizar itens e contador do carrinho',
    {
      tag: ['@web', '@sauceDemo', '@carrinho', '@regression'],
    },
    async ({ page }) => {
      await allure.epic('Web');
      await allure.feature('SauceDemo');
      await allure.story('Remoção de produto do carrinho');
      await allure.owner('Roxy');

      const inventoryPage = new SauceInventoryPage(page);
      const cartPage = new SauceCartPage(page);

      const credenciais = sauceUsuarios.usuarioPadrao;
      const produtoMantido = sauceProdutos.mochila;
      const produtoRemovido = sauceProdutos.luzDeBicicleta;

      await SauceLoginFlow.entrar(page, credenciais.usuario, credenciais.senha);

      await inventoryPage.adicionarProdutoAoCarrinho(produtoMantido.nome);

      await inventoryPage.adicionarProdutoAoCarrinho(produtoRemovido.nome);

      await expect(inventoryPage.contadorCarrinho).toHaveText('2');

      await inventoryPage.abrirCarrinho();

      await expect(cartPage.itensDoCarrinho).toHaveCount(2);

      await cartPage.removerProduto(produtoRemovido.nome);

      await expect(cartPage.itemPorNome(produtoRemovido.nome)).toHaveCount(0);

      await expect(cartPage.itemPorNome(produtoMantido.nome)).toBeVisible();

      await expect(cartPage.itensDoCarrinho).toHaveCount(1);

      await expect(inventoryPage.contadorCarrinho).toHaveText('1');
    }
  );
});
