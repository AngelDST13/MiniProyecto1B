// Carga una lista desde la API y expone estado de carga, error y recarga.
// "fetcher" debe ser una función estable (por ejemplo clienteService.list).
import { useCallback, useEffect, useState } from 'react';

export const useCollection = (fetcher) => {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const recargar = useCallback(async () => {
    setError(null);
    try {
      const respuesta = await fetcher();
      setItems(respuesta.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [fetcher]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { items, setItems, cargando, error, recargar };
};
