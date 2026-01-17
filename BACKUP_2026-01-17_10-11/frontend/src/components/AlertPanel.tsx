import React, { useEffect } from 'react';

interface AlertPanelProps {
  type: string;
  message: string;
  onDismiss: () => void;
}

const AlertPanel: React.FC<AlertPanelProps> = ({ type, message, onDismiss }) => {
  // Efeito para auto-dismiss após 30 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 30000);
    
    return () => clearTimeout(timer);
  }, [onDismiss]);

  // Determina as cores com base no tipo de alerta
  const getAlertStyles = () => {
    switch (type) {
      case 'pattern171':
        return 'bg-yellow-500 border-yellow-600';
      case 'race':
        return 'bg-orange-500 border-orange-600';
      default:
        return 'bg-blue-500 border-blue-600';
    }
  };

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-lg ${getAlertStyles()} text-white p-4 rounded-lg shadow-lg border-2 animate-pulse`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-2xl mr-2">⚠️</span>
          <div>
            <h3 className="font-bold text-lg">
              {type === 'pattern171' ? 'Padrão 171 Detectado!' : 'Alerta'}
            </h3>
            <p>{message}</p>
          </div>
        </div>
        <button 
          onClick={onDismiss}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-1 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AlertPanel;