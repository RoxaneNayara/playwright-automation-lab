import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { SauceLoginFlow } from '@web/flows/sauceDemo/sauceLoginFlow';
import { SauceInventoryPage } from '@web/pages/sauceDemo/sauceInventoryPage';
import { SauceCartPage } from '@web/pages/sauceDemo/sauceCartPage';
import { SauceCheckoutInformationPage } from '@web/pages/sauceDemo/sauceCheckoutInformationPage';
import { SauceCheckoutOverviewPage } from '@web/pages/sauceDemo/sauceCheckoutOverviewPage';
import {
  converterPrecoParaNumero,
  sauceCheckout,
  sauceProdutos,
  sauceUsuarios,
} from '@web/support/sauceDemo/sauceTestData';

test.describe('Web · SauceDemo · Checkout', () => {
  test(
    'subtotal deve corresponder à soma dos produtos selecionados',
    {
      tag: ['@web', '@sauceDemo', '@checkout', '@regression', '@financial'],
    },
    async ({ page }) => {
      await allure.epic('Web');
      await allure.feature('SauceDemo');
      await allure.story('Validação financeira do subtotal');
      await allure.owner('Roxy');

      const inventoryPage = new SauceInventoryPage(page);
      const cartPage = new SauceCartPage(page);
      const checkoutInformationPage = new SauceCheckoutInformationPage(page);
      const checkoutOverviewPage = new SauceCheckoutOverviewPage(page);

      const credenciais = sauceUsuarios.usuarioPadrao;
      const cliente = sauceCheckout.clientePadrao;

      const produtos = [sauceProdutos.mochila, sauceProdutos.luzDeBicicleta];

      await SauceLoginFlow.entrar(page, credenciais.usuario, credenciais.senha);

      for (const produto of produtos) {
        await inventoryPage.adicionarProdutoAoCarrinho(produto.nome);
      }

      await expect(inventoryPage.contadorCarrinho).toHaveText(produtos.length.toString());

      await inventoryPage.abrirCarrinho();

      await expect(cartPage.itensDoCarrinho).toHaveCount(produtos.length);

      for (const produto of produtos) {
        await expect(cartPage.nomeDoProduto(produto.nome)).toHaveText(produto.nome);

        await expect(cartPage.precoDoProduto(produto.nome)).toHaveText(produto.preco);
      }

      await cartPage.iniciarCheckout();

      await checkoutInformationPage.preencherDados(cliente.nome, cliente.sobrenome, cliente.cep);

      await checkoutInformationPage.continuar();

      await expect(checkoutOverviewPage.tituloRevisao).toBeVisible();

      const subtotalEsperado = produtos.reduce(
        (total, produto) => total + converterPrecoParaNumero(produto.preco),
        0
      );

      await expect(checkoutOverviewPage.subtotal).toContainText(`$${subtotalEsperado.toFixed(2)}`);
    }
  );
});
