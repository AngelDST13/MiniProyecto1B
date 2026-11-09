# Códigos de estado HTTP de la API

Los errores responden con el formato `{ "error": { "code", "message", "details" } }`. La excepción es el 401 de una ruta protegida, que responde `{ "error": "No autorizado" }`.

Para comprobarlos todos, con MySQL encendido, ejecuta `npm run test:estados`.

## 2xx: éxito

| Código | Significado | Ejemplo |
| --- | --- | --- |
| 200 | OK | Listar, ver, actualizar o eliminar un registro |
| 201 | Creado | `POST /api/clientes`, `POST /api/auth/register` |

## 3xx: redirección

| Código | Significado | Ejemplo |
| --- | --- | --- |
| 301 | Movido permanentemente | `GET /api/tienda/producto/:slug` lleva a `/api/tienda/productos/:slug` |
| 302 | Redirección temporal | `GET /` lleva a `/health` |
| 304 | Sin cambios | `GET /api/tienda/catalogo` con `If-None-Match` y el catálogo igual |
| 308 | Movido permanentemente, conserva método y cuerpo | `POST /api/auth/iniciar-sesion` lleva a `/api/auth/login` |

## 4xx: error del cliente

| Código | Significado | Cuándo ocurre |
| --- | --- | --- |
| 400 | Petición inválida | Falla una validación, el JSON está mal formado o la URL está mal codificada |
| 401 | No autenticado | Falta el token, no es válido o venció (incluye `WWW-Authenticate: Bearer`) |
| 403 | Sin permiso | El rol no alcanza, o el correo no está confirmado |
| 404 | No encontrado | El registro o la ruta no existen |
| 405 | Método no permitido | La ruta existe con otro método (incluye `Allow`) |
| 409 | Conflicto | Dato duplicado, registro con dependencias o cambio de estado imposible |
| 413 | Contenido demasiado grande | El cuerpo supera 100 KB |
| 415 | Tipo de contenido no soportado | El cuerpo no es `application/json` |
| 422 | No procesable | La IA rechaza procesar la solicitud |
| 423 | Bloqueado | Cuenta bloqueada 15 minutos por intentos fallidos |
| 429 | Demasiadas peticiones | Se superó un límite por usuario (incluye `Retry-After`) |

## 5xx: error del servidor

| Código | Significado | Cuándo ocurre |
| --- | --- | --- |
| 500 | Error interno | Error no previsto; en producción no se exponen detalles |
| 501 | No implementado | Método HTTP que la API no maneja, como `PROPFIND` |
| 502 | Puerta de enlace incorrecta | El servicio de IA o el correo respondieron con un error |
| 503 | Servicio no disponible | La base de datos no responde o la IA no tiene saldo (incluye `Retry-After`) |
| 504 | Tiempo agotado | Una petición superó `SOLICITUD_TIMEOUT_MS` (120 s por defecto) o la IA no respondió a tiempo |
