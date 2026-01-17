import React from 'react';
import { X } from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onMenuItemClick: (item: string) => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, onMenuItemClick }) => {
  if (!isOpen) return null;

  const handleItemClick = (item: string) => {
    onMenuItemClick(item);
    onClose();
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />
      
      <div className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-br from-green-800 to-green-900 shadow-2xl z-50 transform transition-transform duration-300 md:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-green-700">
            <div className="flex items-center gap-2">
              <img src="/logo-171.svg" alt="Logo 171" className="w-6 h-6" />
              <h2 className="text-white font-bold text-lg">Menu</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-300 transition-colors p-1"
              title="Fechar"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleItemClick('4cores')}
                  className="w-full text-left px-4 py-3 text-white hover:bg-green-700 rounded-lg transition-colors font-medium"
                >
                  4 Cores
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleItemClick('progressao-cores')}
                  className="w-full text-left px-4 py-3 text-white hover:bg-green-700 rounded-lg transition-colors font-medium"
                >
                  Progressão de Cores
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
