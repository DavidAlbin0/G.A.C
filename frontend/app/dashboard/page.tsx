"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_ROUTES } from "../../utils/apiRoutes";

interface FileMetadata {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  contentType: string;
  userId: string;
  uploadTime: string;
}

export default function DashboardPage() {
  const { user, loading, token } = useAuth();
  const router = useRouter();

  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [activeViewFile, setActiveViewFile] = useState<FileMetadata | null>(null);
  const [viewBlobUrl, setViewBlobUrl] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [textPreviewContent, setTextPreviewContent] = useState<string | null>(null);

  // Duplicate and parsed states
  const [parsedTableData, setParsedTableData] = useState<any | null>(null);
  const [activeSubTable, setActiveSubTable] = useState<string | null>(null);

  const [activeUpdateFile, setActiveUpdateFile] = useState<FileMetadata | null>(null);
  const [newName, setNewName] = useState("");
  const [replacingFile, setReplacingFile] = useState<File | null>(null);
  const [updatingAction, setUpdatingAction] = useState(false);
  const updateFileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not logged in or not administradoreishon
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!user.roles || !user.roles.includes("ADMIN")) {
        router.push("/xmlends/dashboard");
      }
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

  // Get unique file categories that exist
  const getUniqueCategories = (): string[] => {
    const types = files.map(f => getFileType(f.contentType, f.fileName));
    return Array.from(new Set(types));
  };

  // Format File Size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Handle Real Upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0 || !token) return;

    const file = fileList[0];
    setUploading(true);
    setUploadProgress(0);
    setErrorMessage("");

    // Simulate nice progress bar while doing fetch
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 80) {
          clearInterval(progressInterval);
          return 80;
        }
        return prev + 10;
      });
    }, 80);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(API_ROUTES.files.upload, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        // Refresh list
        setTimeout(async () => {
          await fetchFiles();
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }, 300);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrorMessage(errorData.message || "Error al subir el archivo.");
        setUploading(false);
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      setErrorMessage(`Error por conexión al servidor (${error?.message || "ERR_NETWORK"})`);
      setUploading(false);
    }
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

  // Files categorized - show last 4
  const recentFiles = files.slice(0, 4);
  const categories = getUniqueCategories();

  // Calculate file occurrences by name for duplicate highlighting
  const fileNameCounts = files.reduce((acc, f) => {
    const name = f.fileName.toLowerCase();
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 z-10 relative">

      {/* Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-6 sm:p-8 overflow-hidden shadow-lg text-white">
        <div className="absolute top-0 right-0 -translate-y-1/2 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Panel de Control (G.A.C)
          </h1>
          <p className="text-blue-100 max-w-xl text-sm sm:text-base font-medium">
            Carga y administra archivos de tarifas y datos contables. La información guardada alimenta a la aplicación de escritorio Actualitodo.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-200 text-rose-600 text-sm text-center">
          {errorMessage}
        </div>
      )}

      {/* Grid Categories */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Categorías de Archivos</h2>
        {categories.length === 0 ? (
          <p className="text-slate-500 text-sm">Sube archivos para generar categorías automáticas.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
             {categories.map((cat) => {
              const categoryFiles = files.filter(f => getFileType(f.contentType, f.fileName) === cat);
              const count = categoryFiles.length;

              // Check if this category contains files with duplicate names
              const nameCounts: Record<string, number> = {};
              let hasDuplicates = false;
              for (const f of categoryFiles) {
                const name = f.fileName.toLowerCase();
                nameCounts[name] = (nameCounts[name] || 0) + 1;
                if (nameCounts[name] > 1) {
                  hasDuplicates = true;
                }
              }

              let colorClasses = "from-slate-100 to-slate-50 border-slate-200 text-slate-700 hover:border-slate-355";
              let badgeColor = "bg-slate-200 text-slate-700";
              let countColor = "text-slate-900";

              if (hasDuplicates) {
                colorClasses = "from-rose-50/90 to-white border-rose-200 text-rose-700 hover:border-rose-350 shadow-rose-50";
                badgeColor = "bg-rose-100/60 text-rose-700 border border-rose-200";
                countColor = "text-rose-900";
              } else if (cat === "TARIFAS") {
                colorClasses = "from-purple-50/80 to-white border-purple-100 text-purple-700 hover:border-purple-200";
                badgeColor = "bg-purple-100/50 text-purple-700 border-purple-200 border";
                countColor = "text-purple-900";
              } else if (cat === "INDICES10") {
                colorClasses = "from-emerald-50/80 to-white border-emerald-100 text-emerald-700 hover:border-emerald-200";
                badgeColor = "bg-emerald-100/50 text-emerald-700 border-emerald-200 border";
                countColor = "text-emerald-900";
              } else if (cat === "EXCEL") {
                colorClasses = "from-amber-50/80 to-white border-amber-100 text-amber-700 hover:border-amber-200";
                badgeColor = "bg-amber-100/50 text-amber-700 border-amber-200 border";
                countColor = "text-amber-900";
              } else if (cat === "PDF") {
                colorClasses = "from-blue-50/80 to-white border-blue-100 text-blue-700 hover:border-blue-200";
                badgeColor = "bg-blue-100/50 text-blue-700 border-blue-200 border";
                countColor = "text-blue-900";
              } else if (cat === "VARIOS") {
                colorClasses = "from-blue-50/80 to-white border-blue-100 text-blue-700 hover:border-blue-200";
                badgeColor = "bg-blue-100/50 text-blue-700 border-blue-200 border";
                countColor = "text-blue-900";
              }

              return (
                <Link
                  key={cat}
                  href={`/files/${cat}`}
                  className={`backdrop-blur-md bg-gradient-to-br border rounded-xl p-4 shadow-sm flex flex-col justify-between h-32 hover:scale-[1.03] transition-all cursor-pointer ${colorClasses}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold uppercase tracking-wider">{cat}</span>
                    {hasDuplicates && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                        ⚠️ DUPLICADOS
                      </span>
                    )}
                  </div>
                  {hasDuplicates ? (
                    <span className="text-[10px] font-semibold text-rose-600 block">
                      Archivos duplicados, elimina uno
                    </span>
                  ) : (
                    <div className="h-4" />
                  )}
                  <div className="flex justify-between items-end">
                    <span className={`text-2xl font-black ${countColor}`}>{count}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                      Ver todos
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Main File Management Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upload File Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between h-[340px]">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Subir Archivo</h2>
            <p className="text-slate-500 text-xs leading-relaxed">
              Sube archivos directamente al sistema. Serán almacenados de forma segura y categorizados de inmediato para el uso de Actualitodo.
            </p>

            {/* Dropzone */}
            <div className="mt-2 border-2 border-dashed border-slate-200 hover:border-blue-500/50 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-100/50 transition-colors relative cursor-pointer group">
              <input
                type="file"
                disabled={uploading}
                ref={fileInputRef}
                onChange={handleUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="space-y-2 flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                <div className="text-sm font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">
                  Selecciona un archivo
                </div>
                <span className="text-slate-400 text-xs">INDICES, TARIFAS, PDF, EXCEL, TXT</span>
              </div>
            </div>
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Subiendo archivo...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Files List Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Archivos Recientes</h2>
              <p className="text-xs text-gray-600">Últimos 4 archivos subidos al sistema</p>
            </div>
            {files.length > 4 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                Mostrando {recentFiles.length} de {files.length}
              </span>
            )}
          </div>

          {loadingFiles ? (
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : recentFiles.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <span className="text-slate-400 text-sm">No tienes archivos cargados. ¡Sube uno para empezar!</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                    <th className="pb-3">Nombre</th>
                    <th className="pb-3">Tipo</th>
                    <th className="pb-3">Tamaño</th>
                    <th className="pb-3">Subido</th>
                    <th className="pb-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                  {recentFiles.map((file) => {
                    const cat = getFileType(file.contentType, file.fileName);
                    const isDuplicate = fileNameCounts[file.fileName.toLowerCase()] > 1;
                    return (
                      <tr key={file.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 font-semibold text-slate-800 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-500 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          <button
                            onClick={() => handleView(file)}
                            className={`truncate max-w-[150px] sm:max-w-[200px] hover:underline cursor-pointer text-left transition-colors focus:outline-none ${
                              isDuplicate ? "text-rose-600 hover:text-rose-700 font-bold" : "text-slate-800 hover:text-blue-600"
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
                        <td className="py-3.5 text-xs font-bold">
                          <Link href={`/files/${cat}`} className="text-slate-500 hover:text-blue-600 hover:underline transition-colors">
                            {cat}
                          </Link>
                        </td>
                        <td className="py-3.5 text-slate-500">{formatBytes(file.fileSize)}</td>
                        <td className="py-3.5 text-slate-500">
                          {new Date(file.uploadTime).toISOString().split("T")[0]}
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
                  {getFileType(activeViewFile.contentType, activeViewFile.fileName)} • {formatBytes(activeViewFile.fileSize)}
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
              ) : getFileType(activeViewFile.contentType, activeViewFile.fileName) === "IMAGE" && viewBlobUrl ? (
                <div className="relative max-w-full max-h-[50vh]">
                  <img
                    src={viewBlobUrl}
                    alt={activeViewFile.fileName}
                    className="rounded-lg object-contain max-h-[50vh] max-w-full border border-slate-200 shadow-lg"
                  />
                </div>
              ) : getFileType(activeViewFile.contentType, activeViewFile.fileName) === "PDF" && viewBlobUrl ? (
                <iframe
                  src={viewBlobUrl}
                  title={activeViewFile.fileName}
                  className="w-full h-[55vh] rounded-xl border border-slate-200 shadow-md bg-slate-100"
                />
              ) : getFileType(activeViewFile.contentType, activeViewFile.fileName) === "EXCEL" ? (
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
