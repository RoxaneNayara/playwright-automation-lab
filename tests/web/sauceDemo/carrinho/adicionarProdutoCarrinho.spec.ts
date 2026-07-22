import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { SauceInventoryPage } from '@web/pages/sauceDemo/sauceInventoryPage';
import { SauceCartPage } from '@web/pages/sauceDemo/sauceCartPage';
import { SauceLoginFlow } from '@web/flows/sauceDemo/sauceLoginFlow';
import { sauceProdutos, sauceUsuarios } from '@web/support/sauceDemo/sauceTestData';

test.describe('Web · SauceDemo · Carrinho', () => {
  test(
    'adicionar um produto deve exibir seus dados corretamente no carrinho',
    { tag: ['@web', '@sauceDemo', '@carrinho'] },
    async ({ page }) => {
      await allure.epic('Web');
      await allure.feature('SauceDemo');
      await allure.story('Adicionar produto ao carrinho');
      await allure.owner('Roxy');

      const inventoryPage = new SauceInventoryPage(page);
      const cartPage = new SauceCartPage(page);

      const credenciais = sauceUsuarios.usuarioPadrao;
      const produto = sauceProdutos.mochila;

      await SauceLoginFlow.entrar(page, credenciais.usuario, credenciais.senha);

      await expect(inventoryPage.tituloProdutos).toBeVisible();

      await inventoryPage.adicionarProdutoAoCarrinho(produto.nome);

      await expect(inventoryPage.contadorCarrinho).toHaveText('1');
      await expect(
        inventoryPage.produtoPorNome(produto.nome).getByRole('button', {
          name: 'Remove',
        })
      ).toBeVisible();

      await inventoryPage.abrirCarrinho();

      await expect(cartPage.tituloCarrinho).toBeVisible();
      await expect(cartPage.itensDoCarrinho).toHaveCount(1);
      await expect(cartPage.nomeDoProduto(produto.nome)).toHaveText(produto.nome);
      await expect(cartPage.precoDoProduto(produto.nome)).toHaveText(produto.preco);
      await expect(cartPage.quantidadeDoProduto(produto.nome)).toHaveText('1');
    }
  );
});
