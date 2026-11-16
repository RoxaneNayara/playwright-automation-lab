import { test, expect } from '@playwright/test';

test('deve aguardar o botão ficar habilitado', async ({ page }) => {
  await page.setContent(`
        <button disabled>Comprar</button>
        <p id="resultado"></p>

        <script>
            const botao = document.querySelector('button');

            botao.addEventListener('click', () => {
            document.querySelector('#resultado').textContent =
                'Compra realizada com sucesso';
            });

            setTimeout(() => {
            botao.disabled = false;
            }, 2000);
        </script>
    `);

  const botaoComprar = page.getByRole('button', {
    name: 'Comprar',
  });

  await botaoComprar.click();

  await expect(page.getByText('Compra realizada com sucesso')).toBeVisible();
});

test.skip('deve demonstrar falha causada por espera fixa', async ({ page }) => {
  await page.setContent(`
        <p id="resultado">Processando pedido...</p>
        
        <script>
            setTimeout(() => {
                document.querySelector('#resultado').textContent = 
                    'Pedido confirmado';
            }, 2000);
        </script>
    `);

  // Espera fixa intencional para demonstrar risco de flaky test.
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(1000);

  const mensagem = await page.getByText('Pedido confirmado').isVisible();

  // Assertion imediata intencional para demonstrar falha de sincronização.
  // eslint-disable-next-line playwright/prefer-web-first-assertions
  expect(mensagem).toBe(true);
});

test('deve aguardar a confirmação sem espera fixa', async ({ page }) => {
  await page.setContent(`
    <p id="resultado">Processando pedido...</p>

    <script>
      setTimeout(() => {
        document.querySelector('#resultado').textContent =
          'Pedido confirmado';
      }, 2000);
    </script>
  `);

  await expect(page.getByText('Pedido confirmado')).toBeVisible();
});

test.skip('deve demonstrar comportamento flaky', async ({ page }) => {
  await page.setContent(`
    <p id="resultado">Processando pedido...</p>

    <script>
      const atraso = Math.random() < 0.5 ? 500 : 1500;

      setTimeout(() => {
        document.querySelector('#resultado').textContent =
          'Pedido confirmado';
      }, atraso);
    </script>
  `);

  // Espera fixa intencional para demonstrar comportamento flaky.
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(1000);

  const mensagem = await page.getByText('Pedido confirmado').isVisible();

  // Assertion imediata intencional para demonstrar falha de sincronização.
  // eslint-disable-next-line playwright/prefer-web-first-assertions
  expect(mensagem).toBe(true);
});

test('deve corrigir comportamento flaky com web-first assertion', async ({ page }) => {
  await page.setContent(`
    <p id="resultado">Processando pedido...</p>

    <script>
      const atraso = Math.random() < 0.5 ? 500 : 1500;

      setTimeout(() => {
        document.querySelector('#resultado').textContent =
          'Pedido confirmado';
      }, atraso);
    </script>
  `);

  await expect(page.getByText('Pedido confirmado')).toBeVisible();
});
