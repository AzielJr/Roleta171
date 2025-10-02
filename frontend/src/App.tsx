import React from 'react';
import RouletteBoard from './components/RouletteBoard';
import { LoginForm } from './components/LoginForm';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BalanceProvider } from './contexts/BalanceContext';
import { useRouletteState } from './hooks/useRouletteState';
import AlertPanel from './components/AlertPanel';

function AppContent() {
  const { isAuthenticated, login, logout } = useAuth();
  const { history, statistics, alert, addNumber, resetState, dismissAlert } = useRouletteState();

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 py-8">
      {alert && (
        <AlertPanel 
          type={alert.type || 'info'} 
          message={alert.message} 
          onDismiss={dismissAlert} 
        />
      )}
      <RouletteBoard onLogout={logout} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BalanceProvider>
        <AppContent />
      </BalanceProvider>
    </AuthProvider>
  );
}

export default App;
