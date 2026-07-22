import { test, expect } from '@playwright/test';
import { config } from '@core/config/configurationManager';
import { TodoPage } from '@web/pages/todo/todoPage';

test.describe('Web · Lista de tarefas', () => {
  test(
    'excluir uma tarefa deve removê-la da lista',
    { tag: ['@web', '@todo'] },
    async ({ page }) => {
      const baseUrl = config.getBaseUrl('TodoWeb');
      expect(baseUrl, 'BaseUrl não configurada para TodoWeb').toBeTruthy();

      const todoPage = new TodoPage(page);
      const descricaoDaTarefa = 'Revisar teste automatizado';

      await todoPage.abrir(baseUrl as string);
      await todoPage.adicionarTarefa(descricaoDaTarefa);

      await expect(todoPage.tarefaComDescricao(descricaoDaTarefa)).toBeVisible();

      await todoPage.excluirPrimeiraTarefa();

      await expect(todoPage.tarefaComDescricao(descricaoDaTarefa)).toHaveCount(0);
      await expect(todoPage.listaDeTarefas).toHaveCount(0);
      await expect(todoPage.contadorDeItens).toBeHidden();
    }
  );
});
