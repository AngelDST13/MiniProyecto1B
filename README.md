# Bancada · Gestión de órdenes de servicio técnico

Sistema empresarial para un **taller de computación y tecnología**: controla el ingreso de laptops, PCs y tarjetas gráficas para diagnóstico y reparación, gestiona a los clientes y registra los repuestos usados en cada servicio (descontando el stock automáticamente).

- **Back end:** Node.js + Express (ES Modules) · MySQL 8 · JWT + bcrypt
- **Front end:** React 19 + Vite + Tailwind CSS 4 · React Router
- **Alcance:** **20 CRUDs** y **21 tablas** en MySQL.

| Área | Módulos (CRUD) |
|---|---|
| Atención y servicio | Órdenes de servicio · Clientes · Citas · Cotizaciones · Seguimientos · Garantías |
| Compras e inventario | Repuestos · Proveedores · Compras · Herramientas |
| Personal y sedes | Técnicos · Especialidades · Sucursales |
| Finanzas | Pagos · Métodos de pago · Gastos · Categorías de gasto |
| Catálogos | Servicios · Marcas |
| Sistema | Usuarios |

## Modelo de datos

### Núcleo (órdenes, clientes y repuestos)

```mermaid
erDiagram
    CLIENTES ||--o{ ORDENES_SERVICIO : "deja equipos en"
    ORDENES_SERVICIO ||--o{ ORDEN_COMPONENTES : "usa"
    COMPONENTES_REPUESTO ||--o{ ORDEN_COMPONENTES : "se usa en"

    CLIENTES {
        int id PK
        varchar nombre
        varchar telefono
        varchar email UK
        varchar cedula UK
    }
    ORDENES_SERVICIO {
        int id PK
        int cliente_id FK
        enum tipo_equipo "Laptop | Desktop | GPU"
        varchar marca_modelo
        varchar serial
        text diagnostico
        enum estado "Recibido | En Diagnóstico | Reparado | Entregado"
        datetime fecha_ingreso
    }
    COMPONENTES_REPUESTO {
        int id PK
        varchar nombre
        enum categoria "RAM | SSD | GPU | Pantalla | Fuente"
        decimal precio_unitario
        int stock
    }
    ORDEN_COMPONENTES {
        int orden_id PK, FK
        int componente_id PK, FK
        int cantidad
        decimal precio_unitario "precio al momento de usarlo"
    }
    USUARIOS {
        int id PK
        varchar nombre
        varchar correo UK
        varchar password_hash "bcrypt"
        timestamp fecha_creacion
    }
```

### Módulo de Administración (16 tablas)

```mermaid
erDiagram
    ESPECIALIDADES ||--o{ TECNICOS : "agrupa"
    SUCURSALES ||--o{ TECNICOS : "emplea"
    SUCURSALES ||--o{ HERRAMIENTAS : "guarda"
    SUCURSALES ||--o{ CITAS : "recibe"
    SUCURSALES ||--o{ GASTOS : "registra"
    MARCAS ||--o{ HERRAMIENTAS : "fabrica"
    PROVEEDORES ||--o{ COMPRAS : "factura"
    CATEGORIAS_GASTO ||--o{ GASTOS : "clasifica"
    METODOS_PAGO ||--o{ PAGOS : "se usa en"
    CLIENTES ||--o{ CITAS : "agenda"
    ORDENES_SERVICIO ||--o{ PAGOS : "recibe"
    ORDENES_SERVICIO ||--o{ COTIZACIONES : "tiene"
    ORDENES_SERVICIO ||--o{ GARANTIAS : "cubre"
    ORDENES_SERVICIO ||--o{ SEGUIMIENTOS : "registra"
    TECNICOS ||--o{ SEGUIMIENTOS : "escribe"
```

Tablas sin relaciones salientes: `servicios` (catálogo de precios) y `usuarios` (cuentas del sistema).

**Reglas de negocio**

- No se puede eliminar un cliente con órdenes registradas ni un repuesto que ya se usó (responde `409`).
- Al agregar un repuesto a una orden se descuenta el stock dentro de una transacción. Si no alcanza, responde `409`.
- Al quitar un repuesto o eliminar una orden, las unidades regresan al inventario.
- No se puede eliminar ningún registro que otro use (una especialidad con técnicos, una orden con pagos, etc.). Responde `409` e indica qué registros lo impiden.
- Los campos únicos (cédula, RUC, número de factura, código de herramienta…) responden `409` si se repiten.
- Si una llave foránea apunta a un registro que no existe, responde `400`.
- En una garantía, la fecha de fin no puede ser anterior a la de inicio. Nadie puede eliminar su propia cuenta.

## Cómo funcionan los 17 CRUDs de Administración

