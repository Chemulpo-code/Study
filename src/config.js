// Централизованная конфигурация API для работы локально и на сервере/Portainer
export const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5005' : '');
