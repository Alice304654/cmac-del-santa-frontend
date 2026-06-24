import React from 'react';

export default function CronogramaPagos({ monto, plazoMeses }) {
  // Simulación de Tasa de Interés de la Caja del Santa (ej. 2.5% mensual)
  const tasaMensual = 0.025;
  const cuota = (monto * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -plazoMeses));
  
  const generarCronograma = () => {
    let saldo = monto;
    const filas = [];
    for (let i = 1; i <= plazoMeses; i++) {
      const interes = saldo * tasaMensual;
      const capital = cuota - interes;
      saldo -= capital;
      filas.push({
        mes: i,
        cuota: cuota.toFixed(2),
        capital: capital.toFixed(2),
        interes: interes.toFixed(2),
        saldo: Math.max(0, saldo).toFixed(2)
      });
    }
    return filas;
  };

  const cronograma = generarCronograma();

  return (
    <div className="mt-4 bg-white p-4 rounded-xl border">
      <h4 className="font-bold text-[#003B73] mb-3 text-sm uppercase tracking-wide">
        Cronograma de Pagos Emitido por la CMAC del Santa
      </h4>
      <div className="overflow-y-auto max-h-60">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-600 font-bold uppercase">
              <th className="p-2">Mes</th>
              <th className="p-2">Cuota</th>
              <th className="p-2">Capital</th>
              <th className="p-2">Interés</th>
              <th className="p-2">Saldo Pendiente</th>
            </tr>
          </thead>
          <tbody>
            {cronograma.map((f) => (
              <tr key={f.mes} className="border-b hover:bg-slate-50">
                <td className="p-2 font-bold text-slate-700">{f.mes}</td>
                <td className="p-2 font-mono">S/ {f.cuota}</td>
                <td className="p-2 text-green-700 font-mono">S/ {f.capital}</td>
                <td className="p-2 text-red-600 font-mono">S/ {f.interes}</td>
                <td className="p-2 font-mono">S/ {f.saldo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}