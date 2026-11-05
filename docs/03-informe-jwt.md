# Informe de investigación: aplicación del token JWT

**Proyecto:** Bancada · Mini Proyecto 1, Día 2

Este informe cubre los puntos de la investigación obligatoria del Día 2: qué es un JWT, cómo se genera y valida en Node.js, cómo se maneja su expiración, dónde guardarlo en React, cómo se protegen las rutas y qué buenas prácticas de seguridad se aplicaron. Al final se resume la decisión tomada y se listan las fuentes.

> **Nota para el autor:** este es un borrador basado en la implementación real del proyecto. Revísalo, ajústalo con tus palabras y valida cada fuente antes de entregarlo.

---

## 1. Qué es un JWT

Un **JSON Web Token** (RFC 7519) es una forma compacta de transmitir **afirmaciones** (*claims*) entre dos partes. Por ejemplo: "este usuario es el número 1 y su sesión vence a las 18:00". El servidor lo **firma**, y por eso puede comprobar después que nadie lo modificó.

### Estructura

Un JWT tiene tres partes en Base64URL, separadas por puntos: `HEADER.PAYLOAD.FIRMA`

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 . eyJzdWIiOiIxIiwiaWF0IjoxNzkzODg5ODQzLCJleHAiOjE3OTM5MTg2NDN9 . 0OinTfAQ56hW...
```

| Parte | Contenido decodificado (ejemplo real del proyecto) | Para qué sirve |
| --- | --- | --- |
| **Header** | `{ "alg": "HS256", "typ": "JWT" }` | Indica el algoritmo de firma |
| **Payload** | `{ "sub": "1", "iat": 1793889843, "exp": 1793918643 }` | Las afirmaciones: `sub` = id del usuario, `iat` = emitido en, `exp` = vence en |
| **Firma** | `HMAC-SHA256(header + "." + payload, JWT_SECRET)` | Prueba que el token lo emitió el servidor y no fue alterado |

**Importante:** el payload **no está cifrado**, solo codificado. Cualquiera puede leerlo pegándolo en jwt.io. Por eso nunca debe llevar contraseñas ni datos sensibles.

### Firma y verificación (HS256)

- **Firmar:** el servidor calcula un HMAC-SHA256 del header y el payload usando una **clave secreta** que solo él conoce (`JWT_SECRET`).
- **Verificar:** cuando el token vuelve, el servidor recalcula la firma con la misma clave. Si no coincide, el token fue alterado o lo firmó otra clave y se rechaza. También se revisa que no haya pasado la fecha `exp`.

HS256 usa una sola clave (simétrica). Es lo adecuado cuando el mismo servidor emite y verifica los tokens, como en este proyecto. Los algoritmos asimétricos (RS256, ES256) se usan cuando varios servicios deben verificar sin poder emitir.

## 2. Generación y validación en Node.js con Express

Se usa la librería **`jsonwebtoken`**. Implementación en [`src/utils/jwt.js`](../src/utils/jwt.js):

```js
const ALGORITMO = 'HS256';

export const firmarToken = (usuario) =>
  jwt.sign({ sub: String(usuario.id) }, env.jwt.secret, {
    algorithm: ALGORITMO,
    expiresIn: env.jwt.expiresIn, // '8h'
  });

export const verificarToken = (token) =>
  jwt.verify(token, env.jwt.secret, { algorithms: [ALGORITMO] });
