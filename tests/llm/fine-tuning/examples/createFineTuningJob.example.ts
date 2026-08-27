import { expect, test } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Fine-tuning - Create Job', () => {
  test('deve criar um job real de fine-tuning', async () => {
    const client = new OpenAI();

    const trainingFileId = 'file-Qz1s2UENuX8JjHDtmiSwM5';

    const job = await client.fineTuning.jobs.create({
      training_file: trainingFileId,
      model: 'gpt-4.1-mini-2025-04-14',
    });

    console.log('\n=== Fine-tuning Job Created ===');
    console.log({
      id: job.id,
      model: job.model,
      status: job.status,
      trainingFile: job.training_file,
      fineTunedModel: job.fine_tuned_model,
    });

    expect(job.id).toBeTruthy();
    expect(job.training_file).toBe(trainingFileId);
    expect(job.model).toBe('gpt-4.1-mini-2025-04-14');
    expect(['validating_files', 'queued', 'running']).toContain(job.status);
  });
});
