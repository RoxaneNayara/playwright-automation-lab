import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { config } from '@core/config/configurationManager';

test.describe('API · DummyJSON · Produtos', () => {
  test(
    'buscar produto por ID deve retornar os dados do produto solicitado',
    {
      tag: [
        '@api',
        '@dummyJson',
        '@products',
        '@get',
        '@functionalSuitability',
        '@vader-data',
      ],
    },
    async ({ request }) => {
      await allure.epic('API');
      await allure.feature('DummyJSON');
      await allure.story('Consulta de produto por ID');
      await allure.owner('Roxy');

      const baseUrl = config.getBaseUrl('DummyJsonApi');

      expect(
        baseUrl,
        'BaseUrl não configurada para DummyJsonApi'
      ).toBeTruthy();

      const produtoId = 1;

      const response = await request.get(
        `${baseUrl}/products/${produtoId}`
      );

      expect(response.status()).toBe(200);
      expect(response.ok()).toBeTruthy();

      expect(response.headers()['content-type']).toContain(
        'application/json'
      );

      const produto = await response.json();

      expect(produto.id).toBe(produtoId);
      expect(produto.title).toBeTruthy();
      expect(produto.description).toBeTruthy();
      expect(produto.category).toBeTruthy();
      expect(produto.price).toBeGreaterThan(0);
    }
  );
});