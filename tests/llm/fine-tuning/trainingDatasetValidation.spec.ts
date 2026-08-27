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
        content: 'Qual é o horário de funcionamento do suporte?',
      },
      {
        role: 'assistant',
        content: 'SUPPORT',
      },
    ],
  },
];

test.describe('LLM - Fine-tuning - Training Dataset Validation', () => {
  test('deve validar a estrutura dos exemplos de treinamento', () => {
    expect(dataset.length).toBeGreaterThan(0);

    for (const example of dataset) {
      expect(example.messages).toHaveLength(3);

      expect(example.messages[0].role).toBe('system');
      expect(example.messages[1].role).toBe('user');
      expect(example.messages[2].role).toBe('assistant');

      expect(example.messages[0].content.length).toBeGreaterThan(0);
      expect(example.messages[1].content.length).toBeGreaterThan(0);
      expect(example.messages[2].content.length).toBeGreaterThan(0);
    }
  });

  test('deve garantir que a resposta de treinamento pertença às categorias permitidas', () => {
    const allowedCategories = ['ACCOUNT_ACCESS', 'PAYMENT', 'SUPPORT'];

    for (const example of dataset) {
      const expectedAnswer = example.messages[2].content;

      expect(allowedCategories).toContain(expectedAnswer);
    }
  });
});
