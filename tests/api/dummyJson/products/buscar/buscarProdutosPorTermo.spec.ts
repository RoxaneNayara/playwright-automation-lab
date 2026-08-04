import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { config } from '@core/config/configurationManager';

type ProdutoEncontrado = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  brand?: string;
  tags?: string[];
};

type RespostaPesquisaProdutos = {
  products: ProdutoEncontrado[];
  total: number;
  skip: number;
  limit: number;
};

test.describe('API · DummyJSON · Produtos', () => {
  test(
    'pesquisar produtos por termo deve retornar resultados relacionados',
    {
      tag: [
        '@api',
        '@dummyJson',
        '@products',
        '@get',
        '@search',
        '@functionalSuitability',
        '@compatibility',
        '@vader-data',
      ],
    },
    async ({ request }) => {
      await allure.epic('API');
      await allure.feature('DummyJSON');
      await allure.story('Pesquisa de produtos');
      await allure.owner('Roxy');

      const baseUrl = config.getBaseUrl('DummyJsonApi');

      expect(baseUrl, 'BaseUrl não configurada para DummyJsonApi').toBeTruthy();

      const termoDePesquisa = 'phone';

      const response = await request.get(`${baseUrl}/products/search`, {
        params: {
          q: termoDePesquisa,
        },
      });

      expect(response.status()).toBe(200);
      expect(response.ok()).toBeTruthy();

      expect(response.headers()['content-type']).toContain('application/json');

      const resultado = (await response.json()) as RespostaPesquisaProdutos;

      expect(Array.isArray(resultado.products)).toBeTruthy();
      expect(resultado.products.length).toBeGreaterThan(0);
      expect(resultado.total).toBeGreaterThan(0);
      expect(resultado.skip).toBe(0);
      expect(resultado.limit).toBeGreaterThan(0);

      for (const produto of resultado.products) {
        expect(produto.id).toBeGreaterThan(0);
        expect(produto.title).toBeTruthy();
        expect(produto.description).toBeTruthy();
        expect(produto.category).toBeTruthy();
        expect(produto.price).toBeGreaterThan(0);
      }

      const existeProdutoRelacionadoAoTermo = resultado.products.some((produto) => {
        const camposPesquisaveis = [
          produto.title,
          produto.description,
          produto.category,
          produto.brand ?? '',
          ...(produto.tags ?? []),
        ]
          .join(' ')
          .toLowerCase();

        return camposPesquisaveis.includes(termoDePesquisa.toLowerCase());
      });

      expect(existeProdutoRelacionadoAoTermo).toBeTruthy();
    }
  );
});
