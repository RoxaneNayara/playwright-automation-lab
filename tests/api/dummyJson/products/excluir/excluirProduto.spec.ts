import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { config } from '@core/config/configurationManager';

type ProdutoExcluido = {
  id: number;
  title: string;
  isDeleted: boolean;
  deletedOn: string;
};

test.describe('API · DummyJSON · Produtos', () => {
  test(
    'excluir produto deve retornar confirmação de exclusão simulada',
    {
      tag: [
        '@api',
        '@dummyJson',
        '@products',
        '@delete',
        '@functionalSuitability',
        '@reliability',
        '@vader-verbs',
        '@vader-errors',
      ],
    },
    async ({ request }) => {
      await allure.epic('API');
      await allure.feature('DummyJSON');
      await allure.story('Exclusão simulada de produto');
      await allure.owner('Roxy');

      const baseUrl = config.getBaseUrl('DummyJsonApi');

      expect(
        baseUrl,
        'BaseUrl não configurada para DummyJsonApi'
      ).toBeTruthy();

      const produtoId = 1;

      const response = await request.delete(
        `${baseUrl}/products/${produtoId}`
      );

      expect(response.status()).toBe(200);
      expect(response.ok()).toBeTruthy();

      expect(response.headers()['content-type']).toContain(
        'application/json'
      );

      const produtoExcluido =
        (await response.json()) as ProdutoExcluido;

      expect(produtoExcluido.id).toBe(produtoId);
      expect(produtoExcluido.title).toBeTruthy();
      expect(produtoExcluido.isDeleted).toBe(true);
      expect(produtoExcluido.deletedOn).toBeTruthy();

      const dataDaExclusao = new Date(
        produtoExcluido.deletedOn
      );

      expect(dataDaExclusao.toString()).not.toBe(
        'Invalid Date'
      );
    }
  );
});