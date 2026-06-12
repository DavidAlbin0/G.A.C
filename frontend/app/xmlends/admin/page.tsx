"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_ROUTES, API_BASE_URL } from "../../../utils/apiRoutes";

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
  apelado?: boolean;
  justificacionApelacion?: string;
  apelacionDenegada?: boolean;
  userID: string;
  userName?: string;
  empresaID: string;
  ejercicioID: string;
  fileName?: string;
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

export default function XmlendsAdminPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  // Summary Metrics
  const [metrics, setMetrics] = useState({
    totalFacturas: 0,
    validas: 0,
    noValidas: 0,
    revision: 0,
    subidasEsteMes: 0
  });

  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [ejercicios, setEjercicios] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Filter state
  const [selectedEmpresaFilter, setSelectedEmpresaFilter] = useState("TODAS");
  const [selectedEjercicioFilter, setSelectedEjercicioFilter] = useState("TODOS");

  // Create Ejercicio form state
  const getFirstDayOfMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  };

  const getLastDayOfMonth = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
  };

  const [limiteFacturas, setLimiteFacturas] = useState(10);
  const [montoLimite, setMontoLimite] = useState("5000");
  const [ownerUserId, setOwnerUserId] = useState("default_user");
  const [fechaInicio, setFechaInicio] = useState(getFirstDayOfMonth());
  const [fechaFin, setFechaFin] = useState(getLastDayOfMonth());
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [submittingForm, setSubmittingForm] = useState(false);

  // Redirect if not logged in or not administradoreishon
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!user.roles || (!user.roles.includes("ADMIN") && !user.roles.includes("ADMIN_GEN"))) {
        router.push("/xmlends/dashboard");
      }
    }
  }, [user, loading, router]);

  const fetchAdminData = async () => {
    if (!token) return;
    try {
      const resSummary = await fetch(`${API_BASE_URL}/api/xmlends/admin/resumen`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const resCompanies = await fetch(API_ROUTES.auth.empresas);
      const resEjercicios = await fetch(`${API_BASE_URL}/api/xmlends/ejercicios`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (resSummary.ok && resCompanies.ok) {
        const summaryData = await resSummary.json();
        const companiesData = await resCompanies.json();
        const ejerciciosData = resEjercicios.ok ? await resEjercicios.json() : [];

        setMetrics({
          totalFacturas: summaryData.totalFacturas,
          validas: summaryData.validas,
          noValidas: summaryData.noValidas,
          revision: summaryData.revision,
          subidasEsteMes: summaryData.subidasEsteMes
        });
        setFacturas(summaryData.facturas || []);
        setEmpresas(companiesData || []);
        setEjercicios(ejerciciosData || []);
      } else {
        setErrorMessage(`Error por conexión al servidor (código ${resSummary.status})`);
      }
    } catch (error: any) {
      setErrorMessage(`Error por conexión al servidor (${error?.message || "ERR_NETWORK"})`);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (token && user?.roles && (user.roles.includes("ADMIN") || user.roles.includes("ADMIN_GEN"))) {
      fetchAdminData();
    }
  }, [token, user]);

  const handleEmpresaFilterChange = (val: string) => {
    setSelectedEmpresaFilter(val);
    setSelectedEjercicioFilter("TODOS");
  };

  const exercisesForSelectedCompany = selectedEmpresaFilter === "TODAS"
    ? ejercicios
    : ejercicios.filter(ej => ej.empresaID === selectedEmpresaFilter);

  const handleCreateEjercicio = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmittingForm(true);

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
          userPropietario: ownerUserId,
          fechaInicio: fechaInicio || null,
          fechaFin: fechaFin || null
        }),
      });

      if (response.ok) {
        setFormSuccess("¡Ejercicio de reembolso asignado con éxito!");
        setOwnerUserId("");
      } else {
        setFormError(`Error por conexión al servidor (código ${response.status})`);
      }
    } catch (error: any) {
      setFormError(`Error por conexión al servidor (${error?.message || "ERR_NETWORK"})`);
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleDeleteFactura = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta factura? Esto borrará el archivo y los datos permanentemente.")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/xmlends/factura/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFacturas(prev => prev.filter(f => f.id !== id));
        fetchAdminData();
      } else {
        alert(`Error por conexión al servidor (código ${res.status})`);
      }
    } catch (e: any) {
      alert(`Error por conexión al servidor (${e?.message || "ERR_NETWORK"})`);
    }
  };

  // Filter invoices based on selected company
  let filteredFacturas = selectedEmpresaFilter === "TODAS"
    ? facturas
    : facturas.filter(f => f.empresaID === selectedEmpresaFilter);
    
  if (selectedEjercicioFilter !== "TODOS") {
    filteredFacturas = filteredFacturas.filter(f => f.ejercicioID === selectedEjercicioFilter);
  }

  // Calculate sum of amounts
  const sumTotal = filteredFacturas.reduce((acc, fac) => acc + (fac.contenidoXml?.total || 0), 0);
  const sumValidas = filteredFacturas
    .filter(fac => fac.status === "VALIDO")
    .reduce((acc, fac) => acc + (fac.contenidoXml?.total || 0), 0);

  // Helper to get company name by ID
  const getEmpresaName = (id: string): string => {
    const found = empresas.find(e => e.id === id);
    return found ? found.nombre : "General / Sacmag";
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 z-10 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">XMLends • Panel de Administración</h1>
          <p className="text-slate-500 text-sm">Monitorea reembolsos de todas las empresas y gestiona ejercicios fiscales</p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-200 text-rose-600 text-sm text-center">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subidas Totales</div>
          <div className="text-3xl font-black text-slate-800">{metrics.totalFacturas}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-5 shadow-sm space-y-2">
          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Válidas (Aprobadas)</div>
          <div className="text-3xl font-black text-emerald-800">{metrics.validas}</div>
        </div>
        <div className="bg-amber-50 border border-amber-150 rounded-xl p-5 shadow-sm space-y-2">
          <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">En Revisión Manual</div>
          <div className="text-3xl font-black text-amber-800">{metrics.revision}</div>
        </div>
        <div className="bg-rose-50 border border-rose-150 rounded-xl p-5 shadow-sm space-y-2">
          <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Rechazadas (Canceladas)</div>
          <div className="text-3xl font-black text-rose-800">{metrics.noValidas}</div>
        </div>
        <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-5 shadow-sm space-y-2">
          <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Subidas del Mes</div>
          <div className="text-3xl font-black text-indigo-800">{metrics.subidasEsteMes}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md h-fit space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Crear Periodo / Ejercicio</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Asigna un límite de facturas subidas y monto máximo de reembolso a un usuario específico.
          </p>

          {formError && <div className="p-2.5 rounded bg-rose-500/10 text-rose-600 text-xs text-center">{formError}</div>}
          {formSuccess && <div className="p-2.5 rounded bg-emerald-500/10 text-emerald-600 text-xs text-center">{formSuccess}</div>}

          <form onSubmit={handleCreateEjercicio} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ID de Usuario Propietario</label>
              <input
                type="text"
                required
                value={ownerUserId}
                onChange={(e) => setOwnerUserId(e.target.value)}
                placeholder="Escribe el ID o Username"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 shadow-sm text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Facturas Límite</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={limiteFacturas}
                  onChange={(e) => setLimiteFacturas(parseInt(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 shadow-sm text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Monto Límite ($)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={montoLimite}
                  onChange={(e) => setMontoLimite(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 shadow-sm text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 shadow-sm text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha Fin</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 shadow-sm text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submittingForm}
              className="w-full py-2 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submittingForm ? "Guardando..." : "Asignar Ejercicio"}
            </button>
          </form>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Historial Global de Reembolsos</h2>
              <p className="text-[11px] text-slate-400">Listado consolidado de todos los archivos cargados</p>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500">Ejercicio:</label>
                <select
                  value={selectedEjercicioFilter}
                  onChange={(e) => setSelectedEjercicioFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="TODOS">Todos</option>
                  {exercisesForSelectedCompany.map((ej) => (
                    <option key={ej.id} value={ej.id}>
                      {ej.fechaInicio && ej.fechaFin ? `De ${ej.fechaInicio} a ${ej.fechaFin} (UID: ${ej.id.substring(0, 8)}...)` : `UID: ${ej.id.substring(0, 8)}...`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500">Empresa:</label>
                <select
                  value={selectedEmpresaFilter}
                  onChange={(e) => handleEmpresaFilterChange(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="TODAS">Todas</option>
                  {empresas.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loadingData ? (
            <div className="flex justify-center items-center py-20">
              <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : filteredFacturas.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              No se han encontrado facturas registradas para esta selección.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50 text-slate-700 text-[10px] font-bold text-left uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Archivo / Usuario</th>
                    <th className="p-3">Receptor / Concepto</th>
                    <th className="p-3">Monto</th>
                    <th className="p-3">Semáforo</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredFacturas.map((fac) => {
                    let statusColor = "";
                    if (fac.status === "VALIDO") {
                      statusColor = "text-emerald-700 bg-emerald-50 border border-emerald-100";
                    } else if (fac.status === "LISTO_PARA_VALIDAR") {
                      statusColor = "text-purple-700 bg-purple-50 border border-purple-100";
                    } else if (fac.status === "REVISION") {
                      statusColor = "text-amber-700 bg-amber-50 border border-amber-100";
                    } else {
                      statusColor = "text-rose-700 bg-rose-50 border border-rose-100";
                    }

                    return (
                      <tr key={fac.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <div className="font-semibold text-slate-800 truncate max-w-[150px]" title={fac.fileName}>
                              {fac.fileName || "N/A"}
                            </div>
                            {fac.apelado && (
                              <span className="inline-flex rounded px-1.5 py-0.5 text-[9px] font-black uppercase bg-indigo-100 text-indigo-700 border border-indigo-200">
                                Apelada
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                            {fac.userName ? fac.userName : fac.userID.substring(0, 10) + "..."}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-800 truncate max-w-[150px]" title={fac.contenidoXml?.nombreReceptor}>
                            {fac.contenidoXml?.nombreReceptor || "Desconocido"}
                          </div>
                          <div className="text-[9px] text-slate-400 truncate max-w-[150px]">
                            {fac.concepto || "Sin concepto"}
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-800">
                          ${fac.contenidoXml?.total?.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {fac.contenidoXml?.moneda || "MXN"}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor}`}>
                            {fac.status === "VALIDO" ? "Válido" : fac.status === "LISTO_PARA_VALIDAR" ? "P. Validar" : fac.status === "REVISION" ? "Revisión" : "Rechazado"}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button onClick={() => router.push(`/xmlends/admin/revisar/${fac.id}`)} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium hover:bg-blue-100 transition-colors">
                            Revisar
                          </button>
                          <button onClick={() => handleDeleteFactura(fac.id)} className="px-2 py-1 bg-rose-50 text-rose-600 rounded text-xs font-medium hover:bg-rose-100 transition-colors">
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredFacturas.length > 0 && (
                    <>
                      <tr className="bg-emerald-50/40 border-t border-slate-200">
                        <td className="p-3 font-bold text-emerald-800" colSpan={2}>Subtotal Aprobadas (Válidas)</td>
                        <td className="p-3 font-mono font-black text-emerald-700" colSpan={3}>
                          ${sumValidas.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                        </td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="p-3 font-bold text-slate-700" colSpan={2}>Total General (Filtro)</td>
                        <td className="p-3 font-mono font-black text-indigo-700" colSpan={3}>
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
      </div>
    </div>
  );
}
