"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { useRouter } from "next/navigation";
import { API_ROUTES, API_BASE_URL } from "../../../utils/apiRoutes";
import Link from "next/link";

export default function XmlendsUploadPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [ejercicios, setEjercicios] = useState<any[]>([]);
  const [selectedEjercicioId, setSelectedEjercicioId] = useState("");
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  const [loadingEjercicios, setLoadingEjercicios] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const xmlInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not logged in or not userRemb
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!user.roles || !user.roles.includes("USER_REMB")) {
        router.push("/xmlends/dashboard");
      }
    }
  }, [user, loading, router]);

  // Fetch exercises
  useEffect(() => {
    const fetchEjercicios = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/xmlends/ejercicios`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setEjercicios(data);
          if (data.length > 0) {
            setSelectedEjercicioId(data[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching ejercicios:", error);
      } finally {
        setLoadingEjercicios(false);
      }
    };
    if (token && user?.roles && user.roles.includes("USER_REMB")) {
      fetchEjercicios();
    }
  }, [token, user]);

  const handleXmlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith(".xml")) {
        setXmlFile(file);
        setErrorMessage("");
      } else {
        setErrorMessage("El archivo de factura debe ser un XML válido (.xml)");
      }
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith(".pdf")) {
        setPdfFile(file);
        setErrorMessage("");
      } else {
        setErrorMessage("El archivo de soporte debe ser un PDF válido (.pdf)");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!xmlFile || !pdfFile) {
      setErrorMessage("Ambos archivos (XML y PDF) son obligatorios.");
      return;
    }

    if (!selectedEjercicioId) {
      setErrorMessage("Por favor selecciona un Ejercicio de reembolso.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("xml", xmlFile);
      formData.append("pdf", pdfFile);
      formData.append("ejercicioId", selectedEjercicioId);

      const response = await fetch(`${API_BASE_URL}/api/xmlends/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(`¡Archivos cargados con éxito! Estatus del semáforo: ${data.status}`);
        setXmlFile(null);
        setPdfFile(null);
        if (xmlInputRef.current) xmlInputRef.current.value = "";
        if (pdfInputRef.current) pdfInputRef.current.value = "";
        
        setTimeout(() => {
          router.push("/xmlends/dashboard");
        }, 3000);
      } else {
        const errData = await response.json().catch(() => ({}));
        setErrorMessage(errData.message || "Error al procesar la subida de reembolsos.");
      }
    } catch (error: any) {
      setErrorMessage(`Error por conexión al servidor (${error?.message || "ERR_NETWORK"})`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 z-10 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">XMLends • Cargar Reembolso</h1>
          <p className="text-slate-500 text-sm">Sube tus archivos XML y PDF obligatorios para validar tu reembolso</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <Link href="/xmlends/dashboard" className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Mis Reembolsos
          </Link>
          {user?.roles && user.roles.includes("ADMIN") && (
            <Link href="/xmlends/admin" className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm shadow-indigo-500/10">
              Panel Admin
            </Link>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium text-center">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold text-center">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 space-y-6">
        <div>
          <label htmlFor="ejercicio" className="block text-sm font-bold text-slate-700 mb-2">
            Periodo / Ejercicio de Reembolso
          </label>
          {loadingEjercicios ? (
            <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          ) : ejercicios.length === 0 ? (
            <div className="text-slate-500 text-xs p-3.5 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
              No hay ejercicios creados por el administrador. Ponte en contacto con soporte para asignar un ejercicio.
            </div>
          ) : (
            <select
              id="ejercicio"
              name="ejercicio"
              required
              value={selectedEjercicioId}
              onChange={(e) => setSelectedEjercicioId(e.target.value)}
              className="block w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm transition-colors cursor-pointer"
            >
              {ejercicios.map((ej) => (
                <option key={ej.id} value={ej.id}>
                  Ejercicio #{ej.id.substring(ej.id.length - 6)} - Límite: {ej.numeroFacturas} facturas / ${ej.montoReembolso.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-200/80 rounded-xl p-5 hover:border-blue-500/50 hover:bg-blue-50/10 transition-all space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-[10px] font-black text-blue-600">XML</span>
              Archivo de Factura (.xml)
            </h3>
            <p className="text-xs text-slate-400">Es el archivo CFDI timbrado expedido por el proveedor.</p>
            <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-500/40 rounded-xl p-6 text-center bg-slate-50/50 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".xml"
                ref={xmlInputRef}
                onChange={handleXmlChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-1 flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <div className="text-xs font-semibold text-slate-600">
                  {xmlFile ? xmlFile.name : "Seleccionar XML"}
                </div>
                {xmlFile && <span className="text-[10px] text-emerald-600 font-bold">✓ Cargado</span>}
              </div>
            </div>
          </div>

          <div className="border border-slate-200/80 rounded-xl p-5 hover:border-red-500/50 hover:bg-red-50/10 transition-all space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-red-100 text-[10px] font-black text-red-600">PDF</span>
              Archivo de Soporte (.pdf)
            </h3>
            <p className="text-xs text-slate-400">Es la representación gráfica de la factura y su comprobante.</p>
            <div className="relative border-2 border-dashed border-slate-200 hover:border-red-500/40 rounded-xl p-6 text-center bg-slate-50/50 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                ref={pdfInputRef}
                onChange={handlePdfChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-1 flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <div className="text-xs font-semibold text-slate-600">
                  {pdfFile ? pdfFile.name : "Seleccionar PDF"}
                </div>
                {pdfFile && <span className="text-[10px] text-emerald-600 font-bold">✓ Cargado</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={uploading || !xmlFile || !pdfFile || !selectedEjercicioId}
            className="px-6 py-3 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all hover:scale-[1.01] active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Validando y subiendo reembolso...
              </span>
            ) : (
              "Subir y Validar Factura"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
