// API Client para Backend MySQL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Interfaces mantidas compatíveis com Supabase
export interface R171Senha {
  id: number;
  created_at: string;
  nome: string | null;
  senha: string | null;
}

export interface R171Saldo {
  id: number;
  created_at: string;
  id_senha: number | null;
  data: string | null;
  saldo_inicial: number | null;
  saldo_atual: number | null;
  vlr_lucro: number | null;
  per_lucro: number | null;
}

export interface R171DuzCol {
  id: number;
  created_at: string;
  tipo: 'D' | 'C';
  n1?: boolean;
  n2?: boolean;
  n3?: boolean;
  valor: number;
  total: number;
  retorno: number;
  status: boolean;
  id_senha?: number;
}

// Helper para fazer requisições
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================
// API de Autenticação
// ============================================
export const authAPI = {
  async login(nome: string, senha: string): Promise<{ user: R171Senha }> {
    return fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nome, senha }),
    });
  },

  async register(nome: string, senha: string): Promise<{ user: R171Senha }> {
    return fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nome, senha }),
    });
  },
};

// ============================================
// API de Saldo
// ============================================
export const saldoAPI = {
  async getLast(id_senha: number): Promise<{ saldo: R171Saldo | null }> {
    return fetchAPI(`/saldo/last/${id_senha}`);
  },

  async getHistory(
    id_senha: number,
    dataInicial?: string,
    dataFinal?: string
  ): Promise<{ saldos: R171Saldo[] }> {
    const params = new URLSearchParams();
    if (dataInicial) params.append('dataInicial', dataInicial);
    if (dataFinal) params.append('dataFinal', dataFinal);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/saldo/history/${id_senha}${query}`);
  },

  async create(data: {
    id_senha: number;
    data?: string;
    saldo_inicial?: number;
    saldo_atual?: number;
    vlr_lucro?: number;
    per_lucro?: number;
  }): Promise<{ saldo: R171Saldo }> {
    return fetchAPI('/saldo', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(
    id: number,
    data: {
      saldo_inicial?: number;
      saldo_atual?: number;
      vlr_lucro?: number;
      per_lucro?: number;
    }
  ): Promise<{ saldo: R171Saldo }> {
    return fetchAPI(`/saldo/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<{ message: string }> {
    return fetchAPI(`/saldo/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// Compatibilidade com código Supabase antigo
// ============================================
export const api = {
  // Simular estrutura do Supabase para facilitar migração
  from: (table: string) => {
    if (table === 'r171_senha') {
      return {
        select: async (columns: string = '*') => {
          // Não implementado - usar authAPI.login diretamente
          throw new Error('Use authAPI.login() ao invés de api.from("r171_senha").select()');
        },
      };
    }
    
    if (table === 'r171_saldo') {
      return {
        select: async (columns: string = '*') => {
          // Não implementado - usar saldoAPI diretamente
          throw new Error('Use saldoAPI.getHistory() ao invés de api.from("r171_saldo").select()');
        },
        insert: async (data: any) => {
          return saldoAPI.create(data);
        },
        update: async (data: any) => {
          // Precisa do ID - não suportado neste formato
          throw new Error('Use saldoAPI.update(id, data) ao invés de api.from("r171_saldo").update()');
        },
      };
    }
    
    throw new Error(`Tabela ${table} não suportada`);
  },
};

// Health check
export async function checkAPIHealth(): Promise<{ status: string; database: string }> {
  return fetchAPI('/health');
}
