"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../../../components/AuthProvider";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { API_ROUTES, API_BASE_URL } from "../../../../../utils/apiRoutes";

interface Factura {
  id: string;
  tipoFactura: string;
  concepto: string;
  fechaFactura: string;
  fechaRegistro: string;
  xmlPath: string;
  pdfPath: string;
  status: string;
  statusMotivo: string;
  userID: string;
  userName?: string;
  empresaID: string;
  ejercicioID: string;
  fileName?: string;
  apelado?: boolean;
  justificacionApelacion?: string;
  apelacionDenegada?: boolean;
  contenidoXml: {
    rfcEmisor: string;
    nombreEmisor: string;
    rfcReceptor: string;
    nombreReceptor: string;
    usoCFDI: string;
    subtotal: number;
    total: number;
    moneda: string;
    metodoPago: string;
    formatoPago: string;
    fechaTimbrado: string;
  };
}

export default function RevisarFacturaPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [factura, setFactura] = useState<Factura | null>(null);
  const [ejercicios, setEjercicios] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedEjercicio, setSelectedEjercicio] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Appeal/rejection modal state
  const [showMotivoModal, setShowMotivoModal] = useState(false);
  const [motivoText, setMotivoText] = useState("");
  const [modalActionType, setModalActionType] = useState<"RECHAZAR" | "DENEGAR_APELACION">("RECHAZAR");

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!user.roles || !user.roles.includes("ADMIN")) {
        router.push("/xmlends/dashboard");
      }
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    if (!token || !id) return;
    try {
      const resFactura = await fetch(`${API_BASE_URL}/api/xmlends/factura/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resEjercicios = await fetch(`${API_BASE_URL}/api/xmlends/ejercicios`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (resFactura.ok) {
        const facData = await resFactura.json();
        setFactura(facData);
        setSelectedEjercicio(facData.ejercicioID);
      } else {
        setErrorMessage("No se encontró la factura especificada.");
      }

      if (resEjercicios.ok) {
        setEjercicios(await resEjercicios.json());
      }
    } catch (e) {
      setErrorMessage("Error de conexión al obtener datos.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (token && user?.roles && user.roles.includes("ADMIN")) {
      fetchData();
    }
  }, [token, user]);

  const handleUpdate = async (newStatus?: string, motivoValue?: string, apelacionDenegadaValue?: boolean) => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsUpdating(true);

    const payload: any = { ejercicioID: selectedEjercicio };
    if (newStatus) {
      payload.status = newStatus;
    }
    if (motivoValue !== undefined) {
      payload.motivo = motivoValue;
    }
    if (apelacionDenegadaValue !== undefined) {
      payload.apelacionDenegada = apelacionDenegadaValue;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/xmlends/factura/${id}/revisar`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updatedFac = await res.json();
        setFactura(updatedFac);
        setSuccessMessage("Factura actualizada correctamente.");
      } else {
        setErrorMessage("Error al actualizar la factura.");
      }
    } catch (e) {
      setErrorMessage("Error de conexión.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-lg">{errorMessage || "Factura no encontrada."}</div>
        <Link href="/xmlends/admin" className="text-indigo-600 mt-4 inline-block hover:underline">Volver a Administración</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4">
        <div>
          <Link href="/xmlends/admin" className="text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-2 inline-flex items-center">
            ← Volver al Panel
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Revisión de Factura</h1>
          <p className="text-slate-500 text-sm">UID: {factura.id}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          {/* Badge Estatus General */}
          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
            factura.status === "VALIDO" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
            factura.status === "LISTO_PARA_VALIDAR" ? "bg-purple-50 text-purple-700 border-purple-200" :
            factura.status === "REVISION" ? "bg-amber-50 text-amber-700 border-amber-200" :
            "bg-rose-50 text-rose-700 border-rose-200"
          }`}>
            {factura.status === "VALIDO" ? "Válido" : factura.status === "LISTO_PARA_VALIDAR" ? "P. Validar" : factura.status === "REVISION" ? "Revisión" : "Rechazado"}
          </span>

          {/* Badge SAT Dinámico */}
          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
            (factura.statusMotivo?.toLowerCase().includes("cancelado") || factura.statusMotivo?.toLowerCase().includes("no vigente"))
              ? "bg-rose-50 text-rose-700 border-rose-200" 
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}>
            SAT: {(factura.statusMotivo?.toLowerCase().includes("cancelado") || factura.statusMotivo?.toLowerCase().includes("no vigente")) ? "Cancelado" : "Vigente"}
          </span>

          {/* Badge Concepto Dinámico */}
          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
            factura.status === "VALIDO" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
            (factura.status === "REVISION" || factura.status === "LISTO_PARA_VALIDAR") ? "bg-amber-50 text-amber-700 border-amber-200" :
            "bg-rose-50 text-rose-700 border-rose-200"
          }`}>
            Concepto: {factura.status === "VALIDO" ? "Permitido" : (factura.status === "REVISION" || factura.status === "LISTO_PARA_VALIDAR") ? "Bajo Revisión" : "Rechazado"}
          </span>
        </div>
      </div>

      {errorMessage && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-sm">{errorMessage}</div>}
      {successMessage && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">{successMessage}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Apelación activa warning card */}
          {factura.apelado && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-100 text-indigo-750 text-xs font-black">!</span>
                <h3 className="text-sm font-bold text-indigo-800">Apelación Activa de Usuario</h3>
              </div>
              <p className="text-xs text-indigo-750 font-medium">
                El usuario ha solicitado una segunda revisión aportando la siguiente justificación:
              </p>
              <div className="bg-white/80 p-3.5 rounded-lg border border-indigo-100 text-xs text-slate-700 italic font-medium leading-relaxed">
                "{factura.justificacionApelacion || "Sin justificación detallada."}"
              </div>
              <div className="pt-1 flex gap-2">
                <button
                  disabled={isUpdating}
                  onClick={() => {
                    setModalActionType("DENEGAR_APELACION");
                    setMotivoText("");
                    setShowMotivoModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Denegar Apelación
                </button>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Información Contable y Fiscal (XML)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Emisor</label>
                <div className="text-sm font-semibold text-slate-800">{factura.contenidoXml?.nombreEmisor || "N/A"}</div>
                <div className="text-xs text-slate-500 font-mono">RFC: {factura.contenidoXml?.rfcEmisor || "N/A"}</div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Receptor</label>
                <div className="text-sm font-semibold text-slate-800">{factura.contenidoXml?.nombreReceptor || "N/A"}</div>
                <div className="text-xs text-slate-500 font-mono">RFC: {factura.contenidoXml?.rfcReceptor || "N/A"}</div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Uso CFDI</label>
                <div className="text-sm text-slate-700">{factura.contenidoXml?.usoCFDI || "N/A"}</div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Forma y Método de Pago</label>
                <div className="text-sm text-slate-700">{factura.contenidoXml?.formatoPago || "N/A"} - {factura.contenidoXml?.metodoPago || "N/A"}</div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Fecha Timbrado</label>
                <div className="text-sm text-slate-700">{factura.contenidoXml?.fechaTimbrado || "N/A"}</div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Concepto / Descripción</label>
                <div className="text-sm text-slate-700 line-clamp-2" title={factura.concepto}>{factura.concepto || "N/A"}</div>
              </div>
            </div>
            
            <div className="mt-6 border-t border-slate-100 pt-4 grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <label className="text-[10px] uppercase font-bold text-slate-400">Subtotal</label>
                <div className="text-lg font-mono font-bold text-slate-800">${factura.contenidoXml?.subtotal?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || "0.00"}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <label className="text-[10px] uppercase font-bold text-slate-400">Moneda</label>
                <div className="text-lg font-mono font-bold text-slate-800">{factura.contenidoXml?.moneda || "MXN"}</div>
              </div>
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                <label className="text-[10px] uppercase font-bold text-indigo-400">Total</label>
                <div className="text-xl font-mono font-black text-indigo-700">${factura.contenidoXml?.total?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || "0.00"}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Detalles de la Carga</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Usuario Cargador</label>
                <div className="text-sm font-semibold text-slate-800">{factura.userName || "N/A"}</div>
                <div className="text-xs text-slate-500 font-mono">UID: {factura.userID.substring(0, 15)}...</div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Archivo Original</label>
                <div className="text-sm font-semibold text-slate-800">{factura.fileName || "N/A"}</div>
                <div className="text-xs text-slate-500">Subida el: {factura.fechaRegistro ? factura.fechaRegistro.split("T")[0] : "N/A"}</div>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] uppercase font-bold text-slate-400">Motivo de Estado SAT</label>
                <div className="text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">{factura.statusMotivo || "Sin observaciones"}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Acciones Administrativas</h2>
            
            {factura.status === "VALIDO" ? (
              <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-xl space-y-2 text-center">
                <span className="block text-[11px] font-bold text-emerald-600 uppercase tracking-wider">✓ Aprobado Permanente</span>
                <p className="text-xs text-emerald-700 font-semibold leading-relaxed">
                  Esta factura ha sido validada y aprobada permanentemente. Las acciones de dictamen e historiales se encuentran bloqueadas.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Asignar Ejercicio</label>
                  <select
                    value={selectedEjercicio}
                    onChange={(e) => setSelectedEjercicio(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 text-sm focus:outline-none"
                  >
                    <option value="">(Sin asignar)</option>
                    {ejercicios.map((ej) => (
                      <option key={ej.id} value={ej.id}>
                        {ej.fechaInicio && ej.fechaFin ? `De ${ej.fechaInicio} a ${ej.fechaFin}` : `UID: ${ej.id.substring(0, 8)}`}
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={isUpdating}
                    onClick={() => handleUpdate()}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    Actualizar Ejercicio
                  </button>
                </div>

                <hr className="border-slate-100 my-4" />

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700">Dictamen Final</label>
                  <button
                    disabled={isUpdating}
                    onClick={() => handleUpdate("VALIDO")}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex justify-center items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Validar y Aprobar
                  </button>
                  
                  <button
                    disabled={isUpdating}
                    onClick={() => {
                      setModalActionType("RECHAZAR");
                      setMotivoText("");
                      setShowMotivoModal(true);
                    }}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex justify-center items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Rechazar (Inválida)
                  </button>

                  {factura.apelado && (
                    <button
                      disabled={isUpdating}
                      onClick={() => {
                        setModalActionType("DENEGAR_APELACION");
                        setMotivoText("");
                        setShowMotivoModal(true);
                      }}
                      className="w-full py-3 bg-rose-900 hover:bg-rose-950 text-white text-sm font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex justify-center items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                      Denegar Apelación
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal Motivo Premium */}
      {showMotivoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40 transition-opacity">
          <div className="w-full max-w-md bg-white/90 border border-white/20 shadow-2xl rounded-2xl p-6 backdrop-blur-lg transform transition-all duration-300 scale-100 flex flex-col space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {modalActionType === "RECHAZAR" ? "Motivo de Rechazo" : "Denegar Apelación"}
              </h3>
              <button onClick={() => setShowMotivoModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors text-lg font-bold">×</button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setShowMotivoModal(false);
              if (modalActionType === "RECHAZAR") {
                await handleUpdate("NO_VALIDO", motivoText);
              } else {
                await handleUpdate(undefined, motivoText, true);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Escribe el motivo del dictamen (máx. 50 caracteres):
                </label>
                <textarea
                  required
                  maxLength={50}
                  rows={3}
                  value={motivoText}
                  onChange={(e) => setMotivoText(e.target.value)}
                  placeholder={modalActionType === "RECHAZAR" ? "Ej: Factura cancelada ante el SAT / RFC receptor incorrecto" : "Ej: Apelación improcedente por falta de soporte"}
                  className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-slate-800 shadow-sm text-xs focus:border-blue-500 focus:outline-none resize-none"
                />
                <div className="text-[10px] text-right text-slate-400 font-bold mt-1">
                  {motivoText.length}/50 caracteres
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMotivoModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
                >
                  Confirmar Dictamen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
