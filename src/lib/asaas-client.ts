interface AsaasCustomer {
  id: string;
  name: string;
  cpfCnpj: string;
  [key: string]: any;
}

interface AsaasListResponse {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: AsaasCustomer[];
}

export interface AsaasPayment {
  id: string;
  customer: string;
  value: number;
  status: string;
  billingType: string;
}

export interface AsaasPixQrCode {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

export class AsaasClient {
  private apiKey: string;
  private baseURL = 'https://api-sandbox.asaas.com/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;

    if (!this.apiKey) {
      console.warn('AsaasClient: ASAAS_API_KEY is not provided or is empty');
    }
  }

  private async request<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const baseHeaders: Record<string, string> = {
      access_token: this.apiKey,
      Accept: 'application/json',
      ...((opts.headers as Record<string, string>) || {}),
    };

    // Only set Content-Type if there is a body (avoid issues with GET)
    if (opts.body) {
      baseHeaders['Content-Type'] = baseHeaders['Content-Type'] || 'application/json';
    }

    const res = await fetch(`${this.baseURL}${path}`, { ...opts, headers: baseHeaders });
    const text = await res.text();
    let body: any;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      body = text;
    }

    if (!res.ok) {
      // mask api key for logs
      const maskedKey = this.apiKey ? `${this.apiKey.slice(0, 4)}...${this.apiKey.slice(-4)}` : 'undefined';

      console.error(`Asaas request failed ${res.status} ${res.statusText} url=${this.baseURL}${path} key=${maskedKey}`, body);

      const err = new Error(`Asaas API error: ${res.status} ${res.statusText}`) as any;
      err.status = res.status;
      err.body = body;

      // attach any API error messages in a readable form
      if (body && body.errors) {
        try {
          err.message = `${err.message} - ${JSON.stringify(body.errors)}`;
        } catch {}
      }

      throw err;
    }

    return body as T;
  }

  /**
   * Busca um cliente existente no Asaas pelo CPF/CNPJ
   */
  async findCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomer | null> {
    const params = new URLSearchParams({ cpfCnpj });
    const response = await this.request<AsaasListResponse>(`/customers?${params.toString()}`);

    if (response.data && response.data.length > 0) {
      return response.data[0];
    }

    return null;
  }

  /**
   * Cria um novo cliente no Asaas
   */
  async createCustomer(data: { name: string; cpfCnpj: string }): Promise<AsaasCustomer> {
    const response = await this.request<AsaasCustomer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response;
  }

  /**
   * Busca ou cria um cliente no Asaas
   */
  async findOrCreateCustomer(data: { name: string; cpfCnpj: string }): Promise<AsaasCustomer> {
    const existingCustomer = await this.findCustomerByCpfCnpj(data.cpfCnpj);

    if (existingCustomer) {
      return existingCustomer;
    }

    return await this.createCustomer(data);
  }

  /**
   * Cria uma cobrança PIX no Asaas
   */
  async createPayment(data: { customer: string; billingType: string; value: number; dueDate: string }): Promise<AsaasPayment> {
    return this.request<AsaasPayment>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Obtém o QR Code PIX de uma cobrança
   */
  async getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
    return this.request<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`);
  }
}
