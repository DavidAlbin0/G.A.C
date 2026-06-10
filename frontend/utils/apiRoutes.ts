// URL base de la API (apunta al API Gateway en puerto 8000, o por defecto a Spring Boot en 10100)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10100";

export const API_ROUTES = {
  // Servicio 1: Autenticación (Spring Boot)
  auth: {
    me: `${API_BASE_URL}/api/auth/me`,
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    changePassword: `${API_BASE_URL}/api/auth/change-password`,
    empresas: `${API_BASE_URL}/api/auth/empresas`,
  },
  
  // Servicio 2: Manejo de Archivos (Spring Boot)
  files: {
    list: `${API_BASE_URL}/api/files`,
    upload: `${API_BASE_URL}/api/files/upload`,
    byId: (id: string) => `${API_BASE_URL}/api/files/${id}`,
    view: (id: string) => `${API_BASE_URL}/api/files/${id}/view`,
    rename: (id: string) => `${API_BASE_URL}/api/files/${id}/rename`,
    replace: (id: string) => `${API_BASE_URL}/api/files/${id}/replace`,
  },

  // ==========================================
  // Ejemplo de futuros Microservicios
  // ==========================================
  /*
  otroServicio: {
    obtenerDatos: `${API_BASE_URL}/api/otro/datos`,
    crearRegistro: `${API_BASE_URL}/api/otro/crear`,
  }
  */
};
