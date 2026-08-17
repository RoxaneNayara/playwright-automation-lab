import { test, expect } from '@playwright/test';
import OpenAI from 'openai';

test.describe('LLM - Fundamentals - Basic Response', () => {
  test('deve retornar uma resposta para um prompt simples', async () => {
    const client = new OpenAI();

    const response = await client.responses.create({
    model: 'gpt-5.6-luna',
    instructions: 'Responda sempre de forma objetiva e use apenas uma palavra.',
    input: 'Qual área de tecnologia é responsável pela qualidade de software?',
    });

    console.log(response.usage);
    console.log(response.output_text);

        const actualAnswer = response.output_text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

        const acceptedTerms = [
        'qa',
        'quality assurance',
        'qualidade',
        'testing',
        ];

        const isAccepted = acceptedTerms.some((term) =>
        actualAnswer.includes(term.toLowerCase())
        );

        expect(isAccepted).toBeTruthy();
  
  });
});