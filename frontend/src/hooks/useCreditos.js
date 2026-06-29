import { useState, useEffect, useCallback } from 'react'
import { getCuentasCredito, getCuotas } from '../services/cuentasService.js'
import { extractError } from '../utils/format.js'
import { useHBAuth } from '../context/HBAuthContext.jsx'

// Hook principal de Créditos (Listado + Envío de nueva solicitud)
export function useCreditos() {
  const [creditos, setCreditos] = useState([])
  const [loading, setLoading] = useState(true)       // Para la carga del listado
  const [cargando, setCargando] = useState(false)   // Para el envío del formulario (¡Requerido por SolicitarCreditoPage!)
  const [error, setError] = useState(null)
  const { token, user } = useHBAuth();

  // 1. Cargar el historial de créditos existentes
  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCreditos(await getCuentasCredito())
    } catch (err) {
      setError(extractError(err, 'No se pudieron cargar los créditos.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  // 2. FUNCIÓN NUEVA: Enviar solicitud con motor de scoring integrado (Criterio 2)
  const enviarSolicitud = async (datosSolicitud) => {
    setCargando(true)
    setError(null)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/creditos/solicitar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          cliente_id: user?.id || datosSolicitud.cliente_id || 1, // ID por defecto de simulación
          tipo_credito: datosSolicitud.tipo_credito || 'Consumo',
          monto_solicitado: parseFloat(datosSolicitud.monto_solicitado),
          plazo_meses: parseInt(datosSolicitud.plazo_meses),
          ingresos_mensuales: parseFloat(datosSolicitud.ingresos_mensuales) // Variable crítica para evaluación RDS
        }),
      })

      const resultado = await response.json()

      if (!response.ok) {
        // Captura errores de elegibilidad controlados del Core (Ej: ya tiene solicitud pendiente)
        throw new Error(resultado.detail || 'Error al procesar la evaluación en el Core.')
      }

      // Si el motor normativo del Backend arroja Semáforo Rojo (RDS > 45%)
      if (resultado.decision === 'Rechazado Automático') {
        alert(`❌ Evaluación Denegada Automáticamente:\n` +
              `• Semáforo de Riesgo: ${resultado.semaforo}\n` +
              `• Ratio RDS Calculado: ${resultado.rds}\n\n` +
              `Motivo: Tu relación de endeudamiento supera los límites normativos de la Caja.`);
        return false
      }

      // Si pasa los filtros con Semáforo Verde o Ámbar
      alert(`✅ Expediente Registrado Exitosamente en Core:\n` +
            `• Semáforo: ${resultado.semaforo}\n` +
            `• Ratio RDS: ${resultado.rds}\n` +
            `• Cuota Mensual: ${resultado.cuota}\n` +
            `• Instancia Evaluadora: ${resultado.instancia_evaluadora}`);
      
      // Forzamos la recarga del listado para reflejar el cambio si es necesario
      cargar()
      return true

    } catch (err) {
      console.error('Error en enviarSolicitud:', err.message)
      alert(`⚠️ Fallo en la Operación: ${err.message}`)
      return false
    } finally {
      setCargando(false)
    }
  }

  return { 
    creditos, 
    loading, 
    cargando, // Se exporta para deshabilitar botones en el formulario durante la petición
    error, 
    recargar: cargar, 
    enviarSolicitud // Se exporta para el componente visual de la solicitud
  }
}

// Cronograma de cuotas de un crédito (Mantenido sin cambios)
export function useCuotas(codcuentacredito) {
  const [cuotas, setCuotas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    if (!codcuentacredito) return
    setLoading(true)
    setError(null)
    try {
      setCuotas(await getCuotas(codcuentacredito))
    } catch (err) {
      setError(extractError(err, 'No se pudo cargar el cronograma de cuotas.'))
    } finally {
      setLoading(false)
    }
  }, [codcuentacredito])

  useEffect(() => {
    cargar()
  }, [cargar])

  return { cuotas, loading, error, recargar: cargar }
}

// Exportación por defecto obligatoria
export default useCreditos