/**
 * Logo de marca de Caja del Santa.
 * Isotipo: Estilo financiero y sólido usando círculos concéntricos y flechas de crecimiento.
 * * @param {Object} props
 * @param {number}  [props.size=44]          Tamaño del isotipo en px.
 * @param {boolean} [props.wordmark=true]    Mostrar el texto "Caja del Santa".
 * @param {'dark'|'light'} [props.variant='dark'] Color del texto.
 * @param {string}  [props.subtitle='BANCA DIGITAL'] Texto secundario bajo el nombre.
 */

export default function Logo({
  size = 44,
  wordmark = true,
  variant = 'dark',
  subtitle = 'BANCA DIGITAL',
}) {
  // Colores corporativos de la Caja del Santa (Verde institucional y Dorado/Oro)
  const primaryGreen = '#00875A'
  const accentGold = '#D4AF37'
  
  const textColor = variant === 'light' ? '#ffffff' : '#005236' // Verde oscuro para modo claro
  const subColor = variant === 'light' ? 'rgba(255,255,255,.85)' : '#6b7280'
  const nameSize = Math.round(size * 0.48)
  const subSize = Math.max(9, Math.round(size * 0.22))

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, userSelect: 'none' }}>
      {/* Isotipo geométrico moderno y corporativo */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Caja del Santa"
        role="img"
      >
        {/* Círculo exterior verde */}
        <circle cx="24" cy="24" r="20" fill="none" stroke={primaryGreen} strokeWidth="4" />
        
        {/* Arco dorado de crecimiento/seguridad */}
        <path 
          d="M 10 24 A 14 14 0 0 1 38 24" 
          fill="none" 
          stroke={accentGold} 
          strokeWidth="3.5" 
          strokeLinecap="round"
        />

        {/* Rombo central que simboliza solidez y tesoro */}
        <path 
          d="M 24 14 L 32 24 L 24 34 L 16 24 Z" 
          fill={primaryGreen} 
        />
        
        {/* Núcleo brillante */}
        <circle cx="24" cy="24" r="3" fill="#ffffff" />
      </svg>

      {/* Textos de la Marca */}
      {wordmark && (
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: nameSize,
              color: textColor,
              letterSpacing: '-0.3px',
              fontFamily: 'system-ui, sans-serif'
            }}
          >
            Caja del Santa
          </span>
          {subtitle && (
            <span
              style={{
                fontSize: subSize,
                fontWeight: 700,
                color: subColor,
                letterSpacing: '1.5px',
                fontFamily: 'system-ui, sans-serif',
                marginTop: '2px'
              }}
            >
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  )
}