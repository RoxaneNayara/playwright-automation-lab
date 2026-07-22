import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { SauceLoginFlow } from '@web/flows/sauceDemo/sauceLoginFlow';
import { SauceInventoryPage } from '@web/pages/sauceDemo/sauceInventoryPage';
import { SauceCartPage } from '@web/pages/sauceDemo/sauceCartPage';
import { SauceCheckoutInformationPage } from '@web/pages/sauceDemo/sauceCheckoutInformationPage';
import { sauceCheckout, sauceProdutos, sauceUsuarios } from '@web/support/sauceDemo/sauceTestData';

type CenarioCampoObrigatorio = {
  campo: string;
  nome: string;
  sobrenome: string;
  cep: string;
  mensagemEsperada: string;
};

const cliente = sauceCheckout.clientePadrao;

const cenarios: CenarioCampoObrigatorio[] = [
  {
    campo: 'nome',
    nome: '',
    sobrenome: cliente.sobrenome,
    cep: cliente.cep,
    mensagemEsperada: 'Error: First Name is required',
  },
  {
    campo: 'sobrenome',
    nome: cliente.nome,
    sobrenome: '',
    cep: cliente.cep,
    mensagemEsperada: 'Error: Last Name is required',
  },
  {
    campo: 'CEP',
    nome: cliente.nome,
    sobrenome: cliente.sobrenome,
    cep: '',
    mensagemEsperada: 'Error: Postal Code is required',
  },
];

test.describe('Web · SauceDemo · Checkout · Campos obrigatórios', () => {
  for (const cenario of cenarios) {
    test(
      `continuar sem informar ${cenario.campo} deve exibir mensagem obrigatória`,
      { tag: ['@web', '@sauceDemo', '@checkout', '@negative'] },
      async ({ page }) => {
        await allure.epic('Web');
        await allure.feature('SauceDemo');
        await allure.story(`Campo obrigatório: ${cenario.campo}`);
        await allure.owner('Roxy');

        const inventoryPage = new SauceInventoryPage(page);
        const cartPage = new SauceCartPage(page);
        const checkoutInformationPage = new SauceCheckoutInformationPage(page);

        const credenciais = sauceUsuarios.usuarioPadrao;
        const produto = sauceProdutos.mochila;

        await SauceLoginFlow.entrar(page, credenciais.usuario, credenciais.senha);

        await inventoryPage.adicionarProdutoAoCarrinho(produto.nome);
        await inventoryPage.abrirCarrinho();
        await cartPage.iniciarCheckout();

        await expect(checkoutInformationPage.tituloCheckout).toBeVisible();

        await checkoutInformationPage.preencherDados(cenario.nome, cenario.sobrenome, cenario.cep);

        await checkoutInformationPage.continuar();

        await expect(checkoutInformationPage.mensagemErro).toBeVisible();

        await expect(checkoutInformationPage.mensagemErro).toContainText(cenario.mensagemEsperada);

        await expect(page).toHaveURL(/checkout-step-one\.html/);
      }
    );
  }
});
