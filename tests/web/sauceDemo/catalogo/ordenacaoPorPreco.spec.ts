import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { SauceLoginFlow } from '@web/flows/sauceDemo/sauceLoginFlow';
import { SauceInventoryPage } from '@web/pages/sauceDemo/sauceInventoryPage';
import { sauceUsuarios } from '@web/support/sauceDemo/sauceTestData';

test.describe('Web · SauceDemo · Catálogo', () => {
  test(
    'ordenar por menor preço deve exibir os produtos em ordem crescente',
    { tag: ['@web', '@sauceDemo', '@catalogo', '@regression'] },
    async ({ page }) => {
      await allure.epic('Web');
      await allure.feature('SauceDemo');
      await allure.story('Ordenação por preço');
      await allure.owner('Roxy');

      const inventoryPage = new SauceInventoryPage(page);
      const credenciais = sauceUsuarios.usuarioPadrao;

      await SauceLoginFlow.entrar(page, credenciais.usuario, credenciais.senha);

      await expect(inventoryPage.tituloProdutos).toBeVisible();

      await inventoryPage.ordenarPorMenorPreco();

      await expect(inventoryPage.seletorOrdenacao).toHaveValue('lohi');

      const precosExibidos = await inventoryPage.obterPrecos();

      const precosOrdenados = [...precosExibidos].sort(
        (primeiroPreco, segundoPreco) => primeiroPreco - segundoPreco
      );

      expect(precosExibidos).toEqual(precosOrdenados);
    }
  );
});