```

Decisiones:

- **Payload mínimo:** solo `sub` (id). El nombre y el correo se consultan en la base con `GET /api/auth/me`, así nunca quedan desactualizados dentro del token.
- **`algorithms: ['HS256']` en la verificación:** evita ataques en los que alguien envía un token con `"alg": "none"` o con otro algoritmo para saltarse la firma.
- **Login** ([`authController.js`](../src/controllers/authController.js)): se compara la contraseña con `bcrypt.compare`. Si es correcta, responde `200 { token, usuario, expiresIn }`. Si no, responde `401` con el mismo mensaje exista o no el correo, y el tiempo de respuesta también es el mismo (se compara contra un hash "señuelo"). Así no se revela qué correos están registrados.

## 3. Expiración, renovación y qué hacer cuando vence

- **Expiración:** el token vence a las **8 horas** (`JWT_EXPIRES_IN=8h`), que equivale a una jornada de trabajo del taller. Un token robado deja de servir al terminar ese tiempo.
- **Refresh token:** es un segundo token de larga duración, normalmente guardado en una cookie `httpOnly`, que sirve solo para pedir un nuevo token de acceso de corta duración (por ejemplo, 15 minutos) sin volver a escribir la contraseña. Permite sesiones largas con tokens de acceso muy cortos, y se puede revocar desde el servidor.
- **Decisión del proyecto:** **no** se implementó refresh token. La consigna no lo exige, y para una jornada de 8 h basta con iniciar sesión una vez. Queda como mejora futura.
- **Cuando vence:** cualquier petición responde `401 { "error": "No autorizado" }`. El cliente HTTP del frontend ([`services/api.js`](../frontend/src/services/api.js)) detecta ese 401, **borra el token**, avisa al `AuthContext` y la app regresa al login con el mensaje *"Tu sesión venció"*.

## 4. Dónde guardar el token en React

| Opción | Ventajas | Riesgos |
| --- | --- | --- |
| **localStorage** | Simple. Sobrevive a recargar y cerrar el navegador | Si hay una vulnerabilidad **XSS**, un script malicioso puede leer el token y robarlo |
| **sessionStorage** | Se borra al cerrar la pestaña | Mismo riesgo de **XSS**. La sesión no se comparte entre pestañas |
| **Cookie `httpOnly` + `Secure` + `SameSite`** | JavaScript **no puede leerla**, así que un XSS no roba el token | El navegador la envía sola, lo que abre la puerta a **CSRF** (se mitiga con `SameSite=Strict/Lax` o tokens anti-CSRF). Requiere configurar CORS con credenciales |
| **Memoria (estado de React)** | No lo alcanza un script externo persistente | Se pierde al recargar la página. Normalmente se combina con un refresh token en cookie |

**Decisión del proyecto: `localStorage`**, que es lo que permite y sugiere la consigna. Mitigaciones aplicadas contra XSS:

- React escapa todo el texto que muestra y el proyecto **no usa** `dangerouslySetInnerHTML`.
- No se cargan scripts de terceros. Solo se usan fuentes de Google.
- El token dura poco (8 h) y no lleva datos sensibles.
- El acceso a `localStorage` está envuelto en `try/catch`, porque el navegador puede bloquearlo.

Para producción se recomienda migrar a una **cookie `httpOnly; Secure; SameSite=Strict`** con refresh token.

## 5. Middleware que protege las rutas y envío desde el frontend

**Backend** ([`src/middlewares/authMiddleware.js`](../src/middlewares/authMiddleware.js)):

```js
export const authMiddleware = (req, res, next) => {
  const [tipo, token] = (req.headers.authorization ?? '').split(' ');
  if (tipo !== 'Bearer' || !token) return res.status(401).json({ error: 'No autorizado' });
  try {
    req.usuarioId = Number(verificarToken(token).sub);
    return next();
  } catch {
    return res.status(401).json({ error: 'No autorizado' });
  }
};
```

En [`src/routes/index.js`](../src/routes/index.js), todas las rutas de entidades se montan detrás de este middleware. Solo `register` y `login` son públicas.

**Frontend:**

1. `api.js` agrega `Authorization: Bearer <token>` a **todas** las peticiones protegidas.
2. `AuthContext.jsx` guarda el usuario actual y expone `login`, `register` y `logout`. Al cargar la app, valida el token guardado con `GET /api/auth/me`.
3. `RutaProtegida.jsx` envuelve las páginas privadas. Sin sesión redirige a `/login` y, al entrar, regresa a la página que se pidió.
4. **Cerrar sesión** borra el token y redirige al login.

## 6. Buenas prácticas de seguridad aplicadas

| Práctica | Cómo se aplicó |
| --- | --- |
| Clave secreta fuerte y fuera del código | `JWT_SECRET` aleatorio de 96 caracteres hexadecimales en `.env`. El servidor **no arranca** si mide menos de 32. `.env` está en `.gitignore` y se sube solo `.env.example` |
| Nada sensible en el payload | Solo `sub`, `iat` y `exp` |
| Algoritmo fijo al verificar | `algorithms: ['HS256']` |
| Expiración obligatoria | `expiresIn: '8h'` |
| Contraseñas | `bcrypt` con 10 rondas, mínimo 8 caracteres. Nunca se devuelven en las respuestas |
| No filtrar información | Mensaje genérico en login fallido. Errores 500 sin trazas en producción |
| HTTPS | En desarrollo se usa HTTP local. **En producción es obligatorio HTTPS**, porque sin él el token viaja en texto plano y puede interceptarse |
| No registrar tokens | Los logs del servidor no imprimen encabezados ni tokens |
| CORS restringido | Solo los orígenes del frontend definidos en `CORS_ORIGIN` |

## 7. Decisión final

| Tema | Decisión |
| --- | --- |
| Algoritmo | HS256 con `JWT_SECRET` en `.env` |
| Duración | 8 horas, sin refresh token |
| Payload | `{ sub }` + `iat` + `exp` |
| Almacenamiento | `localStorage`, con las mitigaciones contra XSS descritas |
| Envío | Encabezado `Authorization: Bearer <token>` desde un cliente HTTP central |
| Al vencer | `401` → se borra el token → login con aviso de sesión vencida |
| Mejoras futuras | Cookie `httpOnly` + refresh token, límite de intentos (*rate limit*) en el login y HTTPS en el despliegue |

## Fuentes consultadas

1. Jones, M., Bradley, J., Sakimura, N. (2015). *RFC 7519: JSON Web Token (JWT)*. IETF. <https://datatracker.ietf.org/doc/html/rfc7519>
2. Sheffer, Y., Hardt, D., Jones, M. (2020). *RFC 8725: JSON Web Token Best Current Practices*. IETF. <https://datatracker.ietf.org/doc/html/rfc8725>
3. Auth0. *Introduction to JSON Web Tokens*. <https://jwt.io/introduction>
4. Auth0. *node-jsonwebtoken* (documentación de la librería). <https://github.com/auth0/node-jsonwebtoken>
5. OWASP. *JSON Web Token Cheat Sheet*. <https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html>
6. OWASP. *HTML5 Security Cheat Sheet: Local Storage*. <https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html>
7. OWASP. *Cross-Site Request Forgery Prevention Cheat Sheet*. <https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html>
8. MDN Web Docs. *Set-Cookie* (atributos `HttpOnly`, `Secure`, `SameSite`). <https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie>
