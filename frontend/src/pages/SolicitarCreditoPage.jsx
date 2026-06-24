import React, { useState } from 'react';
import useCreditos from '../hooks/useCreditos'; // Hook personalizado de tu carpeta

export default function SolicitarCreditoPage() {
  const { enviarSolicitud, cargando } = useCreditos();
  const [monto, setMonto] = useState(1000);
  const [cuotas, setCuotas] = useState(12);
  const [simulacion, setSimulacion] = useState(null);

  // Simulador rápido en Frontend (Requerimiento)
  const calcularSimulacion = (e) => {
    e.preventDefault();
    const tasaMensual = 0.025; // 2.5% interés simulado
    const cuotaMensual = (monto * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -cuotas));
    setSimulacion({
      cuota: cuotaMensual.toFixed(2),
      total: (cuotaMensual * cuotas).toFixed(2)
    });
  };

  const handleSolicitar = async () => {
    const exito = await enviarSolicitud({
      monto_solicitado: parseFloat(monto),
      plazo_meses: parseInt(cuotas),
      motivo: "Préstamo de consumo personal para estudios",
      cuenta_destino_id: 1 // Id de cuenta de ahorros activa
    });
    if (exito) alert("¡Solicitud enviada al Core Bancario con éxito!");
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-blue-900">Simulador y Solicitud de Crédito</h2>
      <form onSubmit={calcularSimulacion} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Monto a solicitar ($)</label>
          <input 
            type="number" 
            value={monto} 
            onChange={(e) => setMonto(e.target.value)}
            className="w-full p-2 border rounded-md"
            min="500" required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 font-bold">Plazo (Meses)</label>
          <select value={cuotas} onChange={(e) => setCuotas(e.target.value)} className="w-full p-2 border rounded-md">
            <option value="12">12 meses</option>
            <option value="24">24 meses</option>
            <option value="36">36 meses</option>
          </select>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700">
          Calcular Cuotas
        </button>
      </form>

      {simulacion && (
        <div className="mt-6 p-4 bg-gray-50 border rounded-md text-center">
          <p className="text-gray-600">Cuota mensual estimada:</p>
          <p className="text-3xl font-extrabold text-green-600">${simulacion.cuota}</p>
          <p className="text-xs text-gray-400 mt-1">Total a pagar: ${simulacion.total}</p>
          
          <button 
            onClick={handleSolicitar} 
            disabled={cargando}
            className="mt-4 w-full bg-green-600 text-white p-2 rounded-md font-semibold hover:bg-green-700 disabled:bg-gray-400"
          >
            {cargando ? 'Procesando...' : 'Confirmar y Enviar Solicitud'}
          </button>
        </div>
      )}
    </div>
  );
}