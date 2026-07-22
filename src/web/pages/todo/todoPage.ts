import type { Locator, Page } from '@playwright/test';

export class TodoPage {
  constructor(private readonly page: Page) {}

  get campoNovaTarefa(): Locator {
    return this.page.getByPlaceholder('What needs to be done?');
  }

  get listaDeTarefas(): Locator {
    return this.page.locator('.todo-list li');
  }

  get contadorDeItens(): Locator {
    return this.page.locator('.todo-count');
  }

  async abrir(baseUrl: string): Promise<void> {
    await this.page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  }

  async adicionarTarefa(descricao: string): Promise<void> {
    await this.campoNovaTarefa.fill(descricao);
    await this.campoNovaTarefa.press('Enter');
  }

  tarefaComDescricao(descricao: string): Locator {
    return this.listaDeTarefas.filter({ hasText: descricao });
  }

  get checkboxDaPrimeiraTarefa(): Locator {
    return this.listaDeTarefas.first().getByRole('checkbox');
  }

  get primeiraTarefa(): Locator {
    return this.listaDeTarefas.first();
  }

  async marcarPrimeiraTarefaComoConcluida(): Promise<void> {
    await this.checkboxDaPrimeiraTarefa.check();
  }

  get botaoExcluirPrimeiraTarefa(): Locator {
    return this.primeiraTarefa.locator('button.destroy');
  }

  async excluirPrimeiraTarefa(): Promise<void> {
    await this.primeiraTarefa.hover();
    await this.botaoExcluirPrimeiraTarefa.click();
  }
}
