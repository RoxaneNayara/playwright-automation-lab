import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { config } from '@core/config/configurationManager';

type ProdutoComTituloVazio = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
};

test.describe('API · DummyJSON · Produtos · Robustez', () => {
  test(
    'criar produto com título vazio deve retornar uma resposta controlada',
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
      await allure.story('Criação de produto com título vazio');
      await allure.owner('Roxy');

      const baseUrl = config.getBaseUrl('DummyJsonApi');

      expect(baseUrl, 'BaseUrl não configurada para DummyJsonApi').toBeTruthy();

      const novoProduto = {
        title: '',
        description: 'Produto criado para testar título vazio',
        category: 'laptops',
        price: 1500,
      };

      const response = await request.post(`${baseUrl}/products/add`, {
        data: novoProduto,
      });

      expect(response.status()).toBe(201);
      expect(response.ok()).toBeTruthy();

      expect(response.headers()['content-type']).toContain('application/json');

      const produtoCriado = (await response.json()) as ProdutoComTituloVazio;

      expect(produtoCriado.id).toBeGreaterThan(0);
      expect(produtoCriado.title).toBe('');
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
