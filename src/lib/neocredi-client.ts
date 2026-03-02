export interface NeocrediSolicitacao {
  id: number;
  status: string;
  [key: string]: any;
}

export interface NeocrediResultado {
  id: number;
  status: string; // ex: "CONCLUIDO", "PROCESSANDO", "ERRO"
  [key: string]: any;
}

export class NeocrediClient {
  private baseURL = 'https://app-api.neocredit.com.br';

  constructor(private token: string) {}

  private async request<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      accept: 'application/json',
      Authorization: `Bearer ${this.token}`,
      ...((opts.headers as Record<string, string>) || {}),
    };

    if (opts.body) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${this.baseURL}${path}`, { ...opts, headers });
    const text = await res.text();
    let body: any;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      body = text;
    }

    if (!res.ok) {
      const err = new Error(`Neocredi API error: ${res.status} ${res.statusText}`) as any;
      err.status = res.status;
      err.body = body;
      console.error(`Neocredi request failed ${res.status} url=${this.baseURL}${path}`, body);
      throw err;
    }

    return body as T;
  }

  /**
   * Inicia uma consulta assíncrona na Neocredi.
   * Retorna o objeto de solicitação com o ID para polling posterior.
   */
  async initiate(analiseMotorId: string, documento: string, emailSolicitante: string): Promise<NeocrediSolicitacao> {
    return this.request<NeocrediSolicitacao>(
      `/empresa-esteira-solicitacao/${analiseMotorId}/integracao`,
      {
        method: 'POST',
        body: JSON.stringify({
          documento,
          emailSolicitante,
          id_analise_motor: analiseMotorId,
          resultadoCompletoReceita: 'json',
        }),
      }
    );
  }

  /**
   * Consulta o resultado de uma solicitação já iniciada.
   */
  async getResult(solicitacaoId: number): Promise<NeocrediResultado> {
    return this.request<NeocrediResultado>(
      `/empresa-esteira-solicitacao/${solicitacaoId}/simplificada`
    );
  }
}
