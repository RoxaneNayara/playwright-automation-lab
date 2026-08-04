import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { config } from '@core/config/configurationManager';

type RespostaDeErro = {
  message: string;
};

test.describe('API · DummyJSON · Produtos', () => {
  test(
    'buscar produto inexistente deve retornar erro 404 controlado',
    {
      tag: [
        '@api',
        '@dummyJson',
        '@products',
        '@get',
        '@negative',
        '@functionalSuitability',
        '@reliability',
        '@security',
        '@vader-errors',
      ],
    },
    async ({ request }) => {
      await allure.epic('API');
      await allure.feature('DummyJSON');
      await allure.story('Consulta de produto inexistente');
      await allure.owner('Roxy');

      const baseUrl = config.getBaseUrl('DummyJsonApi');

      expect(
        baseUrl,
        'BaseUrl não configurada para DummyJsonApi'
      ).toBeTruthy();

      const produtoIdInexistente = 999999;

      const response = await request.get(
        `${baseUrl}/products/${produtoIdInexistente}`
      );

      expect(response.status()).toBe(404);
      expect(response.ok()).toBeFalsy();

      expect(response.headers()['content-type']).toContain(
        'application/json'
      );

      const erro = (await response.json()) as RespostaDeErro;

      expect(erro.message).toBe(
        `Product with id '${produtoIdInexistente}' not found`
      );

      const respostaCompleta = JSON.stringify(erro).toLowerCase();

      expect(respostaCompleta).not.toContain('stack');
      expect(respostaCompleta).not.toContain('exception');
      expect(respostaCompleta).not.toContain('trace');
    }
  );
});