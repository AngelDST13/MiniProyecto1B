// Notificaciones: toast.exito(mensaje) · toast.error(mensaje) · toast.info(mensaje)
import { useContext } from 'react';
import { ToastContext } from '../context/contextos.js';

export const useToast = () => {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return contexto;
};
