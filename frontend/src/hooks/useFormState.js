// Estado de un formulario: valores, errores por campo (del backend) y envío.
import { useCallback, useState } from 'react';

export const useFormState = (valoresIniciales) => {
  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  // onChange para inputs: <input name="nombre" onChange={cambiar} />
  const cambiar = useCallback((evento) => {
    const { name, value } = evento.target;
    setValores((actuales) => ({ ...actuales, [name]: value }));
    setErrores((actuales) => (actuales[name] ? { ...actuales, [name]: undefined } : actuales));
  }, []);

  const asignar = useCallback((name, value) => {
    setValores((actuales) => ({ ...actuales, [name]: value }));
    setErrores((actuales) => (actuales[name] ? { ...actuales, [name]: undefined } : actuales));
  }, []);

  /**
   * Envuelve el submit: muestra los errores por campo que devuelve la API
   * y un error general en errores._form si no hay detalle.
   */
  const enviar = (accion) => async (evento) => {
    evento.preventDefault();
    setEnviando(true);
    setErrores({});
    try {
      await accion(valores);
    } catch (error) {
      // _codigo permite reaccionar a casos concretos (por ejemplo CORREO_NO_VERIFICADO)
      setErrores(error.details ? { ...error.details, _form: error.message, _codigo: error.code } : { _form: error.message, _codigo: error.code });
    } finally {
      setEnviando(false);
    }
  };

  return { valores, errores, enviando, cambiar, asignar, enviar, setValores };
};
