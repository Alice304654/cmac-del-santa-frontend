from pydantic import BaseModel, Field, field_validator
from enum import Enum
from typing import Optional, List
from datetime import datetime

class EstadoCredito(str, Enum):
    ENVIADO = "enviado"
    EN_EVALUACION = "en_evaluacion"
    APROBADO = "aprobado"
    RECHAZADO = "rechazado"
    DESEMBOLSADO = "desembolsado"
    JUDICIAL = "judicial"
    CASTIGO = "castigo"

class BandaMora(str, Enum):
    PREVENTIVA = "Preventiva"
    TEMPRANA = "Temprana"
    TARDIA = "Tardía"
    JUDICIAL = "Judicial"
    CASTIGO = "Castigo"

class SolicitudCreditoCreate(BaseModel):
    cuenta_id: int
    monto_solicitado: float = Field(..., gt=0)
    plazo_meses: int = Field(..., ge=1, le=60)
    ingreso_neto_mensual: float = Field(..., gt=0)
    obligaciones_financieras: float = Field(..., ge=0) # Otras deudas

class EvaluacionCreditoUpdate(BaseModel):
    nuevo_estado: EstadoCredito
    observaciones: Optional[str] = None

class GestionCobranzaCreate(BaseModel):
    credito_id: int
    compromiso_pago: bool
    fecha_compromiso: Optional[datetime] = None
    comentario: str = Field(..., min_length=5)