import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { config } from '@core/config/configurationManager';

type ProdutoComTituloNulo = {
  id: number;
  title: string | null;
  description: string;
  category: string;
  price: number;
};

test.describe('API · DummyJSON · Produtos · Robustez', () => {
  test(
    'criar produto com título nulo deve retornar uma resposta controlada',
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
        '@chique-camposObrigatorios',
        '@vader-data',
        '@vader-errors',
      ],
    },
    async ({ request }) => {
      await allure.epic('API');
      await allure.feature('DummyJSON');
      await allure.story('Criação de produto com título nulo');
      await allure.owner('Roxy');

      const baseUrl = config.getBaseUrl('DummyJsonApi');

      expect(baseUrl, 'BaseUrl não configurada para DummyJsonApi').toBeTruthy();

      const novoProduto = {
        title: null,
        description: 'Produto criado para testar título nulo',
        category: 'laptops',
        price: 1500,
      };

      const response = await request.post(`${baseUrl}/products/add`, {
        data: novoProduto,
      });

      expect(response.status()).toBe(201);
      expect(response.ok()).toBeTruthy();

      expect(response.headers()['content-type']).toContain('application/json');

      const produtoCriado = (await response.json()) as ProdutoComTituloNulo;

      expect(produtoCriado.id).toBeGreaterThan(0);
      expect(produtoCriado.title).toBeNull();

      expect(produtoCriado.description).toBe(novoProduto.description);

      expect(produtoCriado.category).toBe(novoProduto.category);

      expect(produtoCriado.price).toBe(novoProduto.price);

      const respostaCompleta = JSON.stringify(produtoCriado).toLowerCase();

      expect(respostaCompleta).not.toContain('stack');
      expect(respostaCompleta).not.toContain('exception');
      expect(respostaCompleta).not.toContain('trace');
    }
  );
});
