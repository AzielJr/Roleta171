import React, { useState } from 'react';

interface ResetButtonProps {
  onReset: () => void;
  disabled?: boolean;
}

export function ResetButton({ onReset, disabled = false }: ResetButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = () => {
    if (showConfirm) {
      onReset();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowConfirm(false), 3000);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800 font-medium mb-3">
            ⚠️ Tem certeza que deseja limpar todos os dados?
          </p>
          <p className="text-red-600 text-sm mb-4">
            Esta ação não pode ser desfeita. Todo o histórico e estatísticas serão perdidos.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleClick}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              ✓ Sim, limpar tudo
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              ✗ Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          px-6 py-3 rounded-lg font-bold text-white transition-all duration-200
          flex items-center gap-2 mx-auto
          ${
            disabled
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
          }
        `}
        title={disabled ? 'Nenhum dado para limpar' : 'Limpar todos os dados'}
      >
        <span className="text-xl">↻</span>
        Limpar Dados
      </button>
      
      {!disabled && (
        <p className="text-xs text-gray-500 mt-2">
          Clique para limpar histórico e estatísticas
        </p>
      )}
    </div>
  );
}