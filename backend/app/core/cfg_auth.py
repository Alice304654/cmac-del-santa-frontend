"""Dependencia get_cliente: valida el Bearer token y EXIGE tipo=='cliente'.

Un token emitido por el core bancario para personal (tipo != 'cliente')
NO debe servir en este portal.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.cfg_security import decodificar_token

bearer_scheme = HTTPBearer(auto_error=True)


def get_cliente(creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    payload = decodificar_token(creds.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if payload.get("tipo") != "cliente":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Este token no corresponde a un cliente del portal",
        )
    if payload.get("pkcliente") is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token sin pkcliente")
    return payload


# ==============================================================================
# 🏢 NUEVA: Para gestionar personal del banco (Asesores, Riesgos, Comité)
# ==============================================================================
def verificar_token_y_rol(creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    """
    Valida el token Bearer para el personal interno del Core Bancario (Asesores, Jefes, Riesgos).
    Mapea de forma segura los nombres de tus campos nativos (pkcliente/id, tipo/rol).
    """
    payload = decodificar_token(creds.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Normalizamos el diccionario para que las capas de rutas lean de forma unificada
    # Si viene un cliente usa 'pkcliente' y 'tipo', si viene personal usa campos genéricos
    usuario_normalizado = {
        "id": payload.get("pkcliente") or payload.get("id"),
        "username": payload.get("username") or payload.get("sub", "UsuarioCore"),
        "rol": payload.get("tipo") or payload.get("rol")
    }
    
    return usuario_normalizado