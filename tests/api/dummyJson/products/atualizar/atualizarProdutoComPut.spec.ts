import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { config } from '@core/config/configurationManager';

type ProdutoAtualizado = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  brand: string;
};

test.describe('API · DummyJSON · Produtos', () => {
  test(
    'atualizar produto com PUT deve retornar os dados modificados',
    {
      tag: [
        '@api',
        '@dummyJson',
        '@products',
        '@put',
        '@functionalSuitability',
        '@compatibility',
        '@vader-verbs',
        '@vader-data',
      ],
    },
    async ({ request }) => {
      await allure.epic('API');
      await allure.feature('DummyJSON');
      await allure.story('Atualização completa simulada de produto');
      await allure.owner('Roxy');

      const baseUrl = config.getBaseUrl('DummyJsonApi');

      expect(
        baseUrl,
        'BaseUrl não configurada para DummyJsonApi'
      ).toBeTruthy();

      const produtoId = 1;

      const dadosAtualizados = {
        title: 'Notebook QA Automation Pro',
        description:
          'Notebook atualizado para estudos avançados de automação',
        category: 'laptops',
        price: 5999.9,
        stock: 8,
        brand: 'Quality Lab Pro',
      };

      const response = await request.put(
        `${baseUrl}/products/${produtoId}`,
        {
          data: dadosAtualizados,
        }
      );

      expect(response.status()).toBe(200);
      expect(response.ok()).toBeTruthy();

      expect(response.headers()['content-type']).toContain(
        'application/json'
      );

      const produtoAtualizado =
        (await response.json()) as ProdutoAtualizado;

      expect(produtoAtualizado.id).toBe(produtoId);
      expect(produtoAtualizado.title).toBe(
        dadosAtualizados.title
      );
      expect(produtoAtualizado.description).toBe(
        dadosAtualizados.description
      );
      expect(produtoAtualizado.category).toBe(
        dadosAtualizados.category
      );
      expect(produtoAtualizado.price).toBe(
        dadosAtualizados.price
      );
      expect(produtoAtualizado.stock).toBe(
        dadosAtualizados.stock
      );
      expect(produtoAtualizado.brand).toBe(
        dadosAtualizados.brand
      );
    }
  );
});