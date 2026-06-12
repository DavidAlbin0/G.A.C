"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../components/AuthProvider";
import { useRouter } from "next/navigation";
import { API_ROUTES } from "../../utils/apiRoutes";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  USER_REMB: "Usuario Contador",
  USER_SUP_LEC: "Usuario Lectura"
};

export default function ProfilePage() {
  const { user, loading, token, logout } = useAuth();
  const router = useRouter();

  // State for password change modal
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?\":{}|<>]).{10,}$/;
    if (!passwordRegex.test(newPassword)) {
      setPasswordError("La nueva contraseña debe tener al menos 10 caracteres, incluyendo al menos una mayúscula, una minúscula, un número y un carácter especial.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch(API_ROUTES.auth.changePassword, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      if (response.ok) {
        setPasswordSuccess("¡Contraseña cambiada exitosamente!");
        setOldPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setTimeout(() => {
          setIsChangePasswordOpen(false);
          setPasswordSuccess("");
          setShowOldPassword(false);
          setShowNewPassword(false);
          setShowConfirmNewPassword(false);
        }, 1500);
      } else {
        const errData = await response.json().catch(() => ({}));
        setPasswordError(errData.message || "Error al cambiar la contraseña. Verifica tu contraseña actual.");
      }
    } catch (error: any) {
      setPasswordError(`Error por conexión al servidor (${error?.message || "ERR_NETWORK"})`);
    } finally {
      setIsChangingPassword(false);
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

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-600/5 blur-3xl" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl" />

      <div className="w-full max-w-2xl z-10 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Perfil de Usuario
          </h2>
          <p className="text-sm text-slate-500">
            Administra los detalles de tu cuenta y seguridad
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xl p-8 space-y-8">
          {/* Avatar and Header */}
          <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-100">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/20">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h3 className="text-xl font-bold text-slate-900">{user.username}</h3>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start pt-1">
                {user.roles && user.roles.map((role) => (
                  <span
                    key={role}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wide"
                  >
                    {ROLE_LABELS[role] || role}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Detalles de la Cuenta</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Nombre de Usuario</span>
                <p className="text-sm font-semibold text-slate-800">{user.username}</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Correo Electrónico</span>
                <p className="text-sm font-semibold text-slate-800">{user.email}</p>
              </div>

              {user.id && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1 sm:col-span-2">
                  <span className="text-xs text-slate-400 font-medium">ID de Usuario</span>
                  <p className="text-xs font-mono text-slate-650 select-all break-all">{user.id}</p>
                </div>
              )}

              {user.rfc && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1 sm:col-span-2">
                  <span className="text-xs text-slate-400 font-medium">RFC</span>
                  <p className="text-sm font-semibold text-slate-800">{user.rfc}</p>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1 sm:col-span-2">
                <span className="text-xs text-slate-400 font-medium">Roles Asignados</span>
                <p className="text-sm font-semibold text-slate-800">{user.roles?.map(r => ROLE_LABELS[r] || r).join(", ") || "USER"}</p>
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setIsChangePasswordOpen(true)}
              className="w-full flex justify-center py-2.5 px-4 border border-blue-200 hover:border-blue-300 rounded-lg shadow-sm text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 transition-all cursor-pointer"
            >
              Cambiar Contraseña
            </button>
            <button
              onClick={logout}
              className="w-full flex justify-center py-2.5 px-4 border border-slate-200 hover:border-rose-300 rounded-lg shadow-sm text-sm font-semibold text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50/50 transition-all cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Cambiar Contraseña</h3>
              <button
                onClick={() => {
                  setIsChangePasswordOpen(false);
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmNewPassword("");
                  setPasswordError("");
                  setPasswordSuccess("");
                  setShowOldPassword(false);
                  setShowNewPassword(false);
                  setShowConfirmNewPassword(false);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {passwordError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-200 text-rose-600 text-xs text-center font-medium">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-200 text-emerald-600 text-xs text-center font-medium">
                  {passwordSuccess}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-3.5 pr-10 py-2.5 text-slate-800 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showOldPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.815 7.815L21 21m-3.96-3.96l-3.64-3.64M12 8.25a3.75 3.75 0 105.304 5.304L12 8.25z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-3.5 pr-10 py-2.5 text-slate-800 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs transition-colors"
                    placeholder="Mínimo 10 caracteres, 1 mayús, 1 minús, 1 número, 1 esp."
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showNewPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.815 7.815L21 21m-3.96-3.96l-3.64-3.64M12 8.25a3.75 3.75 0 105.304 5.304L12 8.25z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    )}
                  </button>
                </div>
                <span className="text-[9px] text-slate-400 block leading-normal mt-0.5">
                  Mínimo 10 caracteres: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial.
                </span>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-3.5 pr-10 py-2.5 text-slate-800 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmNewPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.815 7.815L21 21m-3.96-3.96l-3.64-3.64M12 8.25a3.75 3.75 0 105.304 5.304L12 8.25z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isChangingPassword || !oldPassword || !newPassword || !confirmNewPassword}
                className="w-full py-2.5 flex justify-center text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-blue-500/10 hover:shadow-blue-500/20"
              >
                {isChangingPassword ? "Cambiando contraseña..." : "Cambiar Contraseña"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
