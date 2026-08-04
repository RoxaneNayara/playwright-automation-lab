import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { config } from '@core/config/configurationManager';

type ProdutoComCaracteresEspeciais = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
};

test.describe('API · DummyJSON · Produtos · Robustez', () => {
  test(
    'criar produto com caracteres especiais deve preservar o conteúdo enviado',
    {
      tag: [
        '@api',
        '@dummyJson',
        '@products',
        '@post',
        '@robustness',
        '@functionalSuitability',
        '@compatibility',
        '@reliability',
        '@chique-estouroDeCampos',
        '@vader-data',
        '@vader-errors',
      ],
    },
    async ({ request }) => {
      await allure.epic('API');
      await allure.feature('DummyJSON');
      await allure.story('Criação de produto com caracteres especiais');
      await allure.owner('Roxy');

      const baseUrl = config.getBaseUrl('DummyJsonApi');

      expect(
        baseUrl,
        'BaseUrl não configurada para DummyJsonApi'
        ).toBeTruthy();

        const tamanhoDoTitulo = 1000;
        const padraoDoTitulo = 'QA-Áéç@#$%&*()_+=[]{}!?/\\| ';

        const tituloComCaracteresEspeciais = padraoDoTitulo
        .repeat(Math.ceil(tamanhoDoTitulo / padraoDoTitulo.length))
        .slice(0, tamanhoDoTitulo);

        const novoProduto = {
        title: tituloComCaracteresEspeciais,
        description:
            'Produto criado para validar acentos, símbolos e caracteres especiais',
        category: 'laptops',
        price: 1500,
        };

      const response = await request.post(
        `${baseUrl}/products/add`,
        {
          data: novoProduto,
        }
      );

      expect(response.status()).toBe(201);
      expect(response.ok()).toBeTruthy();

      expect(response.headers()['content-type']).toContain(
        'application/json'
      );

      const produtoCriado =
        (await response.json()) as ProdutoComCaracteresEspeciais;

      expect(produtoCriado.id).toBeGreaterThan(0);

      expect(produtoCriado.title).toBe(
        tituloComCaracteresEspeciais
      );

      expect(produtoCriado.title).toHaveLength(
        tituloComCaracteresEspeciais.length
      );

      expect(produtoCriado.description).toBe(
        novoProduto.description
      );

      expect(produtoCriado.category).toBe(
        novoProduto.category
      );

      expect(produtoCriado.price).toBe(
        novoProduto.price
      );

      const respostaCompleta =
        JSON.stringify(produtoCriado).toLowerCase();

      expect(respostaCompleta).not.toContain('stack');
      expect(respostaCompleta).not.toContain('exception');
      expect(respostaCompleta).not.toContain('trace');
    }
  );
});