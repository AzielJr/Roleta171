import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const supabase = createClient(supabaseUrl, supabaseKey);

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
  status: boolean; // true = WIN, false = LOSS
  id_senha?: number;
}