"""Controlador de autenticación: reglas de login, emisión de JWT y registro."""

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.engine import Connection

from app.core.cfg_config import settings
from app.core.cfg_security import (
    crear_access_token,
    verificar_password,
    hash_password
)

from app.repositories import repo_auth


def login(conn: Connection, username: str, password: str) -> dict:
    usuario = repo_auth.buscar_usuario_por_username(conn, username)

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )

    if usuario["bloqueado"] == "S":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario bloqueado por intentos fallidos. Contacte a la caja."
        )

    if not verificar_password(password, usuario["password_hash"]):
        intentos = repo_auth.registrar_login_fallido(conn, usuario["pkusuario"])
        restantes = max(0, repo_auth.MAX_INTENTOS - intentos)
        if restantes == 0:
            detalle = "Credenciales inválidas. Usuario bloqueado por exceder intentos."
        else:
            detalle = f"Credenciales inválidas. Intentos restantes: {restantes}"
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detalle)

    repo_auth.registrar_login_exitoso(conn, usuario["pkusuario"])

    token = crear_access_token({
        "sub": usuario["codcliente"],
        "rol": usuario.get("rol", "CLIENTE"),
        "tipo": "cliente",
        "pkcliente": usuario["pkcliente"],
        "nombre": usuario["nomcliente"],
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in_min": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        "cliente": {
            "codcliente": usuario["codcliente"],
            "nombre": usuario["nomcliente"],
            "pkcliente": usuario["pkcliente"],
        },
    }


def registrar(conn: Connection, username: str, password: str) -> dict:
    try:
        usuario_existente = repo_auth.buscar_usuario_por_username(conn, username)

        if usuario_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El número de DNI ya está registrado en el sistema."
            )

        password_encriptada = hash_password(password)

        conn.execute(
            text("""
                INSERT INTO usuarios_homebanking
                (username, password_hash, rol, activo, bloqueado)
                VALUES
                (:username, :password_hash, 'CLIENTE', 'S', 'N')
            """),
            {"username": username, "password_hash": password_encriptada}
        )
        conn.commit()

        return {"mensaje": "¡Usuario registrado con éxito!", "dni": username}

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en el Core Financiero: {str(e)}"
        )
