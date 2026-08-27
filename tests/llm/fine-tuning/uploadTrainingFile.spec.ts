import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import OpenAI from 'openai';

test.describe('LLM - Fine-tuning - Upload Training File', () => {
  test('deve fazer upload do dataset com purpose fine-tune', async () => {
    const client = new OpenAI();

    const filePath = 'tests/llm/fine-tuning/data/support-classification-training.jsonl';

    const uploadedFile = await client.files.create({
      file: fs.createReadStream(filePath),
      purpose: 'fine-tune',
    });

    console.log('\n=== Fine-tuning Training File Upload ===');
    console.log({
      id: uploadedFile.id,
      filename: uploadedFile.filename,
      purpose: uploadedFile.purpose,
      bytes: uploadedFile.bytes,
      status: uploadedFile.status,
    });

    expect(uploadedFile.id).toBeTruthy();
    expect(uploadedFile.filename).toBe('support-classification-training.jsonl');
    expect(uploadedFile.purpose).toBe('fine-tune');
    expect(uploadedFile.bytes).toBeGreaterThan(0);
  });
});
