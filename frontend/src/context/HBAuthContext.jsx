import React, { createContext, useState, useEffect, useContext } from 'react';

// Crear el contexto con el nombre exacto que tus hooks necesitan
export const HBAuthContext = createContext(null);

export const HBAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token_cliente') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Validamos la sesión activa usando el token JWT guardado
      setUser({ loggedIn: true });
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const login = (jwtToken) => {
    localStorage.setItem('token_cliente', jwtToken);
    setToken(jwtToken);
    setUser({ loggedIn: true });
  };

  const logout = () => {
    localStorage.removeItem('token_cliente');
    setToken(null);
    setUser(null);
  };

  return (
    <HBAuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </HBAuthContext.Provider>
  );
};

// Hook personalizado nativo para consumir el contexto en tus páginas
export const useHBAuth = () => {
  const context = useContext(HBAuthContext);
  if (!context) {
    throw new Error('useHBAuth debe usarse dentro de un HBAuthProvider');
  }
  return context;
};