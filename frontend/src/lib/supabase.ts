import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      'Cache-Control': 'no-cache'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Tipos para as tabelas existentes
export interface R171Senha {
  id: number
  created_at: string
  nome: string | null
  senha: string | null
}

export interface R171Saldo {
  id: number | string
  created_at: string
  id_senha: number | null
  data: string | null
  saldo_inicial: number | null
  saldo_atual: number | null
  vlr_lucro: number | null
  per_lucro: number | null
}