import { test, expect } from '@playwright/test';
import { config } from '@core/config/configurationManager';
import { TodoPage } from '@web/pages/todo/todoPage';

test.describe('Web · Lista de tarefas', () => {
  test(
    'marcar uma tarefa como concluída deve alterar seu estado',
    { tag: ['@web', '@todo'] },
    async ({ page }) => {
      const baseUrl = config.getBaseUrl('TodoWeb');
      expect(baseUrl, 'BaseUrl não configurada para TodoWeb').toBeTruthy();

      const todoPage = new TodoPage(page);
      const descricaoDaTarefa = 'Praticar Playwright';

      await todoPage.abrir(baseUrl as string);
      await todoPage.adicionarTarefa(descricaoDaTarefa);
      await todoPage.marcarPrimeiraTarefaComoConcluida();

      await expect(todoPage.checkboxDaPrimeiraTarefa).toBeChecked();
      await expect(todoPage.primeiraTarefa).toHaveClass(/completed/);
      await expect(todoPage.contadorDeItens).toContainText('0 items left');
    }
  );
});
