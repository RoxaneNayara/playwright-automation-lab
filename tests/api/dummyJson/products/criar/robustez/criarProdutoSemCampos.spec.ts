import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { ProductService } from '@api/services/dummyJson/productService';

type ProdutoCriadoSemCampos = {
  id: number;
};

test.describe('API · DummyJSON · Produtos · Robustez', () => {
  test(
    'criar produto sem campos deve retornar uma resposta controlada',
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
      await allure.story('Criação de produto sem campos');
      await allure.owner('Roxy');

      const productService = new ProductService(request);

      const response = await productService.criar({});

      expect(response.status()).toBe(201);
      expect(response.ok()).toBeTruthy();

      expect(response.headers()['content-type']).toContain('application/json');

      const produtoCriado = (await response.json()) as ProdutoCriadoSemCampos;

      expect(produtoCriado.id).toBeGreaterThan(0);

      const respostaCompleta = JSON.stringify(produtoCriado).toLowerCase();

      expect(respostaCompleta).not.toContain('stack');
      expect(respostaCompleta).not.toContain('exception');
      expect(respostaCompleta).not.toContain('trace');
    }
  );
});
