import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { SauceInventoryPage } from '@web/pages/sauceDemo/sauceInventoryPage';
import { SauceCartPage } from '@web/pages/sauceDemo/sauceCartPage';
import { SauceCheckoutInformationPage } from '@web/pages/sauceDemo/sauceCheckoutInformationPage';
import { SauceCheckoutCompletePage } from '@web/pages/sauceDemo/sauceCheckoutCompletePage';
import { SauceCheckoutOverviewPage } from '@web/pages/sauceDemo/sauceCheckoutOverviewPage';
import { SauceLoginFlow } from '@web/flows/sauceDemo/sauceLoginFlow';
import { sauceCheckout, sauceProdutos, sauceUsuarios } from '@web/support/sauceDemo/sauceTestData';

test.describe('Web · SauceDemo · Checkout', () => {
  test(
    'finalizar compra deve exibir mensagem de pedido concluído',
    { tag: ['@web', '@sauceDemo', '@checkout', '@e2e'] },
    async ({ page }) => {
      await allure.epic('Web');
      await allure.feature('SauceDemo');
      await allure.story('Checkout completo');
      await allure.owner('Roxy');

      const inventoryPage = new SauceInventoryPage(page);
      const cartPage = new SauceCartPage(page);
      const checkoutInformationPage = new SauceCheckoutInformationPage(page);
      const checkoutOverviewPage = new SauceCheckoutOverviewPage(page);
      const checkoutCompletePage = new SauceCheckoutCompletePage(page);

      const credenciais = sauceUsuarios.usuarioPadrao;
      const produto = sauceProdutos.mochila;
      const cliente = sauceCheckout.clientePadrao;

      await SauceLoginFlow.entrar(page, credenciais.usuario, credenciais.senha);

      await expect(inventoryPage.tituloProdutos).toBeVisible();

      await inventoryPage.adicionarProdutoAoCarrinho(produto.nome);
      await expect(inventoryPage.contadorCarrinho).toHaveText('1');

      await inventoryPage.abrirCarrinho();

      await expect(cartPage.tituloCarrinho).toBeVisible();
      await expect(cartPage.nomeDoProduto(produto.nome)).toHaveText(produto.nome);
      await expect(cartPage.precoDoProduto(produto.nome)).toHaveText(produto.preco);

      await cartPage.iniciarCheckout();

      await expect(checkoutInformationPage.tituloCheckout).toBeVisible();

      await checkoutInformationPage.preencherDados(cliente.nome, cliente.sobrenome, cliente.cep);

      await checkoutInformationPage.continuar();

      await expect(checkoutOverviewPage.tituloRevisao).toBeVisible();
      await expect(checkoutOverviewPage.nomeDoProduto(produto.nome)).toHaveText(produto.nome);
      await expect(checkoutOverviewPage.precoDoProduto(produto.nome)).toHaveText(produto.preco);
      await expect(checkoutOverviewPage.total).toBeVisible();

      await checkoutOverviewPage.finalizarCompra();

      await expect(checkoutCompletePage.mensagemCompraConcluida).toBeVisible();

      await expect(checkoutCompletePage.textoConfirmacao).toBeVisible();

      await expect(page).toHaveURL(/checkout-complete\.html/);
    }
  );
});
