import React, { useEffect, useState } from 'react';

export default function CoreBancarioDashboard() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [bandasMora, setBandasMora] = useState({ Preventiva: [], Temprana: [], Tardía: [], Judicial: [], Castigo: [] });
  const [creditoSeleccionado, setCreditoSeleccionado] = useState(null);
  const [comentarioCobranza, setComentarioCobranza] = useState("");

  const tokenSimulado = "token-riesgos"; // Cambiar dinámicamente según pruebas por rol (asesor, riesgos, comite)

  const cargarDatosCore = () => {
    // 1. Cargar bandeja de créditos generales
    fetch('/api/creditos/core/bandeja')
      .then(res => res.json())
      .then(data => setSolicitudes(data));

    // 2. Cargar bandas de cobranza (Criterio 4)
    fetch('/api/creditos/core/recuperaciones/bandas')
      .then(res => res.json())
      .then(data => setBandasMora(data));
  };

  useEffect(() => {
    cargarDatosCore();
  }, []);

  const evaluarSolicitud = async (id, nuevoEstado) => {
    const res = await fetch(`/api/creditos/core/evaluar/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevo_estado: nuevoEstado })
    });
    if (res.ok) {
      alert(`Acción procesada: Cambio a ${nuevoEstado}`);
      cargarDatosCore();
    } else {
      const err = await res.json();
      alert(`Error: ${err.detail}`);
    }
  };

  const procesarCobranza = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/creditos/core/recuperaciones/gestionar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credito_id: creditoSeleccionado.id,
        compromiso_pago: true,
        comentario: comentarioCobranza
      })
    });
    if (res.ok) {
      alert("Gestión de cobranza e historial registrados.");
      setComentarioCobranza("");
      setCreditoSeleccionado(null);
    }
  };

  return (
    <div className="p-8 bg-slate-100 min-h-screen text-slate-800 font-sans">
      <div className="bg-[#003B73] text-white p-6 rounded-xl shadow-md mb-8">
        <h1 className="text-2xl font-bold">CAJA DEL SANTA - Core Bancario Interno</h1>
        <p className="text-sm text-sky-200">Panel de Control de Operaciones y Gestión de Riesgos</p>
      </div>

      {/* SECCIÓN 1: BANDEJA DE EVALUACIÓN CREDITICIA */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-lg font-bold text-[#003B73] mb-4 border-b pb-2">Bandeja de Admisión de Créditos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-3 border-b">ID</th>
                <th className="p-3 border-b">Monto</th>
                <th className="p-3 border-b">RDS scoring</th>
                <th className="p-3 border-b">Semáforo</th>
                <th className="p-3 border-b">Estado Actual</th>
                <th className="p-3 border-b text-center">Acciones Autorizadas</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map(sol => (
                <tr key={sol.id} className="hover:bg-slate-50 text-sm">
                  <td className="p-3 border-b font-mono">#{sol.id}</td>
                  <td className="p-3 border-b font-bold">S/ {sol.monto}</td>
                  <td className="p-3 border-b font-medium">{sol.rds * 100}%</td>
                  <td className="p-3 border-b">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      sol.semaforo_rds === 'VERDE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>{sol.semaforo_rds}</span>
                  </td>
                  <td className="p-3 border-b uppercase font-mono text-xs">{sol.estado}</td>
                  <td className="p-3 border-b flex justify-center space-x-2">
                    {sol.estado === 'enviado' && (
                      <>
                        <button onClick={() => evaluarSolicitud(sol.id, 'aprobado')} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs">Aprobar</button>
                        <button onClick={() => evaluarSolicitud(sol.id, 'rechazado')} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs">Rechazar</button>
                      </>
                    )}
                    {sol.estado === 'aprobado' && (
                      <button onClick={() => evaluarSolicitud(sol.id, 'desembolsado')} className="bg-[#00A8E8] text-white px-3 py-1 rounded text-xs font-bold hover:bg-sky-600">Desembolsar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECCIÓN 2: CONTROL DE MORA Y GESTIÓN DE COBRANZA (CRITERIO 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-[#003B73] mb-4 border-b pb-2">Consulta de Cartera por Bandas de Mora</h2>
          <div className="space-y-4">
            {Object.keys(bandasMora).map(banda => (
              <div key={banda} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-bold text-sm uppercase text-slate-600 tracking-wide mb-2">{banda}</h3>
                {bandasMora[banda].length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Sin créditos en este tramo.</p>
                ) : (
                  <div className="space-y-2">
                    {bandasMora[banda].map(cred => (
                      <div key={cred.id} className="flex justify-between items-center text-xs bg-white p-2 rounded border shadow-sm">
                        <span>Crédito <strong>#{cred.id}</strong> - S/ {cred.monto} ({cred.dias_mora} días de retraso)</span>
                        <button onClick={() => setCreditoSeleccionado(cred)} className="text-[#00A8E8] hover:underline font-bold">Gestionar</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* COMPONENTE INTERACTIVO DE HISTORIAL Y ACCIONES DE COBRANZA */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-[#003B73] mb-4 border-b pb-2">Registro de Historial</h2>
          {creditoSeleccionado ? (
            <form onSubmit={procesarCobranza} className="space-y-4 text-sm">
              <p className="bg-sky-50 text-sky-800 p-2 rounded text-xs">Gestionando crédito: <strong>#{creditoSeleccionado.id}</strong></p>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Detalle de Gestión Telefónica/Domiciliaria</label>
                <textarea 
                  value={comentarioCobranza}
                  onChange={(e) => setComentarioCobranza(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003B73]"
                  rows="4" placeholder="Ingrese el compromiso del cliente..." required
                />
              </div>
              <button type="submit" className="w-full bg-[#003B73] text-white p-2 rounded-lg font-bold hover:bg-sky-900 transition-colors">Guardar Bitácora</button>
            </form>
          ) : (
            <p className="text-sm text-slate-400 italic text-center py-8">Seleccione un crédito de la cartera morosa para ingresar historial.</p>
          )}
        </div>
      </div>
    </div>
  );
}