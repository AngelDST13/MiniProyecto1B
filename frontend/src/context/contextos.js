// Objetos de contexto de la app. Viven en un archivo aparte de sus Providers
// para que el recargado en caliente (Fast Refresh) de Vite funcione bien.
import { createContext } from 'react';

export const AuthContext = createContext(null);
export const ToastContext = createContext(null);
export const CarritoContext = createContext(null);
