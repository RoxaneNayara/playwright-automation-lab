import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { config } from '@core/config/configurationManager';

type RespostaCriacaoComContentTypeInvalido = {
  id: number;
};

test.describe('API · DummyJSON · Produtos · Robustez', () => {
  test(
    'criar produto com Content-Type inválido deve retornar uma resposta controlada',
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
        '@compatibility',
        '@chique-quebraDeFluxo',
        '@vader-data',
        '@vader-errors',
      ],
    },
    async ({ request }) => {
      await allure.epic('API');
      await allure.feature('DummyJSON');
      await allure.story('Criação de produto com Content-Type inválido');
      await allure.owner('Roxy');

      const baseUrl = config.getBaseUrl('DummyJsonApi');

      expect(
        baseUrl,
        'BaseUrl não configurada para DummyJsonApi'
      ).toBeTruthy();

      const payload = {
        title: 'Produto com Content-Type inválido',
        description:
          'Produto criado para testar uma requisição declarada como texto',
        category: 'laptops',
        price: 1500,
      };

      const response = await request.post(
        `${baseUrl}/products/add`,
        {
          headers: {
            'content-type': 'text/plain',
          },
          data: JSON.stringify(payload),
        }
      );

      expect(response.status()).toBe(201);
      expect(response.ok()).toBeTruthy();

      const corpoDaResposta = await response.text();

      const respostaCriacao = JSON.parse(
        corpoDaResposta
      ) as RespostaCriacaoComContentTypeInvalido;

      expect(respostaCriacao.id).toBeGreaterThan(0);
      
      const respostaCompleta = corpoDaResposta.toLowerCase();

      expect(respostaCompleta).not.toContain('stack');
      expect(respostaCompleta).not.toContain('exception');
      expect(respostaCompleta).not.toContain('trace');
    }
  );
});

