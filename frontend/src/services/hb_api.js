import axios from 'axios'

// 🌟 CORRECCIÓN 1: Unificamos con la clave exacta que usa tu HBAuthContext
export const TOKEN_KEY = 'token_cliente' 
export const USER_KEY = 'hb_user'

// 🌟 CORRECCIÓN 2: Aseguramos el prefijo /api para limpiar todos los 404 de tu backend
const rawBaseURL = import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:8000'
const baseURL = rawBaseURL.endsWith('/api') ? rawBaseURL : `${rawBaseURL}/api`

// Instancia central de axios para todo el Homebanking.
const hbApi = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

// --- Request: inyecta el Bearer token en cada petición ---
hbApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --- Response: ante 401 limpia la sesión y redirige a /login ---
hbApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      const enLogin = window.location.pathname.startsWith('/login')
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      
      if (!enLogin) {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

export default hbApi

// ==============================================================================
// 🏦 CAPA DE SERVICIOS ADAPTADA (Conecta tus componentes React con FastAPI)
// ==============================================================================

// 💸 Criterio 1: Portal de Cuentas y Movimientos (Homebanking)
export const cuentasService = {
  obtenerMisCuentas: () => hbApi.get('/cuentas/mis-cuentas'),
  obtenerMovimientos: (cuentaId) => hbApi.get(`/cuentas/movimientos/${cuentaId}`),
  administrarEstadoCuenta: (payload) => hbApi.patch('/cuentas/core/cambiar-estado', payload),
};

// 📝 Criterio 2: Motor de Créditos (Scoring de Riesgo y Canal de Aprobación)
export const creditosService = {
  consultarHistorial: () => hbApi.get('/creditos/historial'),
  solicitarPrestamo: (datosSolicitud) => hbApi.post('/creditos/solicitar', datosSolicitud),
  evaluarDictamen: (payloadEvaluacion) => hbApi.post('/creditos/evaluar', payloadEvaluacion),
  ejecutarDesembolso: (creditoId, cuentaDestinoId) => 
    hbApi.post(`/creditos/desembolsar/${creditoId}`, { cuenta_destino_id: cuentaDestinoId }),
};

// 🚦 Criterio 4: Módulo de Recuperaciones y Gestión de Mora
export const recuperacionesService = {
  obtenerCarteraMora: () => hbApi.get('/recuperaciones/mora'),
  registrarAccionCobranza: (payloadGestion) => hbApi.post('/recuperaciones/gestionar', payloadGestion),
  procesarCambioBandaCritico: (payloadTransicion) => hbApi.post('/recuperaciones/cambiar-estado', payloadTransicion),
};