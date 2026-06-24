import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. Validar longitud del DNI
    if (dni.length !== 8) {
      setError('El DNI debe tener exactamente 8 dígitos.');
      setLoading(false);
      return;
    }

    // 2. Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    // 3. Simulación de envío exitosa e inmediata al Core de la Caja
    setTimeout(() => {
      setLoading(false);
      alert('¡Usuario registrado con éxito en la Banca Internet de Caja del Santa!');
      navigate('/login'); // Te envía automáticamente a la pantalla de login
    }, 1500); // Espera 1.5 segundos mostrando "Procesando..." para que se vea real
  };

  return (
    <div style={{
      backgroundColor: '#f3f4f6',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px',
        boxSizing: 'border-box'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#005236', margin: '0 0 5px 0' }}>
            CREAR CUENTA
          </h1>
          <p style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', margin: '0' }}>
            Caja del Santa - Registro de Clientes
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '10px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '15px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Campo DNI */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>Número de DNI</label>
            <input
              type="text"
              maxLength={8}
              placeholder="Ingrese su DNI"
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
              required
              style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {/* Campo Contraseña */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>Defina su Clave de Internet</label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {/* Campo Confirmar Contraseña */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>Confirme su Clave</label>
            <input
              type="password"
              placeholder="Repita su contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#9ca3af' : '#00875A',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '14px',
              textTransform: 'uppercase',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '10px',
              boxShadow: '0 4px 6px -1px rgba(0, 135, 90, 0.2)'
            }}
          >
            {loading ? 'Procesando...' : 'Registrarme'}
          </button>

          {/* Enlace para volver */}
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              color: '#6b7280',
              fontWeight: '600',
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              marginTop: '5px'
            }}
          >
            Regresar al Login
          </button>
        </form>
      </div>
    </div>
  );
}