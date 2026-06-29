"""Schemas pydantic para operaciones (pago de cuota, transferencia)."""
from decimal import Decimal
from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class BandaMora(str, Enum):
    PREVENTIVA = "Preventiva"
    TEMPRANA = "Temprana"
    TARDIA = "Tardía"
    JUDICIAL = "Judicial"
    CASTIGO = "Castigo"

class GestionCobranzaCreate(BaseModel):
    credito_id: int
    compromiso_pago: bool
    fecha_compromiso: Optional[datetime] = None
    comentario: str = Field(..., min_length=5)

class TransicionMoraRequest(BaseModel):
    credito_id: int
    nuevo_estado: str          # 'judicial' o 'castigo' (Validado en controlador por días >=121 y >180) 

class KPIInfo(BaseModel):
    total_cartera_mora: str
    clientes_en_riesgo: int

class BandasMoraResponse(BaseModel):
    kpis: KPIInfo
    bandas: Dict[BandaMora, List[Dict[str, Any]]]  # Clasificación dinámica por Enum BandaMora
    
class PagoCuotaRequest(BaseModel):
    codcuentacredito: str
    monto: Decimal | None = Field(default=None, description="Si se omite, paga la cuota completa")
    cuenta_origen: str | None = Field(
        default=None,
        description="Cuenta de ahorro propia desde la que se debita el pago. "
        "Si se omite, solo se registra el pago del crédito (sin debitar ahorro).",
    )


class PagoCuotaResponse(BaseModel):
    mensaje: str
    codcuentacredito: str
    nrocuota: int
    monto_pagado: Decimal
    pkoperacion: int
    cuenta_origen: str | None = None
    pkoperacion_debito_ahorro: int | None = None
    codkardex: str


# --- Pago de servicios ---
class ServicioOut(BaseModel):
    codservicio: str
    nombre: str


class PagoServicioRequest(BaseModel):
    cuenta_origen: str
    codservicio: str
    codsuministro: str = Field(..., description="N° de suministro / recibo / contrato")
    monto: Decimal = Field(..., gt=0)


class PagoServicioResponse(BaseModel):
    mensaje: str
    servicio: str
    codsuministro: str
    cuenta_origen: str
    monto: Decimal
    pkoperacion: int
    codkardex: str


class TransferenciaRequest(BaseModel):
    cuenta_origen: str
    cuenta_destino: str
    monto: Decimal = Field(..., gt=0)


class TransferenciaResponse(BaseModel):
    mensaje: str
    cuenta_origen: str
    cuenta_destino: str
    monto: Decimal
    pkoperacion_debito: int
    pkoperacion_credito: int
