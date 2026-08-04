import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { config } from '@core/config/configurationManager';

type NovoProduto = {
  title: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  brand: string;
};

type ProdutoCriado = NovoProduto & {
  id: number;
};

test.describe('API · DummyJSON · Produtos', () => {
  test(
    'criar produto deve retornar os dados enviados e um novo ID',
    {
      tag: [
        '@api',
        '@dummyJson',
        '@products',
        '@post',
        '@functionalSuitability',
        '@compatibility',
        '@vader-verbs',
        '@vader-data',
      ],
    },
    async ({ request }) => {
      await allure.epic('API');
      await allure.feature('DummyJSON');
      await allure.story('Criação simulada de produto');
      await allure.owner('Roxy');

      const baseUrl = config.getBaseUrl('DummyJsonApi');

      expect(baseUrl, 'BaseUrl não configurada para DummyJsonApi').toBeTruthy();

      const novoProduto: NovoProduto = {
        title: 'Notebook QA Automation',
        description: 'Notebook criado para estudos de automação de testes',
        category: 'laptops',
        price: 4999.9,
        stock: 15,
        brand: 'Quality Lab',
      };

      const response = await request.post(`${baseUrl}/products/add`, {
        data: novoProduto,
      });

      expect(response.status()).toBe(201);
      expect(response.ok()).toBeTruthy();

      expect(response.headers()['content-type']).toContain('application/json');

      const produtoCriado = (await response.json()) as ProdutoCriado;

      expect(produtoCriado.id).toBeGreaterThan(0);
      expect(produtoCriado.title).toBe(novoProduto.title);
      expect(produtoCriado.description).toBe(novoProduto.description);
      expect(produtoCriado.category).toBe(novoProduto.category);
      expect(produtoCriado.price).toBe(novoProduto.price);
      expect(produtoCriado.stock).toBe(novoProduto.stock);
      expect(produtoCriado.brand).toBe(novoProduto.brand);
    }
  );
});
