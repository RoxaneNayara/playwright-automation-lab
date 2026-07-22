import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { SauceLoginFlow } from '@web/flows/sauceDemo/sauceLoginFlow';
import { SauceInventoryPage } from '@web/pages/sauceDemo/sauceInventoryPage';
import { SauceCartPage } from '@web/pages/sauceDemo/sauceCartPage';
import { SauceCheckoutInformationPage } from '@web/pages/sauceDemo/sauceCheckoutInformationPage';
import { SauceCheckoutOverviewPage } from '@web/pages/sauceDemo/sauceCheckoutOverviewPage';
import { sauceCheckout, sauceProdutos, sauceUsuarios } from '@web/support/sauceDemo/sauceTestData';

test.describe('Web · SauceDemo · Checkout', () => {
  test(
    'cancelar na revisão deve retornar ao catálogo e manter o produto no carrinho',
    {
      tag: ['@web', '@sauceDemo', '@checkout', '@regression'],
    },
    async ({ page }) => {
      await allure.epic('Web');
      await allure.feature('SauceDemo');
      await allure.story('Cancelamento na revisão do pedido');
      await allure.owner('Roxy');

      const inventoryPage = new SauceInventoryPage(page);
      const cartPage = new SauceCartPage(page);
      const checkoutInformationPage = new SauceCheckoutInformationPage(page);
      const checkoutOverviewPage = new SauceCheckoutOverviewPage(page);

      const credenciais = sauceUsuarios.usuarioPadrao;
      const cliente = sauceCheckout.clientePadrao;
      const produto = sauceProdutos.mochila;

      await SauceLoginFlow.entrar(page, credenciais.usuario, credenciais.senha);

      await inventoryPage.adicionarProdutoAoCarrinho(produto.nome);

      await expect(inventoryPage.contadorCarrinho).toHaveText('1');

      await inventoryPage.abrirCarrinho();

      await expect(cartPage.itemPorNome(produto.nome)).toBeVisible();

      await cartPage.iniciarCheckout();

      await checkoutInformationPage.preencherDados(cliente.nome, cliente.sobrenome, cliente.cep);

      await checkoutInformationPage.continuar();

      await expect(checkoutOverviewPage.tituloRevisao).toBeVisible();

      await expect(checkoutOverviewPage.botaoCancelar).toBeVisible();

      await checkoutOverviewPage.cancelarCheckout();

      await expect(inventoryPage.tituloProdutos).toBeVisible();

      await expect(inventoryPage.contadorCarrinho).toHaveText('1');

      await expect(inventoryPage.botaoRemoverProduto(produto.nome)).toBeVisible();
    }
  );
});
