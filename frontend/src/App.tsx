import React, { useState, useEffect } from 'react';
import RouletteBoard from './components/RouletteBoard';
import Login from './components/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar se já está logado (localStorage)
  useEffect(() => {
    const authStatus = localStorage.getItem('roleta171_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('roleta171_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('roleta171_auth');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 py-8">
      <RouletteBoard onLogout={handleLogout} />
    </div>
  );
}

export default App;
