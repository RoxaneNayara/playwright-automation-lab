import { test, expect } from '@playwright/test';
import { config } from '@core/config/configurationManager';
import { TodoPage } from '@web/pages/todo/todoPage';

test.describe('Web · Lista de tarefas', () => {
  test(
    'adicionar uma nova tarefa deve exibir a tarefa na lista',
    { tag: ['@web', '@todo'] },
    async ({ page }) => {
      const baseUrl = config.getBaseUrl('TodoWeb');
      expect(baseUrl, 'BaseUrl não configurada para TodoWeb').toBeTruthy();

      const todoPage = new TodoPage(page);
      const descricaoDaTarefa = 'Estudar automação de testes';

      await todoPage.abrir(baseUrl as string);
      await todoPage.adicionarTarefa(descricaoDaTarefa);

      await expect(todoPage.tarefaComDescricao(descricaoDaTarefa)).toBeVisible();
      await expect(todoPage.listaDeTarefas).toHaveCount(1);
      await expect(todoPage.contadorDeItens).toContainText('1 item left');
    }
  );
});
