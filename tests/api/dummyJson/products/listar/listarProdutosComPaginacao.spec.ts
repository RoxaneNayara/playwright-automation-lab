import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { config } from '@core/config/configurationManager';

type ProdutoPaginado = {
  id: number;
  title: string;
  price: number;
};

type RespostaProdutosPaginados = {
  products: ProdutoPaginado[];
  total: number;
  skip: number;
  limit: number;
};

test.describe('API · DummyJSON · Produtos', () => {
  test(
    'listar produtos com paginação deve respeitar limit e skip',
    {
      tag: [
        '@api',
        '@dummyJson',
        '@products',
        '@get',
        '@pagination',
        '@functionalSuitability',
        '@performanceEfficiency',
        '@reliability',
        '@vader-data',
      ],
    },
    async ({ request }) => {
      await allure.epic('API');
      await allure.feature('DummyJSON');
      await allure.story('Paginação de produtos');
      await allure.owner('Roxy');

      const baseUrl = config.getBaseUrl('DummyJsonApi');

      expect(
        baseUrl,
        'BaseUrl não configurada para DummyJsonApi'
      ).toBeTruthy();

      const limite = 5;
      const itensIgnorados = 10;

      const response = await request.get(`${baseUrl}/products`, {
        params: {
          limit: limite,
          skip: itensIgnorados,
        },
      });

      expect(response.status()).toBe(200);
      expect(response.ok()).toBeTruthy();

      expect(response.headers()['content-type']).toContain(
        'application/json'
      );

      const resultado =
        (await response.json()) as RespostaProdutosPaginados;

      expect(Array.isArray(resultado.products)).toBeTruthy();
      expect(resultado.products).toHaveLength(limite);

      expect(resultado.limit).toBe(limite);
      expect(resultado.skip).toBe(itensIgnorados);
      expect(resultado.total).toBeGreaterThan(limite);

      for (const produto of resultado.products) {
        expect(produto.id).toBeGreaterThan(0);
        expect(produto.title).toBeTruthy();
        expect(produto.price).toBeGreaterThan(0);
      }

      const idsDosProdutos = resultado.products.map(
        produto => produto.id
      );

      expect(new Set(idsDosProdutos).size).toBe(
        idsDosProdutos.length
      );
    }
  );
});