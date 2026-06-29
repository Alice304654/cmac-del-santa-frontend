import hbApi from './hb_api.js'
import React, { useState, useEffect } from 'react';
import { cuentasService } from '../services/hb_api';

// ==============================================================================
// 🏦 ENTORNO DE CUENTAS DE AHORRO Y CRÉDITOS (Homebanking Nativo)
// ==============================================================================

// GET /cuentas/ahorro -> CuentaAhorroOut[]
export async function getCuentasAhorro() {
  const { data } = await hbApi.get('/cuentas/ahorro')
  return Array.isArray(data) ? data : []
}

// GET /cuentas/ahorro/{cod}/detalle -> DetalleAhorroResponse
// { codcuentaahorro, tipo, codtipo (AC|AP|PF|CT), plazo_fijo?, cts?, ahorro_programado?{...cronograma[]}, mensaje? }
export async function getDetalleAhorro(codcuentaahorro) {
  const { data } = await hbApi.get(`/cuentas/ahorro/${encodeURIComponent(codcuentaahorro)}/detalle`)
  return data
}

// GET /cuentas/ahorro/{cod}/movimientos?limit=50 -> MovimientoOut[]
export async function getMovimientos(codcuentaahorro, limit = 50) {
  const { data } = await hbApi.get(
    `/cuentas/ahorro/${encodeURIComponent(codcuentaahorro)}/movimientos`,
    { params: { limit } },
  )
  return Array.isArray(data) ? data : []
}

// GET /cuentas/credito -> CuentaCreditoOut[]
export async function getCuentasCredito() {
  const { data } = await hbApi.get('/cuentas/credito')
  return Array.isArray(data) ? data : []
}

// GET /cuentas/credito/{cod}/cuotas -> CuotaOut[]
export async function getCuotas(codcuentacredito) {
  const { data } = await hbApi.get(
    `/cuentas/credito/${encodeURIComponent(codcuentacredito)}/cuotas`,
  )
  return Array.isArray(data) ? data : []
}

// PATCH /cuentas/core/cambiar-estado -> Permite bloquear o activar cuentas desde el Core
export async function administrarEstadoCuenta(payload) {
  const { data } = await hbApi.patch('/cuentas/core/cambiar-estado', payload)
  return data
}


// ==============================================================================
// 📝 NUEVO: MOTOR DE CRÉDITOS (Scoring Financiero y Desembolsos)
// ==============================================================================

// GET /creditos/historial -> Devuelve las solicitudes de créditos del usuario
export async function consultarHistorialCreditos() {
  const { data } = await hbApi.get('/creditos/historial')
  return Array.isArray(data) ? data : []
}

// POST /creditos/solicitar -> Envía el formulario del cliente para el cálculo del RDS y Semáforo
export async function solicitarPrestamoBancario(datosSolicitud) {
  const { data } = await hbApi.post('/creditos/solicitar', datosSolicitud)
  return data
}

// POST /creditos/evaluar -> Endpoint del Analista/Asesor para dictaminar (Aprobar/Rechazar)
export async function evaluarDictamenCredito(payloadEvaluacion) {
  const { data } = await hbApi.post('/creditos/evaluar', payloadEvaluacion)
  return data
}

// POST /creditos/desembolsar/{id} -> Impacta directamente en la tabla cuentas_ahorro sumando el saldo
export async function ejecutarDesembolsoEfectivo(creditoId, cuentaDestinoId) {
  const { data } = await hbApi.post(`/creditos/desembolsar/${creditoId}`, { 
    cuenta_destino_id: cuentaDestinoId 
  })
  return data
}


// ==============================================================================
// 🚦 NUEVO: MÓDULO DE RECUPERACIONES (Gestión de Riesgo y Carteras en Mora)
// ==============================================================================

// GET /recuperaciones/mora -> Devuelve la lista de clientes agrupados por bandas de mora
export async function obtenerCarteraClientesMora() {
  const { data } = await hbApi.get('/recuperaciones/mora')
  return Array.isArray(data) ? data : []
}

// POST /recuperaciones/gestionar -> Registra compromisos de pago o llamadas de cobranza
export async function registrarAccionCobranza(payloadGestion) {
  const { data } = await hbApi.post('/recuperaciones/gestionar', payloadGestion)
  return data
}

// POST /recuperaciones/cambiar-estado -> Envía cuentas críticas a tramos pre-judiciales o judiciales
export async function procesarCambioBandaCritico(payloadTransicion) {
  const { data } = await hbApi.post('/recuperaciones/cambiar-estado', payloadTransicion)
  return data
}