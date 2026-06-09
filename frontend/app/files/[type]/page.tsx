"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { API_ROUTES } from "../../../utils/apiRoutes";

interface FileMetadata {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  contentType: string;
  userId: string;
  uploadTime: string;
}

export default function CategoryPage() {
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const categoryType = (params.type as string)?.toUpperCase() || "";

  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Modals state
  const [activeViewFile, setActiveViewFile] = useState<FileMetadata | null>(null);
  const [viewBlobUrl, setViewBlobUrl] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [textPreviewContent, setTextPreviewContent] = useState<string | null>(null);

  // Parsed states
  const [parsedTableData, setParsedTableData] = useState<any | null>(null);
  const [activeSubTable, setActiveSubTable] = useState<string | null>(null);

  const [activeUpdateFile, setActiveUpdateFile] = useState<FileMetadata | null>(null);
  const [newName, setNewName] = useState("");
  const [replacingFile, setReplacingFile] = useState<File | null>(null);
  const [updatingAction, setUpdatingAction] = useState(false);
  const updateFileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fetch files from MongoDB
  const fetchFiles = async () => {
    if (!token) return;
    try {
      const response = await fetch(API_ROUTES.files.list, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Sort files by upload time descending (newest first)
        const sorted = data.sort((a: FileMetadata, b: FileMetadata) =>
          new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime()
        );
        setFiles(sorted);
      } else {
        setErrorMessage("Error al obtener la lista de archivos.");
      }
    } catch (error: any) {
      console.error("Error fetching files:", error);
      setErrorMessage(`Error por conexión al servidor (${error?.message || "ERR_NETWORK"})`);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFiles();
    }
  }, [token]);

  // Map MIME/extensions to category types
  const getFileType = (contentType: string, fileName: string): string => {
    const mime = contentType ? contentType.toLowerCase() : "";
    const ext = fileName.split(".").pop()?.toLowerCase() || "";

    if (mime === "application/pdf" || ext === "pdf") return "PDF";
    if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "IMAGE";
    if (mime.includes("spreadsheet") || mime.includes("excel") || ["xlsx", "xls", "csv"].includes(ext)) return "EXCEL";
    if (mime.startsWith("text/") || ["txt", "md", "json", "html", "css", "js"].includes(ext)) return "TEXT";
    if (mime.startsWith("tars/") || ["03", "cre", "isr", "sub"].includes(ext)) return "TARIFAS";
    if (mime.startsWith("depr/") || ["10"].includes(ext)) return "INDICES10";
    return "OTHER";
  };

  // Format File Size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!token || !confirm("¿Estás seguro de que deseas eliminar este archivo?")) return;

    try {
      const response = await fetch(API_ROUTES.files.byId(id), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setFiles(prev => prev.filter(f => f.id !== id));
      } else {
        setErrorMessage("No se pudo eliminar el archivo.");
      }
    } catch (error) {
      setErrorMessage("Error de conexión al eliminar el archivo.");
    }
  };

  // Handle View Securely (Loads as Blob or JSON using Auth headers)
  const handleView = async (file: FileMetadata) => {
    if (!token) return;
    setActiveViewFile(file);
    setViewLoading(true);
    setViewBlobUrl(null);
    setTextPreviewContent(null);
    setParsedTableData(null);
    setActiveSubTable(null);

    const fileName = file.fileName != null ? file.fileName.toLowerCase() : "";
    const ext = fileName.split(".").pop() || "";
    const isBinaryTable = ["dat", "isr", "sub", "03", "cre"].includes(ext);

    try {
      const response = await fetch(API_ROUTES.files.view(file.id), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("No se pudo cargar el archivo");
      }

      if (isBinaryTable) {
        const data = await response.json();
        setParsedTableData(data);
        if (data && data.tablas) {
          const keys = Object.keys(data.tablas);
          if (keys.length > 0) {
            setActiveSubTable(keys[0]);
          }
        }
      } else {
        const blob = await response.blob();
        const type = getFileType(file.contentType, file.fileName);
        if (type === "TEXT") {
          const text = await blob.text();
          setTextPreviewContent(text);
        } else {
          const url = URL.createObjectURL(blob);
          setViewBlobUrl(url);
        }
      }
    } catch (error) {
      console.error("Error previewing file:", error);
      setErrorMessage("Error al cargar la vista previa del archivo.");
    } finally {
      setViewLoading(false);
    }
  };

  // Close View Modal
  const closeViewModal = () => {
    if (viewBlobUrl) {
      URL.revokeObjectURL(viewBlobUrl);
    }
    setActiveViewFile(null);
    setViewBlobUrl(null);
    setTextPreviewContent(null);
    setParsedTableData(null);
    setActiveSubTable(null);
  };

  // Open Update Modal
  const openUpdateModal = (file: FileMetadata) => {
    setActiveUpdateFile(file);
    setNewName(file.fileName);
    setReplacingFile(null);
    setErrorMessage("");
  };

  // Close Update Modal
  const closeUpdateModal = () => {
    setActiveUpdateFile(null);
    setNewName("");
    setReplacingFile(null);
    if (updateFileInputRef.current) updateFileInputRef.current.value = "";
  };

  // Handle Rename
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUpdateFile || !newName.trim() || !token) return;

    setUpdatingAction(true);
    try {
      const response = await fetch(API_ROUTES.files.rename(activeUpdateFile.id), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newFileName: newName }),
      });

      if (response.ok) {
        await fetchFiles();
        closeUpdateModal();
      } else {
        setErrorMessage("Error al renombrar el archivo.");
      }
    } catch (error) {
      setErrorMessage("Error de conexión al renombrar.");
    } finally {
      setUpdatingAction(false);
    }
  };

  // Handle Replace File Content
  const handleReplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUpdateFile || !replacingFile || !token) return;

    setUpdatingAction(true);
    try {
      const formData = new FormData();
      formData.append("file", replacingFile);

      const response = await fetch(API_ROUTES.files.replace(activeUpdateFile.id), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        await fetchFiles();
        closeUpdateModal();
      } else {
        setErrorMessage("Error al reemplazar el contenido del archivo.");
      }
    } catch (error) {
      setErrorMessage("Error de conexión al reemplazar.");
    } finally {
      setUpdatingAction(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-slate-500 text-sm font-medium">Verificando sesión...</span>
        </div>
      </div>
    );
  }

  // Filter files by exact category
  const filteredFiles = files.filter(f => getFileType(f.contentType, f.fileName) === categoryType);

  // Calculate file occurrences by name for duplicate highlighting within this category
  const fileNameCounts = filteredFiles.reduce((acc, f) => {
    const name = f.fileName.toLowerCase();
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 z-10 relative">
      {/* Navigation Header */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
        <Link href="/dashboard" className="hover:text-slate-600 transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-slate-600">Archivos {categoryType}</span>
      </div>

      {/* Header Banner */}
      <div className="relative rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 overflow-hidden shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1 z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            Archivos {categoryType}
          </h1>
          <p className="text-slate-550 text-xs sm:text-sm">
            Listando todos los documentos de categoría {categoryType} guardados en el sistema.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="z-10 shrink-0 self-start sm:self-auto rounded-lg bg-slate-105 border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-200/50 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Volver al Dashboard
        </Link>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-200 text-rose-600 text-sm text-center">
          {errorMessage}
        </div>
      )}

      {/* Files Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">Todos los Archivos</h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            Total: {filteredFiles.length}
          </span>
        </div>

        {loadingFiles ? (
          <div className="flex justify-center items-center py-20">
            <svg className="animate-spin h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <span className="text-slate-400 text-sm">No hay archivos en esta categoría. ¡Sube un archivo de tipo {categoryType} desde el Dashboard!</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3">Nombre</th>
                  <th className="pb-3">Tamaño</th>
                  <th className="pb-3">Subido por</th>
                  <th className="pb-3">Fecha de Carga</th>
                  <th className="pb-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {filteredFiles.map((file) => {
                  const isDuplicate = fileNameCounts[file.fileName.toLowerCase()] > 1;
                  return (
                    <tr key={file.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 font-semibold text-slate-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-500 flex-shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <button
                          onClick={() => handleView(file)}
                          className={`truncate max-w-[200px] sm:max-w-[300px] hover:underline cursor-pointer text-left transition-colors focus:outline-none ${isDuplicate ? "text-rose-600 hover:text-rose-700 font-bold" : "text-slate-800 hover:text-blue-600"
                            }`}
                          title="Ver archivo"
                        >
                          {file.fileName}
                        </button>
                        {isDuplicate && (
                          <span className="shrink-0 text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-1.5 py-0.5">
                            ⚠️ Archivos duplicados, elimina uno
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-500">{formatBytes(file.fileSize)}</td>
                      <td className="py-3.5 text-slate-550 font-bold">{user.username}</td>
                      <td className="py-3.5 text-slate-500">
                        {new Date(file.uploadTime).toISOString().replace("T", " ").substring(0, 19)}
                      </td>
                      <td className="py-3.5 text-right space-x-3 text-xs font-bold">
                        <button
                          onClick={() => openUpdateModal(file)}
                          className="text-amber-600 hover:text-amber-700 transition-colors cursor-pointer"
                        >
                          Actualizar
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Viewer Modal */}
      {activeViewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-slate-900 truncate max-w-[250px] sm:max-w-[500px]">
                  {activeViewFile.fileName}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {categoryType} • {formatBytes(activeViewFile.fileSize)}
                </p>
              </div>
              <button
                onClick={closeViewModal}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-6 overflow-y-auto flex items-center justify-center bg-slate-50">
              {viewLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-slate-400 text-xs font-semibold">Cargando archivo...</span>
                </div>
              ) : parsedTableData !== null ? (
                <div className="w-full space-y-4">
                  {parsedTableData.tablas ? (
                    <div className="space-y-4 text-left w-full">
                      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                        {Object.keys(parsedTableData.tablas).map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setActiveSubTable(key)}
                            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeSubTable === key
                              ? "bg-blue-650 text-white shadow-md shadow-blue-500/10"
                              : "bg-slate-100 hover:bg-slate-200/85 text-slate-650"
                              }`}
                          >
                            {key}
                          </button>
                        ))}
                      </div>



                      {activeSubTable && parsedTableData.tablas[activeSubTable] && (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm max-h-[350px]">
                          <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                            <thead className="bg-slate-50 font-bold text-slate-700 sticky top-0 z-10 border-b border-slate-200">
                              <tr>
                                <th className="p-3">Límite Inferior</th>
                                <th className="p-3">Límite Superior</th>
                                <th className="p-3">Cuota Fija</th>
                                <th className="p-3">Porcentaje</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                              {parsedTableData.tablas[activeSubTable].map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50/50">
                                  <td className="p-3">{row.limInf.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                  <td className="p-3">{row.limSup.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                  <td className="p-3">{row.cuotaFija.toLocaleString('es-MX', { minimumFractionDigits: 4 })}</td>
                                  <td className="p-3">{row.porcentaje.toLocaleString('es-MX', { minimumFractionDigits: 4 })}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm max-h-[380px] w-full text-left">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50 font-bold text-slate-700 sticky top-0 z-10 border-b border-slate-200">
                          <tr>
                            <th className="p-3">Límite Inferior</th>
                            <th className="p-3">Límite Superior</th>
                            <th className="p-3">Cuota Fija</th>
                            <th className="p-3">Porcentaje</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                          {Array.isArray(parsedTableData) && parsedTableData.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="p-3">{row.limInf.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                              <td className="p-3">{row.limSup.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                              <td className="p-3">{row.cuotaFija.toLocaleString('es-MX', { minimumFractionDigits: 4 })}</td>
                              <td className="p-3">{row.porcentaje.toLocaleString('es-MX', { minimumFractionDigits: 4 })}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : textPreviewContent !== null ? (
                <pre className="w-full text-left font-mono text-xs bg-slate-900 border border-slate-950 p-4 rounded-xl overflow-auto max-h-[450px] text-slate-200">
                  {textPreviewContent}
                </pre>
              ) : categoryType === "IMAGE" && viewBlobUrl ? (
                <div className="relative max-w-full max-h-[50vh]">
                  <img
                    src={viewBlobUrl}
                    alt={activeViewFile.fileName}
                    className="rounded-lg object-contain max-h-[50vh] max-w-full border border-slate-200 shadow-lg"
                  />
                </div>
              ) : categoryType === "PDF" && viewBlobUrl ? (
                <iframe
                  src={viewBlobUrl}
                  title={activeViewFile.fileName}
                  className="w-full h-[55vh] rounded-xl border border-slate-200 shadow-md bg-slate-100"
                />
              ) : categoryType === "EXCEL" ? (
                <div className="w-full space-y-4">
                  <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-200">
                    <span>Visualizador de Hoja de Cálculo (Spreadsheet Preview)</span>
                    <span>Hoja 1 de 1</span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="min-w-full divide-y divide-slate-250 text-xs font-mono text-slate-650">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="p-2 border-r border-slate-200 w-10 text-center bg-slate-100 font-sans text-slate-500 font-bold">#</th>
                          <th className="p-2 border-r border-slate-200 text-center">A</th>
                          <th className="p-2 border-r border-slate-200 text-center">B</th>
                          <th className="p-2 border-r border-slate-200 text-center">C</th>
                          <th className="p-2 border-r border-slate-200 text-center">D</th>
                          <th className="p-2 text-center">E</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {[
                          ["1", "ID Archivo", "Nombre del Archivo", "Tamaño", "Versión Mín.", "Destino Actualitodo"],
                          ["2", "TX-2026-A", "tarifas_zonas_norte.xlsx", "1.4 MB", "v1.4.2", "Terminal Ventas"],
                          ["3", "EXE-LEG-5", "cobros_legacy_v2.exe", "12.8 MB", "v2.0.1", "Todas las PC"],
                          ["4", "CFG-GEN", "configuracion_actualitodo.json", "45 KB", "v1.0.0", "Servidor Central"],
                          ["5", "TX-2026-B", "tarifas_descuentos.xlsx", "950 KB", "v1.4.3", "Sucursales"],
                          ["6", "EXE-LEG-6", "facturacion_legacy_v3.exe", "15.2 MB", "v3.0.0", "Cajas de Cobro"],
                          ["7", "DAT-ACT", "control_versiones.csv", "120 KB", "v2.1.0", "Cliente Escritorio"],
                          ["8", "Resumen", "6 Archivos Registrados", "4 Categorías", "Sincronizados", "Listo para Consumir"]
                        ].map((row, index) => (
                          <tr key={index} className={index === 0 ? "bg-slate-50 font-bold text-slate-800" : index === 7 ? "bg-slate-50 font-bold text-slate-850 border-t-2 border-slate-300" : "bg-white text-slate-700"}>
                            <td className="p-2 border-r border-slate-200 text-center bg-slate-50 font-sans text-slate-400 font-bold">{row[0]}</td>
                            <td className="p-2 border-r border-slate-200">{row[1]}</td>
                            <td className="p-2 border-r border-slate-200">{row[2]}</td>
                            <td className="p-2 border-r border-slate-200 text-right text-emerald-600 font-medium">{row[3]}</td>
                            <td className="p-2 border-r border-slate-200 text-right text-blue-600 font-medium">{row[4]}</td>
                            <td className="p-2 text-right text-blue-700 font-bold">{row[5]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 space-y-4 w-full">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-500 font-medium">La vista previa en tiempo real no está soportada para este formato.</p>
                  <a
                    href={viewBlobUrl || "#"}
                    download={activeViewFile.fileName}
                    className="inline-flex rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 transition-colors cursor-pointer shadow-sm shadow-blue-500/10"
                  >
                    Descargar Archivo
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={closeViewModal}
                className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {activeUpdateFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Actualizar Archivo</h3>
              <button
                onClick={closeUpdateModal}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Form 1: Rename file */}
              <form onSubmit={handleRename} className="space-y-3.5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cambiar Nombre</h4>
                <div>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs transition-colors"
                    placeholder="Nuevo nombre del archivo"
                  />
                </div>
                <button
                  type="submit"
                  disabled={updatingAction || newName === activeUpdateFile.fileName}
                  className="w-full py-2 flex justify-center text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {updatingAction ? "Guardando..." : "Renombrar"}
                </button>
              </form>

              <div className="h-px bg-slate-100" />

              {/* Form 2: Replace file content */}
              <form onSubmit={handleReplace} className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reemplazar Contenido</h4>
                <div className="border border-dashed border-slate-200 hover:border-slate-300 rounded-lg p-5 text-center cursor-pointer relative bg-slate-50/50 hover:bg-slate-100/30 transition-colors">
                  <input
                    type="file"
                    required
                    ref={updateFileInputRef}
                    onChange={(e) => setReplacingFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1.5 flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    <span className="text-xs font-medium text-slate-500">
                      {replacingFile ? replacingFile.name : "Selecciona el nuevo archivo"}
                    </span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={updatingAction || !replacingFile}
                  className="w-full py-2 flex justify-center text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {updatingAction ? "Subiendo reemplazo..." : "Subir y Reemplazar Contenido"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