Cada entidad nueva se **declara** en un archivo de `src/models/admin/` con su tabla, sus campos y tipos, las reglas de validación (obligatorio, longitud, único, patrón) y sus relaciones. Por ejemplo:

```js
// src/models/admin/tecnicos.js
{ clave: 'tecnicos', tabla: 'tecnicos', singular: 'Técnico', plural: 'Técnicos',
  campos: [
    { nombre: 'nombres', tipo: 'texto', requerido: true, min: 3, max: 100 },
    { nombre: 'cedula', tipo: 'cedula', requerido: true, unico: true },
    { nombre: 'especialidad_id', tipo: 'ref', ref: 'especialidades', requerido: true },
    ...
  ] }
```

Con esa definición, el **motor CRUD** genera todo lo demás:

| Capa | Archivo | Qué hace |
|---|---|---|
| Modelo | `src/models/crudModel.js` | Arma las consultas SQL parametrizadas y los `JOIN` para mostrar el texto de cada relación |
| Validación | `src/validators/crudValidator.js` | Valida cada campo según su tipo y descarta los que no están declarados |
| Controlador | `src/controllers/crudController.js` | Los 5 endpoints. Verifica únicos y llaves foráneas, cifra contraseñas y bloquea borrados con dependencias |
| Rutas | `src/routes/crudRoutes.js` | Monta `/api/<entidad>` detrás del middleware de autenticación |
| Frontend | `pages/AdminEntidad.jsx` | Lee el esquema desde `/api/admin/entidades` y dibuja la tabla y el formulario |

Agregar una entidad nueva requiere crear su tabla en SQL y un archivo de definición; no hay que repetir código.

## Estructura

```
MiniProyecto1/
├── .env.example            → variables del backend (copiar como .env)
├── database/
│   ├── schema.sql          → crea la BD completa (21 tablas) con datos de prueba
│   └── migrations/         → 002_usuarios.sql, 003_administracion.sql
├── postman/                → colección con todos los endpoints y casos 400/401/404/409
├── src/                    → BACKEND
│   ├── app.js / server.js
│   ├── config/             → env.js (valida variables), db.js (pool MySQL + transacciones)
│   ├── models/             → clienteModel, ordenModel, componenteModel, usuarioModel, crudModel
│   │   └── admin/          → definición de las 17 entidades de Administración
│   ├── controllers/        → un controlador por entidad + authController, crudController, adminController
│   ├── routes/             → rutas por entidad + authRoutes, crudRoutes, adminRoutes
│   ├── middlewares/        → authMiddleware (JWT), errorHandler, notFound
│   ├── validators/         → validación de entrada por entidad
│   └── utils/
└── frontend/               → FRONT END
    ├── .env.example        → VITE_API_URL
    └── src/
        ├── components/     → ui/, layout/, clientes/, ordenes/, componentes/, admin/, RutaProtegida.jsx
        ├── context/        → AuthContext.jsx (token y usuario), ToastContext.jsx
        ├── pages/          → Login, Registro, Panel, Ordenes, Clientes, Componentes,
        │                     Administracion (los 20 módulos), AdminEntidad (CRUD genérico)
        ├── services/       → api.js (token + errores) y un servicio por entidad
        ├── hooks/ · constants/ · utils/ · styles/
```

## Instalación y ejecución

**Requisitos:** Node.js 20 o superior y MySQL 8.

### 1. Base de datos

Abre MySQL Workbench, conéctate como `root` y ejecuta `database/schema.sql` completo (Ctrl+Shift+Enter).

> El script **borra y recrea** la base `taller_servicio_tecnico`. Si ya la tenías y quieres conservar los datos, ejecuta solo las migraciones que te falten, en orden: `002_usuarios.sql` y `003_administracion.sql`.

### 2. Backend (raíz del proyecto)

```bash
cp .env.example .env    # en Windows: copy .env.example .env
```

Completa `.env`:

| Variable | Ejemplo | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto de la API |
| `CORS_ORIGIN` | `http://localhost:5173` | URL del frontend |
| `DB_HOST` / `DB_PORT` | `localhost` / `3306` | Servidor MySQL |
| `DB_USER` / `DB_PASSWORD` | `root` / `tu-clave` | Credenciales MySQL |
| `DB_NAME` | `taller_servicio_tecnico` | Base de datos |
| `JWT_SECRET` | *(64+ caracteres aleatorios)* | Clave para firmar tokens |
| `JWT_EXPIRES_IN` | `8h` | Duración del token |

Genera el `JWT_SECRET` con:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

```bash
npm install
npm run dev             # http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env    # VITE_API_URL=http://localhost:3000/api
npm install
npm run dev             # http://localhost:5173
```

### Todo con un solo comando

Si ya instalaste las dependencias de los dos proyectos, desde la raíz:

```bash
npm run dev:all         # backend (3000) + frontend (5173) juntos · Ctrl+C detiene ambos
```

