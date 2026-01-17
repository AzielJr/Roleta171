import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStructure() {
  console.log('🔍 Verificando estrutura das tabelas no Supabase...\n');

  // Verificar biblia_cc
  console.log('📋 Tabela: biblia_cc');
  const { data: ccSample, error: ccError } = await supabase
    .from('biblia_cc')
    .select('*')
    .limit(3);
  
  if (ccError) {
    console.error('❌ Erro:', ccError);
  } else {
    console.log('Campos:', Object.keys(ccSample[0] || {}));
    console.log('Exemplo de dados:', JSON.stringify(ccSample[0], null, 2));
  }

  console.log('\n📋 Tabela: biblia_livros');
  const { data: livrosSample, error: livrosError } = await supabase
    .from('biblia_livros')
    .select('*')
    .limit(3);
  
  if (livrosError) {
    console.error('❌ Erro:', livrosError);
  } else {
    console.log('Campos:', Object.keys(livrosSample[0] || {}));
    console.log('Exemplo de dados:', JSON.stringify(livrosSample[0], null, 2));
  }

  console.log('\n📋 Tabela: biblia_versiculo');
  const { data: versiculoSample, error: versiculoError } = await supabase
    .from('biblia_versiculo')
    .select('*')
    .limit(3);
  
  if (versiculoError) {
    console.error('❌ Erro:', versiculoError);
  } else {
    console.log('Campos:', Object.keys(versiculoSample[0] || {}));
    console.log('Exemplo de dados:', JSON.stringify(versiculoSample[0], null, 2));
  }
}

checkStructure();
