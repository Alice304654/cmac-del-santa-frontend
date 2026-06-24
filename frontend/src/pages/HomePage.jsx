import React from 'react';

export default function HomePage() {
  // Simulación de los productos reales que comercializa la Caja del Santa
  const cuentasAhorro = [
    { id: 1, tipo: "Ahorro Corriente", numero: "315-02-******41", saldo: 2450.80, moneda: "S/" },
    { id: 2, tipo: "Depósito CTS", numero: "315-09-******12", saldo: 15800.00, moneda: "S/" },
    { id: 3, tipo: "Plazo Fijo (Soles)", numero: "315-05-******89", saldo: 50000.00, moneda: "S/" }
  ];

  const creditosActivos = [
    { id: 1, tipo: "Credi Negocio", codigo: "CR-9042", monto_total: 20000, saldo_pendiente: 12500, moneda: "S/" }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      {/* Header de Bienvenida con colores institucionales */}
      <div className="bg-gradient-to-r from-[#003B73] to-[#005B96] text-white p-6 rounded-2xl shadow-md mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">¡Bienvenido a tu Caja del Santa Digital!</h2>
          <p className="text-blue-100 text-sm mt-1">Impulsando tus proyectos desde 1986.</p>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase bg-[#00A8E8] px-3 py-1 rounded-full font-bold">Cliente Verificado</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MÓDULO DE AHORROS */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-[#003B73] border-b pb-2">Tus Cuentas de Ahorro</h3>
          {cuentasAhorro.map(cuenta => (
            <div key={cuenta.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow">
              <div>
                <p className="font-bold text-gray-800">{cuenta.tipo}</p>
                <p className="text-xs text-gray-400 font-mono">{cuenta.numero}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Saldo Disponible</p>
                <p className="text-xl font-black text-gray-950">{cuenta.moneda} {cuenta.saldo.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* MÓDULO DE CRÉDITOS Y ACCIONES RÁPIDAS */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-[#003B73] border-b pb-2">Mis Préstamos Activos</h3>
            {creditosActivos.map(cred => (
              <div key={cred.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-[#00A8E8] mt-3">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-gray-700">{cred.tipo}</span>
                  <span className="text-xs text-gray-400 font-mono">{cred.codigo}</span>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-gray-400">Saldo por pagar</p>
                  <p className="text-lg font-bold text-red-600">{cred.moneda} {cred.saldo_pendiente.toFixed(2)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Monto aprobado original: {cred.moneda} {cred.monto_total}</p>
                </div>
              </div>
            ))}
          </div>

          {/* MENÚ DE OPERACIONES COMPATIBLE CON TU RÚBRICA */}
          <div className="bg-white p-4 rounded-xl shadow-sm space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Operaciones Rápidas</h4>
            <a href="/transferencias" className="block w-full text-center bg-gray-100 hover:bg-[#003B73] hover:text-white p-2.5 rounded-lg text-sm font-semibold transition-colors text-gray-700">
              Transferencia entre Cuentas
            </a>
            <a href="/pago-servicios" className="block w-full text-center bg-gray-100 hover:bg-[#003B73] hover:text-white p-2.5 rounded-lg text-sm font-semibold transition-colors text-gray-700">
              Pago de Servicios
            </a>
            <a href="/solicitar-credito" className="block w-full text-center bg-[#00A8E8] text-white p-2.5 rounded-lg text-sm font-bold hover:bg-[#0089be] transition-colors">
              Solicitar Crédito Online
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}