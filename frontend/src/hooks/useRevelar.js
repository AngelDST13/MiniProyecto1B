// Revela los elementos con la clase "revelar" cuando entran en pantalla.
// Respeta prefers-reduced-motion (el CSS los muestra sin animación).
import { useEffect } from 'react';

export const useRevelar = () => {
  useEffect(() => {
    const elementos = document.querySelectorAll('.revelar');
    const mostrar = (elemento) => { elemento.dataset.visible = 'true'; };

    if (!('IntersectionObserver' in window)) {
      elementos.forEach(mostrar);
      return undefined;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            mostrar(entrada.target);
            observador.unobserve(entrada.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    elementos.forEach((elemento) => observador.observe(elemento));
    return () => observador.disconnect();
  }, []);
};
