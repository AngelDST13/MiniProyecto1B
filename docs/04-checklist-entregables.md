# Lista de verificación de entregables

Revisión contra las consignas de [`src/docs/`](../src/docs/) (Mini Proyecto 1, Día 1 y Día 2).

## Día 1: Modelado de datos e inicio del CRUD

| Entregable / requisito | Estado | Dónde |
| --- | --- | --- |
| Documento breve con el tema y su justificación empresarial | ✅ | [01-tema-y-justificacion.md](01-tema-y-justificacion.md) |
| Diagrama entidad-relación con atributos y relaciones | ✅ | [02-modelo-de-datos.md](02-modelo-de-datos.md) |
| Mínimo 3 entidades con al menos una relación | ✅ 20 entidades, 21 tablas | `database/schema.sql` |
| Estructura backend / frontend | ✅ (ver nota) | Backend en la raíz (`src/`), frontend en `frontend/` |
| API REST en Node.js (Express) que responde JSON | ✅ | `src/` |
| Endpoints de crear y listar probados en Postman | ✅ | `postman/` |
| Validaciones de campos obligatorios y tipos en el backend | ✅ | `src/validators/` |
| Persistencia en base de datos | ✅ MySQL 8 | `src/config/db.js` |

## Día 2: CRUDs completos y autenticación

| Entregable / requisito | Estado | Dónde |
| --- | --- | --- |
| Informe de investigación sobre el token, con fuentes | ✅ borrador, revisar antes de entregar | [03-informe-jwt.md](03-informe-jwt.md) |
| ER actualizado con la entidad Usuario | ✅ | [02-modelo-de-datos.md](02-modelo-de-datos.md) |
| 5 endpoints (crear, listar, ver, actualizar, eliminar) en todas las entidades | ✅ | 20 CRUDs |
| Relaciones: verificar que el registro referenciado exista (400/404) | ✅ | `crudController.js`, `ordenController.js` |
| Eliminar con dependencias responde 409 | ✅ | Todas las entidades |
| Valores únicos verificados (por ejemplo, correo de usuario) | ✅ | Responde 400 en el registro y 409 en los CRUDs |
| Usuario: id, nombre, correo único, password (mín. 8), fechaCreacion | ✅ | Tabla `usuarios` |
| Contraseñas cifradas con bcrypt, nunca devueltas | ✅ | `authController.js`, `crudController.js` |
| `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | ✅ | `src/routes/authRoutes.js` |
| JWT con expiración, clave en `.env` | ✅ 8 h | `src/utils/jwt.js` |
| Middleware Bearer → 401 `{ "error": "No autorizado" }` | ✅ | `src/middlewares/authMiddleware.js` |
| `.env` en `.gitignore` y `.env.example` en el repositorio | ✅ | Raíz y `frontend/` |
| Colección de Postman con casos 401, 404 y 400 | ✅ 72 requests | `postman/` |
| Front end: login, registro, rutas protegidas y cierre de sesión | ✅ | `frontend/src/pages/`, `RutaProtegida.jsx` |
| Front end: token en cada petición; 401 → borrar token y volver al login | ✅ | `frontend/src/services/api.js` |
| Una página por entidad con tabla, formularios y eliminar con confirmación | ✅ | Páginas propias + `AdminEntidad.jsx` |
| Selector (`<select>`) cargado desde la API en entidades relacionadas | ✅ | `/api/admin/opciones/:entidad` |
| README con instalación, `.env` y ejecución | ✅ | [`README.md`](../README.md) |

## Notas para la entrega

1. **Estructura de carpetas:** la consigna sugiere `mini-proyecto-1/backend/` y `mini-proyecto-1/frontend/`. Aquí el backend está en la raíz del repositorio por decisión del equipo. La separación entre backend y frontend se cumple, pero si el docente exige literalmente la carpeta `backend/`, hay que mover `src/`, `package.json`, `.env*` y `scripts/` a esa carpeta.
2. **Informe JWT:** es un borrador escrito a partir del código real. Revísalo, ajústalo con tus palabras y verifica las fuentes.
3. **Diagrama ER:** está en formato Mermaid. Si se pide como imagen, exportarlo desde <https://mermaid.live>.
