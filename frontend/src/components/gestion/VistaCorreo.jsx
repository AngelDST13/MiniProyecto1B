// Muestra el HTML de un correo dentro de un iframe aislado (sandbox): sin scripts y con los
// enlaces abriéndose en una pestaña nueva.
export const VistaCorreo = ({ html, titulo = 'Vista previa del correo' }) => (
  <iframe
    title={titulo}
    sandbox="allow-popups allow-popups-to-escape-sandbox"
    srcDoc={html.replace('<head>', '<head><base target="_blank">')}
    className="h-[60dvh] w-full rounded-2xl border border-line bg-paper"
  />
);
