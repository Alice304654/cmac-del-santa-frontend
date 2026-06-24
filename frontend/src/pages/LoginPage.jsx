import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHBAuth } from '../context/HBAuthContext.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useHBAuth();
  
  const [dni, setDni] = useState('60105521'); // Tu DNI por defecto
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. Validar longitud del DNI
    if (dni.length !== 8) {
      setError('El DNI debe tener estrictamente 8 dígitos.');
      setLoading(false);
      return;
    }

    // 2. Control/Depuración: Verificamos si la URL de la variable de entorno existe
    const baseUrl = import.meta.env.VITE_BASE_URL;
    console.log("Intentando conectar a:", baseUrl ? `${baseUrl}/auth/login` : "URL INDEFINIDA (Revisa tu archivo .env)");

    if (!baseUrl) {
      setError('Error interno: La URL del servidor no está configurada en las variables de entorno (.env).');
      setLoading(false);
      return;
    }

    try {
      // 🚀 Conexión con tu backend FastAPI
      // NOTA: Si tu FastAPI usa 'OAuth2PasswordRequestForm', descomenta la OPCIÓN B y comenta la OPCIÓN A.
      
      // === OPCIÓN A: Envío estándar en formato JSON ===
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: dni,
          password: password
        })
      });

      /* === OPCIÓN B: Envío en formato Formulario (Descomenta esto si usas OAuth2 nativo en FastAPI) ===
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: dni,
          password: password
        })
      });
      */

      const data = await response.json();

      if (!response.ok) {
        // Captura el mensaje detallado enviado por FastAPI (detail) o un error genérico
        throw new Error(data.detail || 'Credenciales incorrectas. Verifique los datos.');
      }

      // Guardamos el token en el contexto global y LocalStorage
      login(data.access_token);

      // Redirección directa al Homebanking
      navigate('/inicio'); 

    } catch (err) {
      // Si el backend está caído o hay error de CORS, entrará aquí directamente como "Failed to fetch"
      if (err.message === 'Failed to fetch') {
        setError('No se pudo establecer conexión con el servidor. Asegúrate de que el Backend esté encendido y tenga CORS habilitado.');
      } else {
        setError(err.message || 'Error de conexión con el Homebanking API.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#f3f4f6', minHeight: '100vh', display: 'flex',
      justifyContent: 'center', alignItems: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '20px', boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#ffffff', padding: '40px', borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '400px', boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#005236', margin: '0 0 5px 0' }}>
            CAJA DEL SANTA
          </h1>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', margin: '0', textTransform: 'uppercase' }}>
            Home Banking - Portal de Personas
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '15px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>Número de DNI</label>
            <input
              type="text" maxLength={8} value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))} required
              style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#eff6ff' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>Clave de Internet</label>
            <input
              type="password" placeholder="******" value={password}
              onChange={(e) => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginTop: '5px' }}>
            <span style={{ color: '#6b7280', cursor: 'pointer' }}>¿Olvidó su contraseña?</span>
            <span onClick={() => navigate('/register')} style={{ color: '#00875A', fontWeight: '600', cursor: 'pointer' }}>Registrarse</span>
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', backgroundColor: loading ? '#9ca3af' : '#00875A', color: '#ffffff',
              fontWeight: '700', fontSize: '14px', textTransform: 'uppercase', padding: '12px',
              borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '15px',
              boxShadow: '0 4px 6px -1px rgba(0, 135, 90, 0.2)'
            }}
          >
            {loading ? 'Procesando...' : 'Ingresar a mi Banca'}
          </button>
        </form>
      </div>
    </div>
  );
}