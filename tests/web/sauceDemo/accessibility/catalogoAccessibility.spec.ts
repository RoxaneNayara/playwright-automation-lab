import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as allure from 'allure-js-commons';
import { SauceLoginFlow } from '@web/flows/sauceDemo/sauceLoginFlow';
import { SauceInventoryPage } from '@web/pages/sauceDemo/sauceInventoryPage';
import { sauceUsuarios } from '@web/support/sauceDemo/sauceTestData';

test.describe('Web · SauceDemo · Acessibilidade', () => {
  test(
    'catálogo deve manter apenas as violações de acessibilidade conhecidas',
    { tag: ['@web', '@sauceDemo', '@accessibility'] },
    async ({ page }) => {
      await allure.epic('Web');
      await allure.feature('SauceDemo');
      await allure.story('Acessibilidade do catálogo');
      await allure.owner('Roxy');

      const credenciais = sauceUsuarios.usuarioPadrao;
      const inventoryPage = new SauceInventoryPage(page);

      await SauceLoginFlow.entrar(page, credenciais.usuario, credenciais.senha);

      await expect(inventoryPage.tituloProdutos).toBeVisible();

      const resultadoAcessibilidade = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const violacoesEncontradas = resultadoAcessibilidade.violations.map((violacao) => ({
        id: violacao.id,
        impacto: violacao.impact,
        elementos: violacao.nodes.map((node) => node.target.join(' ')),
      }));

      expect(violacoesEncontradas).toEqual([
        {
          id: 'select-name',
          impacto: 'critical',
          elementos: ['select'],
        },
      ]);
    }
  );
});
