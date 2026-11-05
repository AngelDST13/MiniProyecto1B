// Carga una lista desde la API y expone estado de carga, error y recarga.
// "fetcher" debe ser una función estable (por ejemplo clienteService.list).
import { useCallback } from 'react';
import { useCargaAsync } from './useCargaAsync.js';

export const useCollection = (fetcher) => {
  const cargarLista = useCallback(async () => (await fetcher()).data, [fetcher]);
  const { datos, error, cargando, recargar, setDatos } = useCargaAsync(cargarLista);

  return { items: datos ?? [], setItems: setDatos, cargando, error, recargar };
};
