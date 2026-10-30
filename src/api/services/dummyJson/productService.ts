import { APIRequestContext, APIResponse } from '@playwright/test';
import { config } from '@core/config/configurationManager';

type Headers = Record<string, string>;

export class ProductService {
  private readonly baseUrl: string;

  constructor(private readonly request: APIRequestContext) {
    this.baseUrl = `${config.getBaseUrl('DummyJsonApi')}/products`;
  }

  listar(params?: { limit?: number; skip?: number }): Promise<APIResponse> {
    return this.request.get(this.baseUrl, { params: params ?? {} });
  }

  buscarPorId(id: number): Promise<APIResponse> {
    return this.request.get(`${this.baseUrl}/${id}`);
  }

  buscarPorTermo(termo: string): Promise<APIResponse> {
    return this.request.get(`${this.baseUrl}/search`, { params: { q: termo } });
  }

  criar(dados: unknown, headers?: Headers): Promise<APIResponse> {
    return this.request.post(`${this.baseUrl}/add`, { data: dados, headers: headers ?? {} });
  }

  atualizar(id: number, dados: unknown, headers?: Headers): Promise<APIResponse> {
    return this.request.put(`${this.baseUrl}/${id}`, { data: dados, headers: headers ?? {} });
  }

  atualizarParcial(id: number, dados: unknown, headers?: Headers): Promise<APIResponse> {
    return this.request.patch(`${this.baseUrl}/${id}`, { data: dados, headers: headers ?? {} });
  }

  excluir(id: number): Promise<APIResponse> {
    return this.request.delete(`${this.baseUrl}/${id}`);
  }
}
