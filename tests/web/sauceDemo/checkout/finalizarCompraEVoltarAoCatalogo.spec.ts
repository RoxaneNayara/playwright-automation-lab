import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { SauceLoginFlow } from '@web/flows/sauceDemo/sauceLoginFlow';
import { SauceInventoryPage } from '@web/pages/sauceDemo/sauceInventoryPage';
import { SauceCartPage } from '@web/pages/sauceDemo/sauceCartPage';
import { SauceCheckoutInformationPage } from '@web/pages/sauceDemo/sauceCheckoutInformationPage';
import { SauceCheckoutOverviewPage } from '@web/pages/sauceDemo/sauceCheckoutOverviewPage';
import { SauceCheckoutCompletePage } from '@web/pages/sauceDemo/sauceCheckoutCompletePage';
import { sauceCheckout, sauceProdutos, sauceUsuarios } from '@web/support/sauceDemo/sauceTestData';

test.describe('Web · SauceDemo · Checkout', () => {
  test(
    'finalizar compra deve limpar o carrinho e permitir retorno ao catálogo',
    {
      tag: ['@web', '@sauceDemo', '@checkout', '@regression', '@e2e'],
    },
    async ({ page }) => {
      await allure.epic('Web');
      await allure.feature('SauceDemo');
      await allure.story('Conclusão da compra e retorno ao catálogo');
      await allure.owner('Roxy');

      const inventoryPage = new SauceInventoryPage(page);
      const cartPage = new SauceCartPage(page);
      const checkoutInformationPage = new SauceCheckoutInformationPage(page);
      const checkoutOverviewPage = new SauceCheckoutOverviewPage(page);
      const checkoutCompletePage = new SauceCheckoutCompletePage(page);

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

      await checkoutOverviewPage.finalizarCompra();

      await expect(checkoutCompletePage.mensagemCompraConcluida).toHaveText(
        'Thank you for your order!'
      );

      await expect(checkoutCompletePage.textoConfirmacao).toBeVisible();

      await expect(inventoryPage.contadorCarrinho).toHaveCount(0);

      await expect(checkoutCompletePage.botaoVoltarParaInicio).toBeVisible();

      await checkoutCompletePage.voltarParaInicio();

      await expect(inventoryPage.tituloProdutos).toBeVisible();

      await expect(inventoryPage.contadorCarrinho).toHaveCount(0);
    }
  );
});
