import { expect, test } from '@playwright/test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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

const buildJsonl = (examples: TrainingExample[]): string =>
  examples.map((example) => JSON.stringify(example)).join('\n');

test.describe('LLM - Fine-tuning - JSONL File Validation', () => {
  test('deve criar, ler e validar um arquivo JSONL temporário', async () => {
    const tempDirectory = await mkdtemp(join(tmpdir(), 'fine-tuning-dataset-'));

    const filePath = join(tempDirectory, 'training-data.jsonl');

    try {
      const jsonlContent = buildJsonl(dataset);

      await writeFile(filePath, jsonlContent, 'utf8');

      const savedContent = await readFile(filePath, 'utf8');

      const lines = savedContent.split('\n').filter((line) => line.trim().length > 0);

      console.log('\n=== JSONL Temporary File ===');
      console.log({
        filePath,
        totalLines: lines.length,
      });

      expect(lines).toHaveLength(dataset.length);

      for (const line of lines) {
        const parsed = JSON.parse(line) as TrainingExample;

        expect(parsed.messages).toBeDefined();
        expect(parsed.messages).toHaveLength(3);

        expect(parsed.messages[0].role).toBe('system');
        expect(parsed.messages[1].role).toBe('user');
        expect(parsed.messages[2].role).toBe('assistant');
      }
    } finally {
      await rm(tempDirectory, {
        recursive: true,
        force: true,
      });
    }
  });
});