**Usuario de demostración:** `demo@bancada.com` / `Demo12345`. En el login, el botón **"Usar cuenta"** la rellena. También puedes crear tu cuenta en `/registro`.

### Problemas comunes

| Síntoma | Solución |
|---|---|
| `El puerto 3000 ya está en uso` | El backend ya está encendido en otra terminal. Ábrelo en http://localhost:3000/health o cierra esa terminal |
| "No se pudo conectar con el servidor" en el login | El backend no está encendido, o la URL del frontend no está en `CORS_ORIGIN` del `.env` |
| `No se pudo conectar a MySQL` | Inicia el servicio de MySQL (`services.msc`) y revisa `DB_USER` y `DB_PASSWORD` |
| La cuenta demo no entra | Ejecuta `database/schema.sql` (o `migrations/002_usuarios.sql`), que es el que crea el usuario |

## API REST

Todas las rutas, excepto `register`, `login` y `/health`, requieren el encabezado `Authorization: Bearer <token>`. Sin un token válido responden `401 { "error": "No autorizado" }`.

### Autenticación

| Método | Ruta | Respuesta |
|---|---|---|
| POST | `/api/auth/register` | `201` usuario sin password · `400` correo en uso o datos inválidos |
| POST | `/api/auth/login` | `200 { token, usuario, expiresIn }` · `401` credenciales incorrectas |
| GET | `/api/auth/me` | `200` usuario del token · `401` |

### Entidades (`/api/clientes`, `/api/ordenes`, `/api/componentes`)

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/<entidad>` | `200 { total, data: [...] }` |
| GET | `/api/<entidad>/:id` | `200 { data }` · `404` |
| POST | `/api/<entidad>` | `201 { message, data }` · `400` validación |
| PUT | `/api/<entidad>/:id` | `200 { message, data }` · `400` · `404` |
| DELETE | `/api/<entidad>/:id` | `200 { message }` · `404` · `409` si tiene dependencias |

Filtros: `GET /api/ordenes?estado=Reparado&cliente_id=1`, `GET /api/componentes?categoria=SSD`.
Las órdenes incluyen el objeto `cliente` y `total_repuestos`. `GET /api/ordenes/:id` también incluye `componentes`.

### Rutas adicionales de órdenes

| Método | Ruta | Descripción |
|---|---|---|
| PATCH | `/api/ordenes/:id/estado` | Cambia solo el estado `{ "estado": "Reparado" }` |
| POST | `/api/ordenes/:id/componentes` | Agrega un repuesto `{ "componente_id": 2, "cantidad": 1 }` y descuenta stock (`409` si no alcanza) |
| DELETE | `/api/ordenes/:id/componentes/:componenteId` | Quita el repuesto y devuelve el stock |

### Administración (17 entidades con los mismos 5 endpoints)

`/api/sucursales`, `/api/especialidades`, `/api/tecnicos`, `/api/usuarios`, `/api/marcas`, `/api/servicios`, `/api/metodos-pago`, `/api/categorias-gasto`, `/api/proveedores`, `/api/compras`, `/api/herramientas`, `/api/citas`, `/api/cotizaciones`, `/api/seguimientos`, `/api/garantias`, `/api/pagos` y `/api/gastos`.

Cada relación se devuelve también como texto legible: `especialidad_id: 1` viene acompañado de `especialidad_id_etiqueta: "Microsoldadura"`.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/entidades` | Esquema de los 20 módulos (campos, tipos, reglas) y su cantidad de registros |
| GET | `/api/admin/opciones/:entidad` | `[{ id, etiqueta }]` para llenar los selectores de llaves foráneas |

### Formato de errores

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Datos de cliente inválidos", "details": { "email": "El email no tiene un formato válido" } } }
```

## Pruebas con Postman

Importa `postman/MiniProyecto1.postman_collection.json` y ejecútala completa con el **Runner**. El request "Login OK" guarda el token automáticamente y los de creación guardan los ids que usan los siguientes. Son 72 requests, que incluyen los casos `400`, `401`, `404` y `409` y los 17 CRUDs de Administración, y al final eliminan los datos que crearon.

## Decisiones de seguridad

- Las contraseñas se guardan con **bcrypt** (10 rondas) y nunca se devuelven en las respuestas.
- El **JWT** lleva solo el id del usuario (`sub`), se firma con HS256 y vence según `JWT_EXPIRES_IN`.
- En el login se compara siempre contra un hash, aunque el correo no exista, para no revelar qué correos están registrados.
- El token se guarda en `localStorage`, como permite la consigna. Es simple, pero un ataque XSS podría leerlo. En producción convendría una cookie `httpOnly` + `SameSite`. Si la API responde `401`, el frontend borra el token y vuelve al login.
- Todas las consultas SQL son parametrizadas. El `.env` está en `.gitignore`.
