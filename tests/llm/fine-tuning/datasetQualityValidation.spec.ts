import { expect, test } from '@playwright/test';

type TrainingMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type TrainingExample = {
  messages: TrainingMessage[];
};

const dataset: TrainingExample[] = [
  {
    messages: [
      {
        role: 'system',
        content: 'Você classifica solicitações de suporte em uma única categoria.',
      },
      {
        role: 'user',
        content: 'Minha conta foi bloqueada depois de várias tentativas de login.',
      },
      {
        role: 'assistant',
        content: 'ACCOUNT_ACCESS',
      },
    ],
  },
  {
    messages: [
      {
        role: 'system',
        content: 'Você classifica solicitações de suporte em uma única categoria.',
      },
      {
        role: 'user',
        content: 'Não consigo acessar minha conta depois de errar a senha várias vezes.',
      },
      {
        role: 'assistant',
        content: 'ACCOUNT_ACCESS',
      },
    ],
  },
  {
    messages: [
      {
        role: 'system',
        content: 'Você classifica solicitações de suporte em uma única categoria.',
      },
      {
        role: 'user',
        content: 'Fui cobrado duas vezes pela mesma compra.',
      },
      {
        role: 'assistant',
        content: 'PAYMENT',
      },
    ],
  },
  {
    messages: [
      {
        role: 'system',
        content: 'Você classifica solicitações de suporte em uma única categoria.',
      },
      {
        role: 'user',
        content: 'Apareceu uma cobrança que não reconheço.',
      },
      {
        role: 'assistant',
        content: 'PAYMENT',
      },
    ],
  },
  {
    messages: [
      {
        role: 'system',
        content: 'Você classifica solicitações de suporte em uma única categoria.',
      },
      {
        role: 'user',
        content: 'Qual é o horário de funcionamento do suporte?',
      },
      {
        role: 'assistant',
        content: 'SUPPORT',
      },
    ],
  },
  {
    messages: [
      {
        role: 'system',
        content: 'Você classifica solicitações de suporte em uma única categoria.',
      },
      {
        role: 'user',
        content: 'Em quais dias a equipe de suporte atende?',
      },
      {
        role: 'assistant',
        content: 'SUPPORT',
      },
    ],
  },
];

const getUserMessage = (example: TrainingExample): string =>
  example.messages.find((message) => message.role === 'user')?.content ?? '';

const getExpectedLabel = (example: TrainingExample): string =>
  example.messages.find((message) => message.role === 'assistant')?.content ?? '';

test.describe('LLM - Fine-tuning - Dataset Quality Validation', () => {
  test('não deve possuir exemplos duplicados', () => {
    const userMessages = dataset.map((example) => getUserMessage(example).trim().toLowerCase());

    const uniqueMessages = new Set(userMessages);

    console.log('\n=== Dataset Duplicate Check ===');
    console.log({
      totalExamples: userMessages.length,
      uniqueExamples: uniqueMessages.size,
    });

    expect(uniqueMessages.size).toBe(userMessages.length);
  });

  test('deve possuir exemplos para todas as categorias esperadas', () => {
    const expectedCategories = ['ACCOUNT_ACCESS', 'PAYMENT', 'SUPPORT'];

    const datasetCategories = new Set(dataset.map((example) => getExpectedLabel(example)));

    console.log('\n=== Dataset Category Coverage ===');
    console.log({
      expectedCategories,
      datasetCategories: [...datasetCategories],
    });

    for (const category of expectedCategories) {
      expect(datasetCategories.has(category)).toBe(true);
    }
  });

  test('deve possuir quantidade mínima de exemplos por categoria', () => {
    const minimumExamplesPerCategory = 2;

    const distribution = dataset.reduce<Record<string, number>>((accumulator, example) => {
      const label = getExpectedLabel(example);

      accumulator[label] = (accumulator[label] ?? 0) + 1;

      return accumulator;
    }, {});

    console.log('\n=== Dataset Distribution ===');
    console.log(distribution);

    for (const count of Object.values(distribution)) {
      expect(count).toBeGreaterThanOrEqual(minimumExamplesPerCategory);
    }
  });
});
