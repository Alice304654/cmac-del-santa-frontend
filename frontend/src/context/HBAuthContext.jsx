import React, { createContext, useState, useEffect, useContext } from 'react';

export const HBAuthContext = createContext(null);

export const HBAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token_cliente') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        setUser({ 
          loggedIn: true,
          id: payload.pkcliente,        // ← corregido: era payload.id
          username: payload.sub,
          rol: payload.rol || payload.tipo,
          pkcliente: payload.pkcliente,
          nombre: payload.nombre,
        });
      } catch (error) {
        console.error("Error al decodificar el JWT:", error);
        logout();
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const login = (jwtToken) => {
    localStorage.setItem('token_cliente', jwtToken);
    setToken(jwtToken);
    const base64Url = jwtToken.split('.')[1];
    const payload = JSON.parse(window.atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')));
    setUser({ 
      loggedIn: true, 
      id: payload.pkcliente,           // ← corregido: era payload.id
      username: payload.sub, 
      rol: payload.rol || payload.tipo,
      pkcliente: payload.pkcliente,
      nombre: payload.nombre,
    });
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

export const useHBAuth = () => {
  const context = useContext(HBAuthContext);
  if (!context) {
    throw new Error('useHBAuth debe usarse dentro de un HBAuthProvider');
  }
  return context;
};
