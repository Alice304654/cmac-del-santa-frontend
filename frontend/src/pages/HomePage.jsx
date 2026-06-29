import React, { useEffect, useState } from 'react';
import { useHBAuth } from '../context/HBAuthContext.jsx';

const ESTADO_CONFIG = {
  'Desembolsado':    { color: '#16a34a', bg: '#f0fdf4', label: 'Desembolsado',    dot: '🟢' },
  'En Evaluacion':   { color: '#d97706', bg: '#fffbeb', label: 'En Evaluación',   dot: '🟡' },
  'en_evaluacion':   { color: '#d97706', bg: '#fffbeb', label: 'En Evaluación',   dot: '🟡' },
  'Aprobado':        { color: '#2563eb', bg: '#eff6ff', label: 'Aprobado',         dot: '🔵' },
  'Rechazado':       { color: '#dc2626', bg: '#fef2f2', label: 'Rechazado',        dot: '🔴' },
  'rechazado':       { color: '#dc2626', bg: '#fef2f2', label: 'Rechazado',        dot: '🔴' },
};

function estadoInfo(estado) {
  return ESTADO_CONFIG[estado] || { color: '#6b7280', bg: '#f9fafb', label: estado, dot: '⚪' };
}

export default function HomePage() {
  const { user, token } = useHBAuth();
  const [cuentas, setCuentas]     = useState([]);
  const [creditos, setCreditos]   = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    async function cargar() {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [resCuentas, resCreditos] = await Promise.all([
          fetch(`http://127.0.0.1:8000/api/cuentas/${user.id}`),
          fetch(`http://127.0.0.1:8000/api/creditos/historial`, { headers }),
        ]);

        const dataCuentas  = await resCuentas.json();
        const dataCreditos = await resCreditos.json();

        setCuentas(Array.isArray(dataCuentas)  ? dataCuentas  : []);
        setCreditos(Array.isArray(dataCreditos) ? dataCreditos : []);
      } catch (err) {
        console.error('Error al cargar datos:', err);
      } finally {
        setLoading(false);
      }
    }

    cargar();
  }, [user?.id]);

  const activos   = creditos.filter(c => ['Desembolsado', 'Aprobado'].includes(c.estado));
  const enProceso = creditos.filter(c => ['En Evaluacion', 'en_evaluacion'].includes(c.estado));
  const historial = creditos.filter(c => ['Rechazado', 'rechazado'].includes(c.estado));

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#003B73', fontSize: '18px', fontWeight: 'bold' }}>
      Sincronizando con el Core Bancario...
    </div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1152px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>

      {/* Cabecera */}
      <div style={{ background: 'linear-gradient(135deg, #003B73, #005B96)', color: '#fff', padding: '24px 32px', borderRadius: '18px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>¡Bienvenido{user?.nombre ? `, ${user.nombre}` : ''}!</h2>
          <p style={{ color: '#bfdbfe', fontSize: '13px', margin: '4px 0 0' }}>Caja del Santa Digital — Impulsando tus proyectos desde 1986.</p>
        </div>
        <span style={{ background: '#00A8E8', color: '#fff', fontSize: '12px', fontWeight: '700', padding: '6px 14px', borderRadius: '999px' }}>Cliente Verificado</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* ── CUENTAS DE AHORRO ── */}
        <div>
          <h3 style={secTitle}>Tus Cuentas de Ahorro</h3>
          {cuentas.length === 0 ? (
            <div style={emptyBox}>No registras cuentas de ahorro activas.</div>
          ) : cuentas.map(c => (
            <div key={c.id} style={card}>
              <div>
                <p style={{ fontWeight: '700', color: '#1f2937', margin: 0 }}>{c.tipo_cuenta}</p>
                <p style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace', margin: '4px 0 0' }}>{c.numero_cuenta}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>Saldo disponible</p>
                <p style={{ fontSize: '20px', fontWeight: '900', color: '#003B73', margin: '2px 0 0' }}>
                  {c.moneda} {parseFloat(c.saldo).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── PRÉSTAMOS Y SOLICITUDES ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Préstamos activos/aprobados */}
          <div>
            <h3 style={secTitle}>Préstamos Activos</h3>
            {activos.length === 0 ? (
              <div style={emptyBox}>No cuentas con créditos desembolsados vigentes.</div>
            ) : activos.map(c => <CreditoCard key={c.id} credito={c} />)}
          </div>

          {/* En evaluación */}
          {enProceso.length > 0 && (
            <div>
              <h3 style={secTitle}>Solicitudes en Evaluación</h3>
              {enProceso.map(c => <CreditoCard key={c.id} credito={c} />)}
            </div>
          )}

          {/* Historial rechazados */}
          {historial.length > 0 && (
            <div>
              <h3 style={secTitle}>Solicitudes Anteriores</h3>
              {historial.map(c => <CreditoCard key={c.id} credito={c} />)}
            </div>
          )}

          {/* Acción */}
          <a href="/creditos/solicitar" style={{ display: 'block', textAlign: 'center', background: '#00A8E8', color: '#fff', padding: '13px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', textDecoration: 'none' }}>
            + Solicitar Nuevo Crédito Online
          </a>
        </div>

      </div>
    </div>
  );
}

function CreditoCard({ credito }) {
  const cfg = estadoInfo(credito.estado);
  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '10px', border: `1.5px solid ${cfg.color}20`, borderLeft: `4px solid ${cfg.color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontWeight: '700', color: '#1f2937', margin: 0, fontSize: '14px' }}>
            {credito.tipo_credito || 'Crédito de Consumo'}
          </p>
          <p style={{ fontSize: '11px', color: '#9ca3af', margin: '3px 0 0' }}>
            S/ {parseFloat(credito.monto_solicitado).toFixed(2)} · {credito.plazo_meses} meses
          </p>
        </div>
        <span style={{ background: cfg.bg, color: cfg.color, fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
          {cfg.dot} {cfg.label}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '12px' }}>
        {[
          ['Cuota mensual', `S/ ${parseFloat(credito.cuota_mensual).toFixed(2)}`],
          ['RDS', `${parseFloat(credito.rds_calculado).toFixed(1)}%`],
          ['Instancia', credito.nivel_aprobacion || '—'],
        ].map(([label, val]) => (
          <div key={label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '8px 10px' }}>
            <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
            <p style={{ fontSize: '13px', fontWeight: '700', color: '#374151', margin: '3px 0 0' }}>{val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const secTitle = {
  fontSize: '14px', fontWeight: '800', color: '#003B73',
  borderBottom: '1px solid #e5e7eb', paddingBottom: '8px',
  margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em',
};

const card = {
  background: '#fff', borderRadius: '12px', padding: '16px 20px',
  marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  border: '1px solid #f3f4f6', display: 'flex',
  justifyContent: 'space-between', alignItems: 'center',
};

const emptyBox = {
  background: '#fff', padding: '14px 16px', borderRadius: '10px',
  border: '1px solid #e5e7eb', color: '#6b7280', fontSize: '13px',
};
