import React, { useState } from 'react';
import { useHBAuth } from '../context/HBAuthContext.jsx';
import useCreditos from '../hooks/useCreditos';

const COLORES = {
  Verde:  { bg: '#f0fdf4', border: '#16a34a', text: '#15803d', badge: '#dcfce7' },
  Ámbar:  { bg: '#fffbeb', border: '#d97706', text: '#b45309', badge: '#fef3c7' },
  Rojo:   { bg: '#fef2f2', border: '#dc2626', text: '#b91c1c', badge: '#fee2e2' },
};

const ICONO_SEMAFORO = { Verde: '🟢', Ámbar: '🟡', Rojo: '🔴' };

export default function SolicitarCreditoPage() {
  const { user, token } = useHBAuth();
  const { cargando } = useCreditos();

  const [form, setForm] = useState({
    monto: '',
    plazo: '12',
    ingresos: '',
    obligaciones: '0',
  });
  const [simulacion, setSimulacion] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSimulacion(null);
    setResultado(null);
    setError('');
  };

  const calcular = (e) => {
    e.preventDefault();
    const monto = parseFloat(form.monto);
    const plazo = parseInt(form.plazo);
    const ingresos = parseFloat(form.ingresos);
    const obligaciones = parseFloat(form.obligaciones) || 0;

    if (!monto || !ingresos) {
      setError('Completa el monto y tus ingresos para simular.');
      return;
    }

    const tea = 0.35;
    const tem = Math.pow(1 + tea, 1 / 12) - 1;
    const cuota = (monto * tem) / (1 - Math.pow(1 + tem, -plazo));
    const total = cuota * plazo;
    const intereses = total - monto;
    const cargaTotal = cuota + obligaciones;
    const rds = (cargaTotal / ingresos) * 100;

    let semaforo = 'Verde';
    let instancia = 'Asesor';
    if (rds > 45) { semaforo = 'Rojo'; instancia = 'Rechazo automático'; }
    else if (rds > 30) { semaforo = 'Ámbar'; instancia = 'Riesgos / Comité'; }
    if (semaforo !== 'Rojo') {
      if (monto > 50000) instancia = 'Comité de Gerencia';
      else if (monto > 15000) instancia = 'Jefe Regional';
    }

    setSimulacion({ cuota, total, intereses, rds, semaforo, instancia });
  };

  const enviar = async () => {
    if (!simulacion) return;
    setEnviando(true);
    setError('');
    try {
      const body = {
        monto_solicitado: parseFloat(form.monto),
        plazo_meses: parseInt(form.plazo),
        ingreso_neto_mensual: parseFloat(form.ingresos),
        obligaciones_financieras: parseFloat(form.obligaciones) || 0,
        cuenta_id: user?.id || 1,
      };
      const res = await fetch('http://127.0.0.1:8000/api/creditos/solicitar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Error al registrar la solicitud.');
      setResultado(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const resetear = () => {
    setForm({ monto: '', plazo: '12', ingresos: '', obligaciones: '0' });
    setSimulacion(null);
    setResultado(null);
    setError('');
  };

  // ── PANTALLA DE ÉXITO ───────────────────────────────────────────
  if (resultado) {
    const col = COLORES[resultado.semaforo] || COLORES['Verde'];
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,59,115,0.10)', maxWidth: '480px', width: '100%', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>✅</div>
          <h2 style={{ color: '#003B73', fontSize: '22px', fontWeight: '800', margin: '0 0 6px' }}>Solicitud Registrada</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 28px' }}>Tu expediente fue enviado al Core Bancario</p>

          <div style={{ background: col.bg, border: `1.5px solid ${col.border}`, borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', textAlign: 'left' }}>
              {[
                ['Decisión inicial', resultado.decision_inicial],
                ['Semáforo RDS', `${ICONO_SEMAFORO[resultado.semaforo] || ''} ${resultado.semaforo}`],
                ['RDS calculado', resultado.rds_calculado],
                ['Cuota estimada', resultado.cuota_estimada],
                ['Instancia evaluadora', resultado.instancia_aprobacion],
              ].map(([label, val]) => (
                <div key={label}>
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: col.text, margin: 0 }}>{val}</p>
                </div>
              ))}
            </div>
          </div>

          <button onClick={resetear} style={{ background: '#003B73', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', width: '100%' }}>
            Nueva Simulación
          </button>
        </div>
      </div>
    );
  }

  // ── FORMULARIO ──────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '32px 16px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        {/* Cabecera */}
        <div style={{ background: 'linear-gradient(135deg, #003B73 0%, #005B96 100%)', borderRadius: '18px', padding: '28px 32px', marginBottom: '24px', color: '#fff' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#90cdf4', margin: '0 0 6px' }}>Homebanking — Caja del Santa</p>
          <h1 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 4px' }}>Simulador de Crédito</h1>
          <p style={{ fontSize: '13px', color: '#bfdbfe', margin: 0 }}>Calcula tu cuota, evalúa tu capacidad y envía tu solicitud en un solo paso.</p>
        </div>

        {/* Formulario */}
        <div style={{ background: '#fff', borderRadius: '18px', boxShadow: '0 2px 16px rgba(0,59,115,0.07)', padding: '32px' }}>
          <form onSubmit={calcular}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>

              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Monto a solicitar (S/)</label>
                <input name="monto" type="number" value={form.monto} onChange={handleChange}
                  placeholder="Ej. 5000" min="500" required style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Plazo</label>
                <select name="plazo" value={form.plazo} onChange={handleChange} style={inputStyle}>
                  {[6,12,18,24,36,48,60].map(m => <option key={m} value={m}>{m} meses</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Ingresos mensuales (S/)</label>
                <input name="ingresos" type="number" value={form.ingresos} onChange={handleChange}
                  placeholder="Ej. 3000" min="1" required style={inputStyle} />
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Otras obligaciones financieras (S/) <span style={{ color: '#9ca3af', fontWeight: '400' }}>— deudas vigentes</span></label>
                <input name="obligaciones" type="number" value={form.obligaciones} onChange={handleChange}
                  placeholder="0" min="0" style={inputStyle} />
              </div>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px 16px', color: '#b91c1c', fontSize: '13px', marginBottom: '16px' }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" style={{ ...btnBase, background: '#003B73', width: '100%' }}>
              Calcular viabilidad y cuotas
            </button>
          </form>

          {/* ── RESULTADO DE SIMULACIÓN ── */}
          {simulacion && (() => {
            const col = COLORES[simulacion.semaforo];
            return (
              <div style={{ marginTop: '28px', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>Resultado de la simulación</p>

                {/* Cuota grande */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px' }}>Cuota mensual estimada</p>
                  <p style={{ fontSize: '42px', fontWeight: '900', color: '#003B73', margin: 0, lineHeight: 1 }}>
                    S/ {simulacion.cuota.toFixed(2)}
                  </p>
                  <p style={{ fontSize: '12px', color: '#9ca3af', margin: '6px 0 0' }}>
                    Total a pagar S/ {simulacion.total.toFixed(2)} · Intereses S/ {simulacion.intereses.toFixed(2)}
                  </p>
                </div>

                {/* Semáforo RDS */}
                <div style={{ background: col.bg, border: `1.5px solid ${col.border}`, borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: col.text, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px' }}>Ratio RDS</p>
                      <p style={{ fontSize: '24px', fontWeight: '900', color: col.text, margin: 0 }}>{simulacion.rds.toFixed(1)}%</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ background: col.badge, color: col.text, fontWeight: '700', fontSize: '13px', padding: '4px 12px', borderRadius: '20px' }}>
                        {ICONO_SEMAFORO[simulacion.semaforo]} {simulacion.semaforo}
                      </span>
                      <p style={{ fontSize: '11px', color: col.text, margin: '6px 0 0', fontWeight: '600' }}>Instancia: {simulacion.instancia}</p>
                    </div>
                  </div>
                  {simulacion.semaforo === 'Rojo' && (
                    <p style={{ fontSize: '12px', color: col.text, margin: '12px 0 0', background: col.badge, borderRadius: '8px', padding: '8px 12px' }}>
                      Tu relación cuota-ingreso supera el 45% permitido. La solicitud será rechazada automáticamente por el Core.
                    </p>
                  )}
                </div>

                <button
                  onClick={enviar}
                  disabled={enviando || simulacion.semaforo === 'Rojo'}
                  style={{
                    ...btnBase,
                    width: '100%',
                    background: simulacion.semaforo === 'Rojo' ? '#d1d5db' : '#16a34a',
                    cursor: simulacion.semaforo === 'Rojo' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {enviando ? 'Enviando al Core Bancario...' : 'Confirmar y enviar solicitud'}
                </button>
              </div>
            );
          })()}
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginTop: '16px' }}>
          TEA 35% · Fórmula francesa · Evaluación normativa RDS
        </p>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151',
  marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em',
};

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: '10px',
  border: '1.5px solid #e5e7eb', fontSize: '15px', color: '#111827',
  boxSizing: 'border-box', outline: 'none', background: '#f9fafb',
  fontFamily: 'inherit',
};

const btnBase = {
  border: 'none', borderRadius: '10px', padding: '14px 24px',
  fontSize: '14px', fontWeight: '700', color: '#fff', cursor: 'pointer',
  letterSpacing: '0.02em', transition: 'opacity 0.15s',
};
