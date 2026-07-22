import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { SauceLoginFlow } from '@web/flows/sauceDemo/sauceLoginFlow';
import { SauceInventoryPage } from '@web/pages/sauceDemo/sauceInventoryPage';
import { SauceCartPage } from '@web/pages/sauceDemo/sauceCartPage';
import { SauceCheckoutInformationPage } from '@web/pages/sauceDemo/sauceCheckoutInformationPage';
import { sauceProdutos, sauceUsuarios } from '@web/support/sauceDemo/sauceTestData';

test.describe('Web · SauceDemo · Checkout', () => {
  test(
    'cancelar checkout deve retornar ao carrinho e manter o produto',
    {
      tag: ['@web', '@sauceDemo', '@checkout', '@regression'],
    },
    async ({ page }) => {
      await allure.epic('Web');
      await allure.feature('SauceDemo');
      await allure.story('Cancelamento do checkout');
      await allure.owner('Roxy');

      const inventoryPage = new SauceInventoryPage(page);
      const cartPage = new SauceCartPage(page);
      const checkoutInformationPage = new SauceCheckoutInformationPage(page);

      const credenciais = sauceUsuarios.usuarioPadrao;
      const produto = sauceProdutos.mochila;

      await SauceLoginFlow.entrar(page, credenciais.usuario, credenciais.senha);

      await inventoryPage.adicionarProdutoAoCarrinho(produto.nome);

      await expect(inventoryPage.contadorCarrinho).toHaveText('1');

      await inventoryPage.abrirCarrinho();

      await expect(cartPage.itemPorNome(produto.nome)).toBeVisible();

      await cartPage.iniciarCheckout();

      await expect(checkoutInformationPage.botaoCancelar).toBeVisible();

      await checkoutInformationPage.cancelarCheckout();

      await expect(cartPage.itemPorNome(produto.nome)).toBeVisible();

      await expect(cartPage.itensDoCarrinho).toHaveCount(1);

      await expect(inventoryPage.contadorCarrinho).toHaveText('1');
    }
  );
});
