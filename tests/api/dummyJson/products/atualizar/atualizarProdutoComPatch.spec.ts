import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { ProductService } from '@api/services/dummyJson/productService';

type ProdutoAtualizadoParcialmente = {
  id: number;
  title: string;
  price: number;
};

test.describe('API · DummyJSON · Produtos', () => {
  test(
    'atualizar produto com PATCH deve modificar apenas os campos enviados',
    {
      tag: [
        '@api',
        '@dummyJson',
        '@products',
        '@patch',
        '@functionalSuitability',
        '@compatibility',
        '@vader-verbs',
        '@vader-data',
      ],
    },
    async ({ request }) => {
      await allure.epic('API');
      await allure.feature('DummyJSON');
      await allure.story('Atualização parcial simulada de produto');
      await allure.owner('Roxy');

      const productService = new ProductService(request);

      const produtoId = 1;

      const dadosAtualizados = {
        title: 'Produto atualizado parcialmente',
        price: 1999.9,
      };

      const response = await productService.atualizarParcial(produtoId, dadosAtualizados);

      expect(response.status()).toBe(200);
      expect(response.ok()).toBeTruthy();

      expect(response.headers()['content-type']).toContain('application/json');

      const produtoAtualizado = (await response.json()) as ProdutoAtualizadoParcialmente;

      expect(produtoAtualizado.id).toBe(produtoId);
      expect(produtoAtualizado.title).toBe(dadosAtualizados.title);
      expect(produtoAtualizado.price).toBe(dadosAtualizados.price);
    }
  );
});
