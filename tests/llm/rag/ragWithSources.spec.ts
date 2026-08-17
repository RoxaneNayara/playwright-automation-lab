import { test, expect } from '@playwright/test';
import OpenAI from 'openai';
import { text } from 'stream/consumers';

test.describe('LLM - RAG - Sources', () => {
    test('deve recuperar contexto relevante e citar as fontes utilizadas', async () => {
        const client = new OpenAI();

        const question =
        'O que acontece após cinco tentativas inválidas e por quanto tempo a conta fica bloqueada'

        const documents = [
            {
                id: 'DOC_A',
                text: 'O suporte funciona de segunda a sexta-feira, das 09h às 18h.',
            },
            {
                id: 'DOC_B',
                text: 'Após cinco tentativas inválidas, a conta fica bloqueada por 30 minutos.',
            },
            {
                id: 'DOC_C',
                text: 'Usuários bloqueados não podem realizar novas tentativas até o fim do período de bloqueio.',
            },
            {
                id: 'DOC_D',
                text: 'O prazo médio inicial de resposta de suporte é de até 4 horas úteis'
            },
        ];

        const embeddingResponse = await client.embeddings.create({
            model: "text-embedding-3-small",
            input: [
                question,
                ...documents.map(document) => document.text),
            ],
        });

        const questionEmbedding = embeddingResponse.data[0].embedding;

        const cosineSimilarity = (
            vectorA: number 
        )
    })
})