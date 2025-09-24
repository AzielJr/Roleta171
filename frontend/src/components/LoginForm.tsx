import React, { useState } from 'react';
import { supabase, R171Senha } from '../lib/supabase';

interface LoginFormProps {
  onLogin: (user: R171Senha) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      
      // Busca usuário pela senha na tabela r171_senha
      const { data, error } = await supabase
        .from('r171_senha')
        .select('id, created_at, nome, senha')
        .eq('senha', senha)
        .maybeSingle();

      if (error) {
        console.error('Erro do Supabase:', error);
        setError(`Erro na consulta: ${error.message}`);
        return;
      }

      if (!data) {
        setError('Senha incorreta. Tente novamente.');
        return;
      }

      // Login bem-sucedido
      onLogin(data);
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-green-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animação de fundo - Roleta girando */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <div className="w-96 h-96 border-8 border-yellow-400 rounded-full animate-spin-slow relative">
          {/* Números da roleta */}
          {Array.from({ length: 37 }, (_, i) => {
            const angle = (i * 360) / 37;
            const isRed = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(i);
            const isBlack = i !== 0 && !isRed;
            
            return (
              <div
                key={i}
                className={`absolute w-6 h-6 text-xs font-bold flex items-center justify-center rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                  i === 0 ? 'bg-green-500 text-white' : isRed ? 'bg-red-500 text-white' : 'bg-black text-white'
                }`}
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `rotate(${angle}deg) translateY(-180px) rotate(-${angle}deg)`,
                }}
              >
                {i}
              </div>
            );
          })}
        </div>
      </div>

      {/* Partículas flutuantes */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-pulse opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Container principal do login */}
      <div className="bg-black/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-yellow-400/30 relative z-10">
        {/* Logomarca */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-red-500 rounded-full mb-4 shadow-lg">
            <svg
              viewBox="0 0 100 100"
              className="w-12 h-12 text-white"
              fill="currentColor"
            >
              {/* Roleta */}
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3" />
              <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="1" />
              
              {/* Divisões da roleta */}
              {Array.from({ length: 8 }, (_, i) => {
                const angle = (i * 45) - 90;
                const x1 = 50 + 25 * Math.cos((angle * Math.PI) / 180);
                const y1 = 50 + 25 * Math.sin((angle * Math.PI) / 180);
                const x2 = 50 + 45 * Math.cos((angle * Math.PI) / 180);
                const y2 = 50 + 45 * Math.sin((angle * Math.PI) / 180);
                
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                );
              })}
              
              {/* Centro */}
              <circle cx="50" cy="50" r="8" fill="currentColor" />
              
              {/* Números 171 */}
              <text x="50" y="35" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">171</text>
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 mb-2">
            Roleta 171
          </h1>
          <p className="text-gray-300 text-sm">
            Sistema de Análise Estratégica
          </p>
        </div>

        {/* Formulário de login */}
         <form onSubmit={handleLogin} className="space-y-6">
           {/* Campo de usuário oculto para acessibilidade */}
           <input
             type="text"
             name="username"
             autoComplete="username"
             style={{ display: 'none' }}
             tabIndex={-1}
             aria-hidden="true"
           />
           
           <div>
             <label htmlFor="senha" className="block text-sm font-medium text-gray-300 mb-2">
               Senha de Acesso
             </label>
             <div className="relative">
               <input
                 type={showPassword ? 'text' : 'password'}
                 id="senha"
                 name="password"
                 value={senha}
                 onChange={(e) => setSenha(e.target.value)}
                 className="w-full px-4 py-3 pr-12 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                 placeholder="Digite sua senha"
                 required
                 disabled={loading}
                 autoComplete="current-password"
               />
               <button
                 type="button"
                 onClick={() => setShowPassword(!showPassword)}
                 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-400 transition-colors duration-200"
                 disabled={loading}
               >
                 {showPassword ? (
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                   </svg>
                 ) : (
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                   </svg>
                 )}
               </button>
             </div>
           </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm text-center animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-500 to-red-500 hover:from-yellow-600 hover:to-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Verificando...
              </div>
            ) : (
              'Entrar no Sistema'
            )}
          </button>
        </form>

        {/* Rodapé */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-xs">
            Acesso restrito • Sistema seguro
          </p>
        </div>
      </div>

      {/* Efeito de brilho */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-red-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
    </div>
  );
};