// Determinar dinámicamente la URL base del backend/API Gateway en el cliente
const getApiBaseUrl = () => {
  // Si estamos del lado del servidor (SSR), usamos la variable de entorno o localhost
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:10100";
  }
  
  // Si estamos del lado del cliente (navegador):
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // Si la variable está definida y no es localhost, la usamos
  if (envUrl && !envUrl.includes("localhost")) {
    return envUrl;
  }
  
  // De lo contrario, usamos el protocolo y host actuales apuntando al puerto 8000 (Gateway)
  return `${window.location.protocol}//${window.location.hostname}:8000`;
};

export const API_BASE_URL = getApiBaseUrl();


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
