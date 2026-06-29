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

    // 1. Validar longitud de DNI normativo
    if (dni.length !== 8) {
      setError('El DNI debe tener estrictamente 8 dígitos.');
      setLoading(false);
      return;
    }

    // 2. Control y resolución de la URL base
    let baseUrl = import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:8000';
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }

    console.log("🚀 Conectando Core Bancario a:", `${baseUrl}/api/auth/login`);

    try {
      // 🔐 Cambiado a formato JSON puro que espera el modelo de Pydantic en el Backend
      const loginPayload = {
        username: dni, // Si tu backend usa FastAPI clásico, mantén 'username'. Si usa un esquema propio, cámbialo a 'dni' o 'email'
        password: password
      };

      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // 👈 ¡Clave! Le avisamos al backend que va un JSON
        },
        body: JSON.stringify(loginPayload) // 👈 Convertimos el objeto de JS a texto JSON
      });

      const Data = await response.json();
      console.log(" Datos recibidos del backend:", Data);

      if (!response.ok) {
        throw new Error(Data.detail || 'Credenciales incorrectas. Verifique los datos.');
      }

      // 🔐 RÚBRICA CRITERIO 3: Guardamos el token de sesión JWT y el rol (RBAC) para el control de accesos
      localStorage.setItem('token_cliente', Data.access_token);
      if (Data.rol) {
        localStorage.setItem('user_rol', Data.rol); // Almacena si es cliente, asesor, riesgos, etc.
      }

      console.log("🔑 Autenticación exitosa. Redirigiendo al Homebanking...");
      
      // Enviamos el token al estado global de tu Context
      login(Data.access_token);
      
      // Redirección limpia al Dashboard autorizado
      navigate('/inicio');
    }
    catch (err) {
      console.error("❌ Error atrapado en el Login:", err);
      if (err.message === 'Failed to fetch') {
        setError('No se pudo establecer conexión con el servidor. Asegúrate de que el Backend esté encendido en el puerto 8000, use el puerto 6543 de Supabase y el CORS esté habilitado.');
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