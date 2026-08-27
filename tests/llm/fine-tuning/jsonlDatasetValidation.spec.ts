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

const jsonlDataset = dataset.map((example) => JSON.stringify(example)).join('\n');

test.describe('LLM - Fine-tuning - JSONL Dataset Validation', () => {
  test('deve gerar uma linha JSON válida para cada exemplo', () => {
    const lines = jsonlDataset.split('\n');

    expect(lines).toHaveLength(dataset.length);

    for (const line of lines) {
      expect(line.trim().length).toBeGreaterThan(0);

      const parsed = JSON.parse(line) as TrainingExample;

      expect(parsed.messages).toBeDefined();
      expect(Array.isArray(parsed.messages)).toBe(true);
    }
  });

  test('deve preservar a estrutura das mensagens após conversão para JSONL', () => {
    const lines = jsonlDataset.split('\n');

    for (const line of lines) {
      const parsed = JSON.parse(line) as TrainingExample;

      expect(parsed.messages).toHaveLength(3);

      expect(parsed.messages[0].role).toBe('system');
      expect(parsed.messages[1].role).toBe('user');
      expect(parsed.messages[2].role).toBe('assistant');

      expect(parsed.messages[0].content.length).toBeGreaterThan(0);
      expect(parsed.messages[1].content.length).toBeGreaterThan(0);
      expect(parsed.messages[2].content.length).toBeGreaterThan(0);
    }
  });
});
