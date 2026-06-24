from app.controllers import ctrl_creditos
from fastapi import APIRouter, Depends, HTTPException

# 💡 ESTA ES LA LÍNEA QUE FALTA DE DECLARAR:
router = APIRouter(prefix="/creditos", tags=["Créditos"])

# Así debe verse la declaración real de la función (sin los tres puntos sueltos)
@router.patch("/core/evaluar/{credito_id}")
async def evaluar_credito(credito_id: int, estado: str):
    return ctrl_creditos.evaluar_credito(
        credito_id,
        estado
    )