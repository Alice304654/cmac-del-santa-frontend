import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/HBAuthContext';

export default function ProtectedRoute({ children }) {
  const { token } = useAuth();

  // Si el cliente no tiene un JWT válido en el LocalStorage, lo mandamos al Login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}