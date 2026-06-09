"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_ROUTES } from "../../utils/apiRoutes";

export default function RegisterPage() {
  const { user, register, loading: authLoading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [rfc, setRfc] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState("");
  const [selectedRole, setSelectedRole] = useState("USER_REMB");

  // Redirect to appropriate dashboard if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      if (user.roles && user.roles.includes("ADMIN")) {
        router.push("/dashboard");
      } else {
        router.push("/xmlends/dashboard");
      }
    }
  }, [user, authLoading, router]);

  // Fetch companies list
  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const response = await fetch(API_ROUTES.auth.empresas);
        if (response.ok) {
          const data = await response.json();
          setEmpresas(data);
          if (data.length > 0) {
            setSelectedEmpresaId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Error al cargar empresas:", err);
      }
    };
    fetchEmpresas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !email.trim() || !rfc.trim() || !password.trim() || !confirmPassword.trim() || !selectedEmpresaId || !selectedRole) {
      setError("Por favor completa todos los campos.");
      return;
    }

    if (username.length < 6) {
      setError("El nombre de usuario debe tener al menos 6 caracteres.");
      return;
    }

    // Corporate email restriction check
    if (!email.toLowerCase().endsWith("@grupo-sacmag.com.mx")) {
      setError("El correo electrónico debe pertenecer al dominio corporativo @grupo-sacmag.com.mx");
      return;
    }

    // RFC validation check
    const rfcRegex = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/i;
    if (!rfcRegex.test(rfc)) {
      setError("El RFC debe tener un formato válido con homoclave.");
      return;
    }

    // Password strength check (min 10 chars, 1 upper, 1 lower, 1 number, 1 special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?\":{}|<>]).{10,}$/;
    if (!passwordRegex.test(password)) {
      setError("La contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula, un número y un carácter especial.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await register(username, email, password, rfc.toUpperCase(), selectedEmpresaId, selectedRole);
      // AuthProvider register auto-logs the user in, so we direct based on role
      if (selectedRole === "ADMIN") {
        router.push("/dashboard");
      } else {
        router.push("/xmlends/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Error al crear la cuenta. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 right-1/4 translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-600/5 blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 -translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl" />

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Crear una Cuenta
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Regístrate para comenzar a usar la plataforma
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xl p-8 space-y-6">
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm text-center">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                Nombre de usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm transition-colors"
                placeholder="usuario123"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm transition-colors"
                placeholder="ejemplo@grupo-sacmag.com.mx"
              />
            </div>

            <div>
              <label htmlFor="rfc" className="block text-sm font-medium text-slate-700">
                RFC (con homoclave)
              </label>
              <input
                id="rfc"
                name="rfc"
                type="text"
                required
                value={rfc}
                onChange={(e) => setRfc(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm transition-colors uppercase"
                placeholder="XAXX010101000"
              />
            </div>

            <div>
              <label htmlFor="empresa" className="block text-sm font-medium text-slate-700">
                Empresa
              </label>
              <select
                id="empresa"
                name="empresa"
                required
                value={selectedEmpresaId}
                onChange={(e) => setSelectedEmpresaId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm transition-colors cursor-pointer"
              >
                <option value="" disabled>Selecciona tu empresa</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} - {emp.razonSocial}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-700">
                Tipo de Usuario / Rol
              </label>
              <select
                id="role"
                name="role"
                required
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-slate-800 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm transition-colors cursor-pointer"
              >
                <option value="USER_REMB">Usuario Contador</option>
                <option value="USER_SUP_LEC">Usuario Lectura</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm transition-colors"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm transition-colors"
                placeholder="Repite la contraseña"
              />
            </div>

            <button
              type="submit"
              disabled={loading || authLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all hover:scale-[1.01] active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creando cuenta...
                </span>
              ) : (
                "Crear Cuenta"
              )}
            </button>
          </form>

          <div className="text-center text-sm">
            <span className="text-slate-500">¿Ya tienes una cuenta? </span>
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
