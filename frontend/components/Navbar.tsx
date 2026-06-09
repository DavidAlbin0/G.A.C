"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-105">
                G
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 bg-clip-text text-transparent">
                G.A.C
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive("/")
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:text-blue-600 hover:bg-slate-100/50"
                  }`}
              >
                Inicio
              </Link>
              {user && (
                <>
                  {user.roles && (user.roles.includes("ADMIN") || user.roles.includes("ADMIN_GEN")) && (
                    <>
                      <Link
                        href="/dashboard"
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive("/dashboard")
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:text-blue-600 hover:bg-slate-100/50"
                          }`}
                      >
                        Dashboard
                      </Link>

                      {/* Dropdown Menu Archivos */}
                      <div className="relative group">
                        <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-100/50 transition-colors cursor-pointer">
                          <span>Archivos</span>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400 transition-transform group-hover:rotate-180">
                            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <div className="absolute left-0 mt-1 w-40 rounded-xl bg-white border border-slate-200 p-1.5 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          <Link href="/files/Tarifas" className="block px-3.5 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 transition-colors">
                            Tarifas
                          </Link>
                          <Link href="/files/Indices10" className="block px-3.5 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 transition-colors">
                            Indices10
                          </Link>
                          <Link href="/files/IMAGE" className="block px-3.5 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 transition-colors">
                            Archivos IMAGE
                          </Link>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Dropdown Menu XMLends (Reembolsos) */}
                  <div className="relative group">
                    <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-100/50 transition-colors cursor-pointer">
                      <span>Reembolsos</span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400 transition-transform group-hover:rotate-180">
                        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div className="absolute left-0 mt-1 w-44 rounded-xl bg-white border border-slate-200 p-1.5 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      {user.roles && (user.roles.includes("USER_REMB") || user.roles.includes("USER_SUP_LEC")) && !user.roles.includes("ADMIN") && !user.roles.includes("ADMIN_GEN") && (
                        <Link href="/xmlends/dashboard" className="block px-3.5 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 transition-colors">
                          Mis Reembolsos
                        </Link>
                      )}
                      {user.roles && user.roles.includes("USER_REMB") && !user.roles.includes("ADMIN") && !user.roles.includes("ADMIN_GEN") && (
                        <Link href="/xmlends/upload" className="block px-3.5 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 transition-colors">
                          Cargar XML / PDF
                        </Link>
                      )}
                      {user.roles && (user.roles.includes("ADMIN") || user.roles.includes("ADMIN_GEN")) && (
                        <Link href="/xmlends/admin" className="block px-3.5 py-2 text-xs font-bold rounded-lg text-indigo-600 hover:text-indigo-750 hover:bg-indigo-50/50 border-t border-slate-150 transition-colors mt-1 pt-1.5">
                          Panel Administrador
                        </Link>
                      )}
                    </div>
                  </div>

                  <Link
                    href="/profile"
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive("/profile")
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:text-blue-600 hover:bg-slate-100/50"
                      }`}
                  >
                    Perfil
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  {user.username}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 rounded-lg bg-slate-100 border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900 hover:bg-slate-200/60 cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                    />
                  </svg>
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:text-blue-600"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all hover:scale-[1.02]"
                >
                  Crear Cuenta
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
