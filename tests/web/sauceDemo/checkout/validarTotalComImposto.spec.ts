import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { SauceLoginFlow } from '@web/flows/sauceDemo/sauceLoginFlow';
import { SauceInventoryPage } from '@web/pages/sauceDemo/sauceInventoryPage';
import { SauceCartPage } from '@web/pages/sauceDemo/sauceCartPage';
import { SauceCheckoutInformationPage } from '@web/pages/sauceDemo/sauceCheckoutInformationPage';
import { SauceCheckoutOverviewPage } from '@web/pages/sauceDemo/sauceCheckoutOverviewPage';
import {
  extrairValorMonetario,
  sauceCheckout,
  sauceProdutos,
  sauceUsuarios,
} from '@web/support/sauceDemo/sauceTestData';

test.describe('Web · SauceDemo · Checkout', () => {
  test(
    'total do pedido deve corresponder ao subtotal mais o imposto',
    {
      tag: ['@web', '@sauceDemo', '@checkout', '@financial', '@regression'],
    },
    async ({ page }) => {
      await allure.epic('Web');
      await allure.feature('SauceDemo');
      await allure.story('Cálculo do total com imposto');
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

      await inventoryPage.abrirCarrinho();
      await cartPage.iniciarCheckout();

      await checkoutInformationPage.preencherDados(cliente.nome, cliente.sobrenome, cliente.cep);

      await checkoutInformationPage.continuar();

      await expect(checkoutOverviewPage.tituloRevisao).toBeVisible();

      const textoSubtotal = await checkoutOverviewPage.subtotal.textContent();

      const textoImposto = await checkoutOverviewPage.imposto.textContent();

      const textoTotal = await checkoutOverviewPage.total.textContent();

      expect(textoSubtotal).not.toBeNull();
      expect(textoImposto).not.toBeNull();
      expect(textoTotal).not.toBeNull();

      const subtotal = extrairValorMonetario(textoSubtotal!);
      const imposto = extrairValorMonetario(textoImposto!);
      const totalExibido = extrairValorMonetario(textoTotal!);

      const totalEsperado = Number((subtotal + imposto).toFixed(2));

      expect(totalExibido).toBe(totalEsperado);
    }
  );
});
