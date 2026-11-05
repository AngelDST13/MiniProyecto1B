// A dónde va cada usuario al iniciar sesión según su rol.
export const PERSONAL = ['admin', 'tecnico'];

export const esPersonal = (usuario) => PERSONAL.includes(usuario?.rol);

export const rutaInicio = (usuario) => {
  if (!usuario) return '/login';
  if (usuario.rol === 'cliente') return usuario.perfil_completo ? '/mi-cuenta' : '/completar-perfil';
  return usuario.rol === 'admin' ? '/gestion' : '/panel';
};

export const NOMBRE_ROL = { admin: 'Administrador', tecnico: 'Técnico', cliente: 'Cliente' };
