import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { config } from '@core/config/configurationManager';

type ProdutoComPrecoNegativo = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
};

test.describe('API · DummyJSON · Produtos · Robustez', () => {
  test(
    'criar produto com preço negativo deve retornar uma resposta controlada',
    {
      tag: [
        '@api',
        '@dummyJson',
        '@products',
        '@post',
        '@negative',
        '@robustness',
        '@functionalSuitability',
        '@reliability',
        '@chique-quebraDeFluxo',
        '@vader-data',
        '@vader-errors',
      ],
    },
    async ({ request }) => {
      await allure.epic('API');
      await allure.feature('DummyJSON');
      await allure.story('Criação de produto com preço negativo');
      await allure.owner('Roxy');

      const baseUrl = config.getBaseUrl('DummyJsonApi');

      expect(baseUrl, 'BaseUrl não configurada para DummyJsonApi').toBeTruthy();

      const novoProduto = {
        title: 'Produto com preço negativo',
        description: 'Produto criado para testar valor negativo no preço',
        category: 'laptops',
        price: -1500,
      };

      const response = await request.post(`${baseUrl}/products/add`, {
        data: novoProduto,
      });

      expect(response.status()).toBe(201);
      expect(response.ok()).toBeTruthy();

      expect(response.headers()['content-type']).toContain('application/json');

      const produtoCriado = (await response.json()) as ProdutoComPrecoNegativo;

      expect(produtoCriado.id).toBeGreaterThan(0);
      expect(produtoCriado.title).toBe(novoProduto.title);

      expect(produtoCriado.price).toBe(novoProduto.price);
      expect(typeof produtoCriado.price).toBe('number');
      expect(produtoCriado.price).toBeLessThan(0);

      const respostaCompleta = JSON.stringify(produtoCriado).toLowerCase();

      expect(respostaCompleta).not.toContain('stack');
      expect(respostaCompleta).not.toContain('exception');
      expect(respostaCompleta).not.toContain('trace');
    }
  );
});
