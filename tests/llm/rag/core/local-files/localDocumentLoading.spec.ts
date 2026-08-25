import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe('LLM - RAG - Local Document Loading', () => {
  test('deve carregar documentos locais utilizados pelo RAG', () => {
    const fixturesPath = path.resolve('tests/llm/rag/fixtures');

    const documents = [
      {
        id: 'DOC_LOGIN',
        fileName: 'login.md',
      },
      {
        id: 'DOC_SUPPORT',
        fileName: 'support.md',
      },
      {
        id: 'DOC_PAYMENT',
        fileName: 'payment.md',
      },
    ];

    const loadedDocuments = documents.map((document) => {
      const filePath = path.join(fixturesPath, document.fileName);

      const text = fs.readFileSync(filePath, 'utf-8');

      return {
        ...document,
        filePath,
        text,
      };
    });

    console.log('Loaded documents:', loadedDocuments);

    expect(loadedDocuments).toHaveLength(3);

    for (const document of loadedDocuments) {
      expect(document.text.trim().length).toBeGreaterThan(0);
    }

    expect(loadedDocuments[0].text).toContain('30 minutos');

    expect(loadedDocuments[1].text).toContain('quatro horas úteis');

    expect(loadedDocuments[2].text).toContain('Cobranças duplicadas');
  });
});
