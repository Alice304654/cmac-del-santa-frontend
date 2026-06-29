import { Navigate, useLocation } from 'react-router-dom'
import { useHBAuth } from '../../hooks/useHBAuth.js'

// Protege rutas: si no hay sesión, redirige a /login.
export default function PrivateRoute({ children }) {
  const { isAuthenticated } = useHBAuth()
  const location = useLocation()

  // ⚡ COMPROBACIÓN EXTRA SÍNCRONA:
  // Verificamos si ya existe el token físicamente guardado en el navegador.
  // Esto evita que el guardián expulse al usuario mientras React actualiza el estado global.
  const tieneTokenLocal = !!localStorage.getItem('token_cliente')

  // Si React dice que no está autenticado Y tampoco hay un token en el almacenamiento local...
  if (!isAuthenticated && !tieneTokenLocal) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  // Si cualquiera de los dos es verdadero, se da acceso inmediato respetando tu diseño original
  return children
}