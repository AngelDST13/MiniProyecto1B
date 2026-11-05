// Ejecuta una carga asíncrona (llamada a la API) y expone { datos, error, cargando, recargar, setDatos }.
//
// Sigue el patrón recomendado por React para pedir datos en un efecto:
// - el estado solo se actualiza dentro de los callbacks de la promesa (nunca de forma síncrona);
// - si el componente se desmonta o la carga cambia antes de responder, la respuesta vieja se ignora.
//
// "cargar" debe ser estable (envuelta en useCallback o definida fuera del componente).
import { useCallback, useEffect, useState } from 'react';

export const useCargaAsync = (cargar) => {
  const [estado, setEstado] = useState({ datos: null, error: null, cargando: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    cargar()
      .then((datos) => vigente && setEstado({ datos, error: null, cargando: false }))
      .catch((err) => vigente && setEstado((previo) => ({ ...previo, error: err.message, cargando: false })));
    return () => {
      vigente = false;
    };
  }, [cargar, version]);

  // Vuelve a ejecutar la carga (por ejemplo, después de crear o eliminar un registro).
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  // Permite actualizar los datos localmente sin volver a pedirlos (acepta valor o función).
  const setDatos = useCallback(
    (valor) =>
      setEstado((previo) => ({ ...previo, datos: typeof valor === 'function' ? valor(previo.datos) : valor })),
    [],
  );

  return { ...estado, recargar, setDatos };
};
