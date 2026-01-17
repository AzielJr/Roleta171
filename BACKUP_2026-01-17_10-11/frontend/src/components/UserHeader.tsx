import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBalance } from '../contexts/BalanceContext';
import { Menu } from 'lucide-react';

interface UserHeaderProps {
  className?: string;
  onEditSaldo?: () => void;
  onMenuClick?: () => void;
  onMobileMenuClick?: () => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ className = '', onEditSaldo, onMenuClick, onMobileMenuClick }) => {
  const { user } = useAuth();
  const { balance, loading, currentSaldoRecord, lastSaldoRecord, refreshBalance } = useBalance();

  // Atualizar saldo a cada 5 segundos
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      refreshBalance();
    }, 5000);

    return () => clearInterval(interval);
  }, [user, refreshBalance]);

  // Usar o último registro se não houver registro do dia atual, senão usar o registro atual
  const recordToShow = currentSaldoRecord || lastSaldoRecord;
  const percentualAnterior = recordToShow?.per_lucro || 0;
  const saldoAtual = recordToShow?.saldo_atual || 0;
  const isPositive = percentualAnterior > 0;

  // Se não há usuário logado, mostra apenas o título
  if (!user) {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-3">
          <img src="/logo-171.svg" alt="Logo 171" className="w-8 h-8" />
          <h1 className="text-2xl font-bold text-white" style={{marginTop: '-15px'}}>Roleta 171</h1>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Título Principal */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={onMobileMenuClick || onMenuClick}
          className="flex items-center gap-3 focus:outline-none"
        >
          <img src="/logo-171.svg" alt="Logo 171" className="w-8 h-8" />
          <h1 className="text-2xl font-bold text-white hidden md:block" style={{marginTop: '-15px'}}>Roleta 171</h1>
        </button>
        
        {/* Informações do Usuário */}
        {user && (
          <div className="flex items-center space-x-3 text-sm hidden md:flex" style={{marginLeft: '50px'}}>
            {/* Nome do Usuário */}
            <span className="text-green-300 font-medium">
              {user.nome || 'Usuário'}
            </span>
            
            {/* Separador */}
            <span className="text-green-300">|</span>
            
            {/* Saldo Atual - Clicável para editar */}
            <span 
              className="text-green-300 font-semibold cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                if (onEditSaldo) {
                  onEditSaldo();
                  // Scroll suave até o final da página
                  setTimeout(() => {
                    window.scrollTo({
                      top: document.body.scrollHeight,
                      behavior: 'smooth'
                    });
                  }, 100);
                }
              }}
              title="Clique para editar saldo"
            >
              R$ {saldoAtual.toLocaleString('pt-BR', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </span>
            
            {/* Separador e Percentual de Lucro */}
            <span className="text-green-300">|</span>
            <span className="text-green-300 font-normal">
              {percentualAnterior >= 0 ? '+' : ''}{percentualAnterior.toLocaleString('pt-BR', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}%
            </span>
          </div>
        )}
      </div>

      {/* Informações Adicionais (Data) - REMOVIDO */}
    </div>
  );
};

export default UserHeader;