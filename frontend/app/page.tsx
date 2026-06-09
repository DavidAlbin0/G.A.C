"use client";

import Link from "next/link";
import { useAuth } from "../components/AuthProvider";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col flex-1 bg-slate-50 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] rounded-full bg-blue-600/5 blur-3xl" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-3xl" />

      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-4 pt-20 pb-16 text-center sm:px-6 lg:px-8 space-y-8 z-10">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-slate-900 via-blue-900 to-blue-700 bg-clip-text text-transparent max-w-4xl mx-auto leading-[1.1]">
            Gestor de Administracion Contable (G.A.C)
          </h1>
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
            Plataforma web para la administración, almacenamiento e intercambio de archivos de tarifas y datos contables. Este sistema alimenta la base de datos central que consume la aplicación de escritorio <strong>Actualitodo</strong>, la cual automatiza a distancia la actualización de ejecutables legacy sin necesidad de mantenimiento manual en cada equipo.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            user.roles && user.roles.includes("ADMIN") ? (
              <>
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  Dashboard de Archivos (GAC)
                </Link>
                <Link
                  href="/xmlends/admin"
                  className="w-full sm:w-auto flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  Panel XMLends Admin
                </Link>
                <Link
                  href="/profile"
                  className="w-full sm:w-auto flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-6 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Ver Perfil
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/xmlends/dashboard"
                  className="w-full sm:w-auto flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  Mis Reembolsos
                </Link>
                {user.roles && user.roles.includes("USER_REMB") && (
                  <Link
                    href="/xmlends/upload"
                    className="w-full sm:w-auto flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    Cargar XML / PDF
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="w-full sm:w-auto flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-6 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Ver Perfil
                </Link>
              </>
            )
          ) : (
            <>
              <Link
                href="/login"
                className="w-full sm:w-auto flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 px-8 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:scale-[1.02] cursor-pointer"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-8 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Crear Cuenta
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-slate-200 z-10">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-2xl font-bold text-slate-900">¿Cómo funciona el ecosistema?</h2>
          <p className="text-sm text-slate-500">Integración fluida entre la plataforma web G.A.C y la aplicación Actualitodo</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 */}
          <div className="bg-white border border-slate-200/80 hover:border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] space-y-3">
            <div className="inline-flex p-3 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">Carga de Archivos</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Carga ágil y centralizada de archivos de tarifas y datos contables mediante nuestra interfaz web intuitiva.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-200/80 hover:border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] space-y-3">
            <div className="inline-flex p-3 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m0-3.75v3.75m10.5 0v3.75m-10.5-3.75v3.75m10.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">Persistencia Segura</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tus archivos y metadatos se guardan de forma segura en MongoDB, asegurando alta disponibilidad de consulta.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-200/80 hover:border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] space-y-3">
            <div className="inline-flex p-3 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.662l-2.412-7.839a2.25 2.25 0 00-2.15-1.588H15M9 3.75a2.25 2.25 0 014.5 0M9 3.75h6m-6 9.75h6m-6 3h6" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">Alimentación de Actualitodo</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Los archivos subidos se distribuyen y alimentan la base de datos de consulta de la aplicación de escritorio Actualitodo.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-slate-200/80 hover:border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] space-y-3">
            <div className="inline-flex p-3 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.649 8.36M15.59 14.37a14.98 14.98 0 01-6.16 12.12A14.98 14.98 0 013.796 14.37M9.43 8.374a6 6 0 00-5.839 7.382v-4.8m5.839-2.582a14.98 14.98 0 00-6.13-12.14A14.98 14.98 0 0115.57 8.374" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">Actualización Legacy</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Actualitodo actualiza los ejecutables antiguos de forma remota y a distancia en todas las computadoras sin intervención manual.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
