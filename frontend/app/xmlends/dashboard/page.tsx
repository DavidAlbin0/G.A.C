"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "../../../utils/apiRoutes";

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
  empresaID: string;
  ejercicioID: string;
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

export default function XmlendsDashboardPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loadingFacturas, setLoadingFacturas] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Create Period form state
  const [showCreatePeriodModal, setShowCreatePeriodModal] = useState(false);
  const [limiteFacturas, setLimiteFacturas] = useState(10);
  const [montoLimite, setMontoLimite] = useState("5000");
  const [creatingPeriod, setCreatingPeriod] = useState(false);
  const [periodSuccess, setPeriodSuccess] = useState("");
  const [periodError, setPeriodError] = useState("");

  // Appeal state
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealingFacturaId, setAppealingFacturaId] = useState("");
  const [justificacion, setJustificacion] = useState("");
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [appealSuccess, setAppealSuccess] = useState("");
  const [appealError, setAppealError] = useState("");

  // Replace invoice state
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replacingFacturaId, setReplacingFacturaId] = useState("");
  const [newXmlFile, setNewXmlFile] = useState<File | null>(null);
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [replaceError, setReplaceError] = useState("");
  const [replaceSuccess, setReplaceSuccess] = useState("");
  const newXmlInputRef = React.useRef<HTMLInputElement>(null);
  const newPdfInputRef = React.useRef<HTMLInputElement>(null);

  // Redirect if not logged in or invalid user
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.roles && (user.roles.includes("ADMIN") || user.roles.includes("ADMIN_GEN"))) {
        router.push("/xmlends/admin");
      } else if (!user.roles || (!user.roles.includes("USER_REMB") && !user.roles.includes("USER_SUP_LEC"))) {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPeriod(true);
    setPeriodError("");
    setPeriodSuccess("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/xmlends/ejercicios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          numeroFacturas: limiteFacturas,
          montoReembolso: parseFloat(montoLimite),
        }),
      });
      if (response.ok) {
        setPeriodSuccess("¡Periodo creado con éxito! Las fechas se ajustaron automáticamente al mes actual.");
        setTimeout(() => {
          setShowCreatePeriodModal(false);
          setPeriodSuccess("");
        }, 3000);
      } else {
        setPeriodError(`Error por conexión al servidor (código ${response.status})`);
      }
    } catch (err: any) {
      setPeriodError(`Error por conexión al servidor (${err?.message || "ERR_NETWORK"})`);
    } finally {
      setCreatingPeriod(false);
    }
  };

  const handleSendAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAppeal(true);
    setAppealError("");
    setAppealSuccess("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/xmlends/factura/${appealingFacturaId}/apelar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ justificacion }),
      });
      if (response.ok) {
        setAppealSuccess("¡Apelación registrada con éxito!");
        fetchFacturas();
        setTimeout(() => {
          setShowAppealModal(false);
          setJustificacion("");
          setAppealSuccess("");
        }, 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setAppealError(errorData.message || `Error por conexión al servidor (código ${response.status})`);
      }
    } catch (err: any) {
      setAppealError(`Error por conexión al servidor (${err?.message || "ERR_NETWORK"})`);
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const fetchFacturas = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/xmlends/mis-facturas`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setFacturas(data.sort((a: Factura, b: Factura) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime()));
      } else {
        setErrorMessage(`Error por conexión al servidor (código ${response.status})`);
      }
    } catch (error: any) {
      setErrorMessage(`Error por conexión al servidor (${error?.message || "ERR_NETWORK"})`);
    } finally {
      setLoadingFacturas(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFacturas();
    }
  }, [token]);

  const sumTotal = facturas.reduce((acc, fac) => acc + (fac.contenidoXml?.total || 0), 0);
  const sumValidas = facturas
    .filter(fac => fac.status === "VALIDO")
    .reduce((acc, fac) => acc + (fac.contenidoXml?.total || 0), 0);

  const handleReplaceFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    setReplaceError("");
    setReplaceSuccess("");

    if (!newXmlFile || !newPdfFile) {
      setReplaceError("Ambos archivos (XML y PDF) son obligatorios.");
      return;
    }

    setReplacing(true);
    try {
      const formData = new FormData();
      formData.append("xml", newXmlFile);
      formData.append("pdf", newPdfFile);

      const response = await fetch(`${API_BASE_URL}/api/xmlends/factura/${replacingFacturaId}/reemplazar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setReplaceSuccess("¡Comprobantes reemplazados correctamente! Se ha reevaluado la validación.");
        fetchFacturas();
        setTimeout(() => {
          setShowReplaceModal(false);
          setNewXmlFile(null);
          setNewPdfFile(null);
          setReplaceSuccess("");
        }, 2500);
      } else {
        const errData = await response.json().catch(() => ({}));
        setReplaceError(errData.message || "Error al reemplazar los archivos.");
      }
    } catch (err: any) {
      setReplaceError(`Error por conexión al servidor (${err?.message || "ERR_NETWORK"})`);
    } finally {
      setReplacing(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 z-10 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">XMLends • Mis Reembolsos</h1>
          <p className="text-slate-500 text-sm">Monitorea el estatus y la validación de tus facturas cargadas</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          {user?.roles && user.roles.includes("USER_REMB") && (
            <button onClick={() => setShowCreatePeriodModal(true)} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
              Crear Periodo
            </button>
          )}
          {user?.roles && user.roles.includes("USER_REMB") && (
            <Link href="/xmlends/upload" className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg shadow-sm shadow-blue-500/10 transition-all cursor-pointer">
              + Nueva Factura
            </Link>
          )}
          {user?.roles && (user.roles.includes("ADMIN") || user.roles.includes("ADMIN_GEN")) && (
            <Link href="/xmlends/admin" className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Panel Admin
            </Link>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-200 text-rose-600 text-sm text-center">
          {errorMessage}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
        {loadingFacturas ? (
          <div className="flex justify-center items-center py-20">
            <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : facturas.length === 0 ? (
          <div className="text-center py-20 px-4 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-350 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm font-semibold">Aún no has registrado facturas en este periodo.</p>
            {user?.roles && user.roles.includes("USER_REMB") && (
              <Link href="/xmlends/upload" className="inline-flex rounded-lg bg-blue-650 hover:bg-blue-700 text-white text-xs font-semibold px-4.5 py-2.5 transition-colors cursor-pointer shadow-sm">
                Sube tu primer reembolso
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 font-bold text-slate-700 text-xs text-left uppercase tracking-wider">
                <tr>
                  <th className="p-4">Concepto</th>
                  <th className="p-4">Emisor</th>
                  <th className="p-4">Monto</th>
                  <th className="p-4">Fecha Factura</th>
                  <th className="p-4">Estado SAT</th>
                  <th className="p-4">Concepto</th>
                  <th className="p-4">Semáforo</th>
                  <th className="p-4">Detalle Validación</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-650">
                {facturas.map((fac) => {
                  let statusBadge = "";
                  if (fac.status === "VALIDO") {
                    statusBadge = "bg-emerald-100 text-emerald-800 border-emerald-200 border";
                  } else if (fac.status === "LISTO_PARA_VALIDAR") {
                    statusBadge = "bg-indigo-100 text-indigo-800 border-indigo-200 border";
                  } else if (fac.status === "REVISION") {
                    statusBadge = "bg-amber-100 text-amber-800 border-amber-200 border";
                  } else {
                    statusBadge = "bg-rose-100 text-rose-800 border-rose-200 border";
                  }

                  const isCancelado = fac.statusMotivo?.toLowerCase().includes("cancelado") || fac.statusMotivo?.toLowerCase().includes("no vigente");

                  return (
                    <tr key={fac.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-slate-800 truncate max-w-[200px]" title={fac.concepto}>
                          {fac.concepto || "Sin concepto"}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          UUID: {fac.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-700 truncate max-w-[180px]" title={fac.contenidoXml?.nombreEmisor}>
                          {fac.contenidoXml?.nombreEmisor || "Desconocido"}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          RFC: {fac.contenidoXml?.rfcEmisor}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-800">
                        ${fac.contenidoXml?.total?.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {fac.contenidoXml?.moneda || "MXN"}
                      </td>
                      <td className="p-4 text-slate-500">
                        {fac.fechaFactura ? new Date(fac.fechaFactura).toISOString().split("T")[0] : "N/A"}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          isCancelado ? "bg-rose-100 text-rose-800 border border-rose-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}>
                          {isCancelado ? "Cancelado" : "Vigente"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          fac.status === "VALIDO" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                          (fac.status === "REVISION" || fac.status === "LISTO_PARA_VALIDAR") ? "bg-amber-100 text-amber-800 border border-amber-200" :
                          "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}>
                          {fac.status === "VALIDO" ? "Permitido" : (fac.status === "REVISION" || fac.status === "LISTO_PARA_VALIDAR") ? "Bajo Revisión" : "Rechazado"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${statusBadge}`}>
                          {fac.status === "VALIDO" ? "Válido" : fac.status === "LISTO_PARA_VALIDAR" ? "P. Aprobado" : fac.status === "REVISION" ? "En Revisión" : "Rechazado"}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-500 max-w-[250px] truncate" title={fac.statusMotivo}>
                        {fac.statusMotivo || "Factura procesada correctamente"}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1.5">
                          {fac.status === "NO_VALIDO" && !fac.apelado && !fac.apelacionDenegada && (
                            <button
                              onClick={() => {
                                setAppealingFacturaId(fac.id);
                                setShowAppealModal(true);
                              }}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 rounded text-xs font-bold transition-all border border-indigo-100 cursor-pointer"
                            >
                              Apelar
                            </button>
                          )}
                          {fac.apelado && (
                            <span className="inline-flex rounded px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Apelado
                            </span>
                          )}
                          {fac.apelacionDenegada && (
                            <span className="inline-flex rounded px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Apelación Denegada
                            </span>
                          )}
                          {(fac.status === "REVISION" || fac.status === "NO_VALIDO") && (
                            <button
                              onClick={() => {
                                setReplacingFacturaId(fac.id);
                                setShowReplaceModal(true);
                              }}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded text-xs font-bold transition-all border border-amber-100 cursor-pointer"
                            >
                              Reemplazar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {facturas.length > 0 && (
                  <>
                    <tr className="bg-emerald-50/40 border-t border-slate-200">
                      <td className="p-4 font-bold text-emerald-800" colSpan={2}>Subtotal Aprobadas (Válidas)</td>
                      <td className="p-4 font-mono font-black text-emerald-700" colSpan={7}>
                        ${sumValidas.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-4 font-bold text-slate-700" colSpan={2}>Total General (Filtro)</td>
                      <td className="p-4 font-mono font-black text-indigo-700" colSpan={7}>
                        ${sumTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear Periodo - Glassmorphism */}
      {showCreatePeriodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40 transition-opacity">
          <div className="w-full max-w-md bg-white/90 border border-white/20 shadow-2xl rounded-2xl p-6 backdrop-blur-lg transform transition-all duration-300 scale-100 flex flex-col space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Crear mi Periodo / Ejercicio</h3>
              <button onClick={() => setShowCreatePeriodModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors text-lg font-bold">×</button>
            </div>
            {periodError && <div className="p-2.5 rounded bg-rose-500/10 text-rose-600 text-xs text-center font-semibold">{periodError}</div>}
            {periodSuccess && <div className="p-2.5 rounded bg-emerald-500/10 text-emerald-600 text-xs text-center font-semibold">{periodSuccess}</div>}
            <form onSubmit={handleCreatePeriod} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Límite Facturas</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={limiteFacturas}
                    onChange={(e) => setLimiteFacturas(parseInt(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-slate-800 shadow-sm text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Monto Límite ($)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={montoLimite}
                    onChange={(e) => setMontoLimite(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-slate-800 shadow-sm text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duración de Periodo</span>
                <span className="block text-xs text-slate-600 font-semibold">
                  Ajustado al mes actual: {new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, '0')}-01 al {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}
                </span>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePeriodModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingPeriod}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-indigo-650 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {creatingPeriod ? "Creando..." : "Crear Periodo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Apelar - Glassmorphism */}
      {showAppealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40 transition-opacity">
          <div className="w-full max-w-md bg-white/90 border border-white/20 shadow-2xl rounded-2xl p-6 backdrop-blur-lg transform transition-all duration-300 scale-100 flex flex-col space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Apelación de Factura Rechazada</h3>
              <button onClick={() => setShowAppealModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors text-lg font-bold">×</button>
            </div>
            {appealError && <div className="p-2.5 rounded bg-rose-500/10 text-rose-600 text-xs text-center font-semibold">{appealError}</div>}
            {appealSuccess && <div className="p-2.5 rounded bg-emerald-500/10 text-emerald-600 text-xs text-center font-semibold">{appealSuccess}</div>}
            <form onSubmit={handleSendAppeal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Escribe tu justificación para apelar este rechazo:</label>
                <textarea
                  required
                  rows={4}
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  placeholder="Explica detalladamente por qué el gasto es válido o deducible..."
                  className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-slate-800 shadow-sm text-xs focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAppealModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingAppeal}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-indigo-650 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingAppeal ? "Enviando..." : "Enviar Apelación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reemplazar Factura - Glassmorphism */}
      {showReplaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40 transition-opacity">
          <div className="w-full max-w-lg bg-white/90 border border-white/20 shadow-2xl rounded-2xl p-6 backdrop-blur-lg transform transition-all duration-300 scale-100 flex flex-col space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Reemplazar Comprobantes de Factura</h3>
              <button onClick={() => setShowReplaceModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors text-lg font-bold">×</button>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Sube el nuevo archivo XML y PDF de reemplazo. Se ejecutarán las validaciones automáticas del SAT e IA nuevamente. Ambos archivos deben llamarse exactamente igual.
            </p>

            {replaceError && <div className="p-2.5 rounded bg-rose-500/10 text-rose-600 text-xs text-center font-semibold">{replaceError}</div>}
            {replaceSuccess && <div className="p-2.5 rounded bg-emerald-500/10 text-emerald-600 text-xs text-center font-semibold">{replaceSuccess}</div>}

            <form onSubmit={handleReplaceFactura} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200/80 rounded-xl p-4 hover:border-blue-500/50 hover:bg-blue-50/5 transition-all space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="flex h-4.5 w-4.5 items-center justify-center rounded bg-blue-100 text-[9px] font-black text-blue-600">XML</span>
                    Factura (.xml)
                  </h4>
                  <div className="relative border border-dashed border-slate-200 hover:border-blue-500/40 rounded-lg p-4 text-center bg-slate-50/50 transition-colors cursor-pointer text-xs">
                    <input
                      type="file"
                      accept=".xml"
                      ref={newXmlInputRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setNewXmlFile(e.target.files[0]);
                          setReplaceError("");
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-slate-500 truncate max-w-full">
                      {newXmlFile ? newXmlFile.name : "Seleccionar XML"}
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200/80 rounded-xl p-4 hover:border-red-500/50 hover:bg-red-50/5 transition-all space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="flex h-4.5 w-4.5 items-center justify-center rounded bg-red-100 text-[9px] font-black text-red-650">PDF</span>
                    Soporte (.pdf)
                  </h4>
                  <div className="relative border border-dashed border-slate-200 hover:border-red-500/40 rounded-lg p-4 text-center bg-slate-50/50 transition-colors cursor-pointer text-xs">
                    <input
                      type="file"
                      accept=".pdf"
                      ref={newPdfInputRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setNewPdfFile(e.target.files[0]);
                          setReplaceError("");
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-slate-500 truncate max-w-full">
                      {newPdfFile ? newPdfFile.name : "Seleccionar PDF"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReplaceModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={replacing || !newXmlFile || !newPdfFile}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {replacing ? "Procesando..." : "Confirmar Reemplazo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
