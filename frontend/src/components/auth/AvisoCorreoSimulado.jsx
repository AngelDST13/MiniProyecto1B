// Aviso del modo de prueba: el backend no tiene Gmail configurado y el correo no salió.
export const AvisoCorreoSimulado = ({ visible }) =>
  visible ? (
    <p className="mt-4 rounded-xl border border-st-recibido/30 bg-st-recibido-soft px-3.5 py-2.5 text-[13px] text-st-recibido">
      <strong>Modo de prueba:</strong> el envío de correos aún no está configurado, así que el mensaje no salió. Un
      administrador puede verlo en <em>Gestión → Automatización → Correos</em>.
    </p>
  ) : null;
