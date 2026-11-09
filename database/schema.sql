-- =====================================================================
-- Sistema de Gestión de Órdenes de Servicio Técnico
-- Script para MySQL 8 (ejecutar completo en MySQL Workbench: Ctrl+Shift+Enter)
-- Crea las 30 tablas del sistema con datos de prueba.
-- ADVERTENCIA: borra y vuelve a crear la base de datos (se pierden los datos).
-- =====================================================================

DROP DATABASE IF EXISTS taller_servicio_tecnico;
CREATE DATABASE taller_servicio_tecnico
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE taller_servicio_tecnico;

-- ---------------------------------------------------------------------
-- 1. Clientes
-- ---------------------------------------------------------------------
CREATE TABLE clientes (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  telefono    VARCHAR(20)  NOT NULL,
  email       VARCHAR(120) NOT NULL,
  cedula      VARCHAR(13)  NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_clientes_cedula UNIQUE (cedula),
  CONSTRAINT uq_clientes_email  UNIQUE (email)
);

-- ---------------------------------------------------------------------
-- 2. Órdenes de servicio (equipo que ingresa a reparación)
-- ---------------------------------------------------------------------
CREATE TABLE ordenes_servicio (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id     INT UNSIGNED NOT NULL,
  tipo_equipo    ENUM('Laptop', 'Desktop', 'GPU') NOT NULL,
  marca_modelo   VARCHAR(120) NOT NULL,
  serial         VARCHAR(80)  NOT NULL,
  diagnostico    TEXT NULL,
  estado         ENUM('Recibido', 'En Diagnóstico', 'Reparado', 'Entregado')
                 NOT NULL DEFAULT 'Recibido',
  fecha_ingreso  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- No se puede borrar un cliente que tiene órdenes registradas
  CONSTRAINT fk_ordenes_cliente FOREIGN KEY (cliente_id)
    REFERENCES clientes (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_ordenes_cliente (cliente_id),
  INDEX idx_ordenes_estado (estado)
);

-- ---------------------------------------------------------------------
-- 3. Componentes / repuestos (inventario)
-- ---------------------------------------------------------------------
CREATE TABLE componentes_repuesto (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre           VARCHAR(120) NOT NULL,
  categoria        ENUM('RAM', 'SSD', 'GPU', 'Pantalla', 'Fuente') NOT NULL,
  precio_unitario  DECIMAL(10, 2) NOT NULL,
  stock            INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_componentes_precio CHECK (precio_unitario >= 0),
  CONSTRAINT chk_componentes_stock  CHECK (stock >= 0)
);

-- ---------------------------------------------------------------------
-- 4. Repuestos usados en cada orden (relación muchos a muchos)
--    Guarda el precio al momento de usarlo, para que el historial
--    no cambie si luego sube el precio del repuesto.
-- ---------------------------------------------------------------------
CREATE TABLE orden_componentes (
  orden_id         INT UNSIGNED NOT NULL,
  componente_id    INT UNSIGNED NOT NULL,
  cantidad         INT NOT NULL DEFAULT 1,
  precio_unitario  DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (orden_id, componente_id),
  CONSTRAINT fk_oc_orden FOREIGN KEY (orden_id)
    REFERENCES ordenes_servicio (id) ON DELETE CASCADE,
  CONSTRAINT fk_oc_componente FOREIGN KEY (componente_id)
    REFERENCES componentes_repuesto (id) ON DELETE RESTRICT,
  CONSTRAINT chk_oc_cantidad CHECK (cantidad > 0),
  INDEX idx_oc_componente (componente_id)
);

-- ---------------------------------------------------------------------
-- 5. Usuarios (Día 2: autenticación). La contraseña se guarda cifrada (bcrypt).
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,
  correo          VARCHAR(120) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  fecha_creacion  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_usuarios_correo UNIQUE (correo)
);

-- =====================================================================
-- Datos de prueba
-- =====================================================================
INSERT INTO clientes (nombre, telefono, email, cedula) VALUES
  ('María Fernanda López', '0991234567', 'maria.lopez@correo.com', '0102030405'),
  ('Juan Carlos Torres',   '0987001122', 'juan.torres@correo.com', '0923456781');

INSERT INTO componentes_repuesto (nombre, categoria, precio_unitario, stock) VALUES
  ('Memoria RAM DDR4 16GB Kingston', 'RAM',      45.00, 20),
  ('SSD NVMe 1TB Samsung 980',       'SSD',      89.90, 12),
  ('Pantalla 15.6" FHD IPS',         'Pantalla', 120.00, 5),
  ('Fuente 650W 80+ Bronze',         'Fuente',   65.50, 8),
  ('NVIDIA RTX 4060 8GB',            'GPU',      329.99, 3);

INSERT INTO ordenes_servicio (cliente_id, tipo_equipo, marca_modelo, serial, diagnostico, estado) VALUES
  (1, 'Laptop',  'Lenovo IdeaPad 3', 'PF3K9X21', 'Pantalla rota, requiere reemplazo', 'En Diagnóstico'),
  (2, 'Desktop', 'PC Armada Ryzen 5', 'N/A-0001', NULL, 'Recibido');

INSERT INTO orden_componentes (orden_id, componente_id, cantidad, precio_unitario) VALUES
  (1, 3, 1, 120.00);

-- Usuario de demostración · correo: demo@bancada.com · contraseña: Demo12345
INSERT INTO usuarios (nombre, correo, password_hash) VALUES
  ('Técnico Demo', 'demo@bancada.com', '$2b$10$zPH4IV3CbYy0Dm2duCLFzeOJcgGH6N9Sqgh0C0EXc/VVA0/epjwX6');

-- Verificación rápida
SELECT * FROM clientes;


-- =====================================================================
-- 6 a 21. Módulo de Administración (16 tablas). También disponible como
--         migración independiente en migrations/003_administracion.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- Estructura organizacional y personal
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sucursales (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  ciudad      VARCHAR(80)  NOT NULL,
  direccion   VARCHAR(200) NOT NULL,
  telefono    VARCHAR(20)  NOT NULL,
  activa      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_sucursales_nombre UNIQUE (nombre)
);

CREATE TABLE IF NOT EXISTS especialidades (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(80)  NOT NULL,
  descripcion  VARCHAR(255) NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_especialidades_nombre UNIQUE (nombre)
);

CREATE TABLE IF NOT EXISTS tecnicos (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombres          VARCHAR(100) NOT NULL,
  cedula           VARCHAR(13)  NOT NULL,
  telefono         VARCHAR(20)  NOT NULL,
  email            VARCHAR(120) NOT NULL,
  especialidad_id  INT UNSIGNED NOT NULL,
  sucursal_id      INT UNSIGNED NULL,
  fecha_ingreso    DATE NOT NULL,
  activo           TINYINT(1) NOT NULL DEFAULT 1,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_tecnicos_cedula UNIQUE (cedula),
  CONSTRAINT uq_tecnicos_email UNIQUE (email),
  CONSTRAINT fk_tecnicos_especialidad FOREIGN KEY (especialidad_id) REFERENCES especialidades (id) ON DELETE RESTRICT,
  CONSTRAINT fk_tecnicos_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales (id) ON DELETE RESTRICT,
  INDEX idx_tecnicos_especialidad (especialidad_id),
  INDEX idx_tecnicos_sucursal (sucursal_id)
);

-- ---------------------------------------------------------------------
-- Catálogos
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marcas (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(80)  NOT NULL,
  pais_origen   VARCHAR(60)  NULL,
  sitio_web     VARCHAR(150) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_marcas_nombre UNIQUE (nombre)
);

CREATE TABLE IF NOT EXISTS servicios (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(120) NOT NULL,
  descripcion     VARCHAR(255) NULL,
  precio_base     DECIMAL(10, 2) NOT NULL,
  duracion_horas  DECIMAL(5, 2)  NOT NULL,
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_servicios_nombre UNIQUE (nombre),
  CONSTRAINT chk_servicios_precio CHECK (precio_base >= 0),
  CONSTRAINT chk_servicios_duracion CHECK (duracion_horas > 0)
);

CREATE TABLE IF NOT EXISTS metodos_pago (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(60)  NOT NULL,
  descripcion  VARCHAR(255) NULL,
  activo       TINYINT(1) NOT NULL DEFAULT 1,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_metodos_pago_nombre UNIQUE (nombre)
);

CREATE TABLE IF NOT EXISTS categorias_gasto (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(80)  NOT NULL,
  descripcion  VARCHAR(255) NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_categorias_gasto_nombre UNIQUE (nombre)
);

-- ---------------------------------------------------------------------
-- Compras e inventario de herramientas
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proveedores (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  razon_social  VARCHAR(150) NOT NULL,
  ruc           VARCHAR(13)  NOT NULL,
  contacto      VARCHAR(100) NULL,
  telefono      VARCHAR(20)  NOT NULL,
  email         VARCHAR(120) NULL,
  direccion     VARCHAR(200) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_proveedores_ruc UNIQUE (ruc)
);

CREATE TABLE IF NOT EXISTS compras (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  proveedor_id    INT UNSIGNED NOT NULL,
  numero_factura  VARCHAR(40)  NOT NULL,
  fecha_compra    DATE NOT NULL,
  total           DECIMAL(12, 2) NOT NULL,
  estado          ENUM('Pendiente', 'Recibida', 'Anulada') NOT NULL DEFAULT 'Pendiente',
  observaciones   VARCHAR(255) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_compras_factura UNIQUE (numero_factura),
  CONSTRAINT chk_compras_total CHECK (total >= 0),
  CONSTRAINT fk_compras_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores (id) ON DELETE RESTRICT,
  INDEX idx_compras_proveedor (proveedor_id)
);

CREATE TABLE IF NOT EXISTS herramientas (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre             VARCHAR(120) NOT NULL,
  codigo             VARCHAR(30)  NOT NULL,
  marca_id           INT UNSIGNED NULL,
  sucursal_id        INT UNSIGNED NULL,
  estado             ENUM('Operativa', 'En mantenimiento', 'Dañada') NOT NULL DEFAULT 'Operativa',
  fecha_adquisicion  DATE NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_herramientas_codigo UNIQUE (codigo),
  CONSTRAINT fk_herramientas_marca FOREIGN KEY (marca_id) REFERENCES marcas (id) ON DELETE RESTRICT,
  CONSTRAINT fk_herramientas_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales (id) ON DELETE RESTRICT,
  INDEX idx_herramientas_marca (marca_id),
  INDEX idx_herramientas_sucursal (sucursal_id)
);

-- ---------------------------------------------------------------------
-- Atención al cliente y seguimiento de órdenes
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS citas (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id   INT UNSIGNED NOT NULL,
  sucursal_id  INT UNSIGNED NULL,
  fecha_hora   DATETIME NOT NULL,
  motivo       VARCHAR(200) NOT NULL,
  estado       ENUM('Programada', 'Atendida', 'Cancelada') NOT NULL DEFAULT 'Programada',
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_citas_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE RESTRICT,
  CONSTRAINT fk_citas_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales (id) ON DELETE RESTRICT,
  INDEX idx_citas_cliente (cliente_id),
  INDEX idx_citas_sucursal (sucursal_id),
  INDEX idx_citas_fecha (fecha_hora)
);

CREATE TABLE IF NOT EXISTS cotizaciones (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  orden_id      INT UNSIGNED NOT NULL,
  descripcion   VARCHAR(255) NOT NULL,
  monto         DECIMAL(10, 2) NOT NULL,
  valida_hasta  DATE NOT NULL,
  estado        ENUM('Pendiente', 'Aprobada', 'Rechazada') NOT NULL DEFAULT 'Pendiente',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_cotizaciones_monto CHECK (monto >= 0),
  CONSTRAINT fk_cotizaciones_orden FOREIGN KEY (orden_id) REFERENCES ordenes_servicio (id) ON DELETE RESTRICT,
  INDEX idx_cotizaciones_orden (orden_id)
);

CREATE TABLE IF NOT EXISTS seguimientos (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  orden_id    INT UNSIGNED NOT NULL,
  tecnico_id  INT UNSIGNED NOT NULL,
  nota        TEXT NOT NULL,
  fecha       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_seguimientos_orden FOREIGN KEY (orden_id) REFERENCES ordenes_servicio (id) ON DELETE RESTRICT,
  CONSTRAINT fk_seguimientos_tecnico FOREIGN KEY (tecnico_id) REFERENCES tecnicos (id) ON DELETE RESTRICT,
  INDEX idx_seguimientos_orden (orden_id),
  INDEX idx_seguimientos_tecnico (tecnico_id)
);

CREATE TABLE IF NOT EXISTS garantias (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  orden_id      INT UNSIGNED NOT NULL,
  fecha_inicio  DATE NOT NULL,
  fecha_fin     DATE NOT NULL,
  cobertura     VARCHAR(255) NOT NULL,
  estado        ENUM('Vigente', 'Vencida', 'Anulada') NOT NULL DEFAULT 'Vigente',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_garantias_fechas CHECK (fecha_fin >= fecha_inicio),
  CONSTRAINT fk_garantias_orden FOREIGN KEY (orden_id) REFERENCES ordenes_servicio (id) ON DELETE RESTRICT,
  INDEX idx_garantias_orden (orden_id)
);

-- ---------------------------------------------------------------------
-- Finanzas
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pagos (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  orden_id        INT UNSIGNED NOT NULL,
  metodo_pago_id  INT UNSIGNED NOT NULL,
  monto           DECIMAL(10, 2) NOT NULL,
  fecha_pago      DATETIME NOT NULL,
  referencia      VARCHAR(80) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_pagos_monto CHECK (monto > 0),
  CONSTRAINT fk_pagos_orden FOREIGN KEY (orden_id) REFERENCES ordenes_servicio (id) ON DELETE RESTRICT,
  CONSTRAINT fk_pagos_metodo FOREIGN KEY (metodo_pago_id) REFERENCES metodos_pago (id) ON DELETE RESTRICT,
  INDEX idx_pagos_orden (orden_id),
  INDEX idx_pagos_metodo (metodo_pago_id)
);

CREATE TABLE IF NOT EXISTS gastos (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  concepto            VARCHAR(150) NOT NULL,
  categoria_gasto_id  INT UNSIGNED NOT NULL,
  sucursal_id         INT UNSIGNED NULL,
  monto               DECIMAL(10, 2) NOT NULL,
  fecha               DATE NOT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_gastos_monto CHECK (monto > 0),
  CONSTRAINT fk_gastos_categoria FOREIGN KEY (categoria_gasto_id) REFERENCES categorias_gasto (id) ON DELETE RESTRICT,
  CONSTRAINT fk_gastos_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales (id) ON DELETE RESTRICT,
  INDEX idx_gastos_categoria (categoria_gasto_id),
  INDEX idx_gastos_sucursal (sucursal_id)
);

-- =====================================================================
-- Datos de prueba (INSERT IGNORE: se puede ejecutar más de una vez)
-- =====================================================================
INSERT IGNORE INTO sucursales (id, nombre, ciudad, direccion, telefono, activa) VALUES
  (1, 'Matriz Centro', 'Quito', 'Av. 10 de Agosto N24-15 y Cordero', '022501234', 1),
  (2, 'Norte', 'Quito', 'Av. de la Prensa N58-120', '022409876', 1);

INSERT IGNORE INTO especialidades (id, nombre, descripcion) VALUES
  (1, 'Microsoldadura', 'Reparación de placas y componentes SMD'),
  (2, 'Software y sistemas', 'Instalación, virus y recuperación de datos'),
  (3, 'Hardware de escritorio', 'Ensamblaje, fuentes y tarjetas gráficas');

INSERT IGNORE INTO tecnicos (id, nombres, cedula, telefono, email, especialidad_id, sucursal_id, fecha_ingreso, activo) VALUES
  (1, 'Andrés Villacís', '1718293045', '0984455667', 'andres.villacis@bancada.com', 1, 1, '2024-03-01', 1),
  (2, 'Gabriela Torres', '1722334455', '0991237788', 'gabriela.torres@bancada.com', 2, 2, '2025-01-15', 1);

INSERT IGNORE INTO marcas (id, nombre, pais_origen, sitio_web) VALUES
  (1, 'Hakko', 'Japón', 'https://www.hakko.com'),
  (2, 'iFixit', 'Estados Unidos', 'https://www.ifixit.com'),
  (3, 'Fluke', 'Estados Unidos', 'https://www.fluke.com');

INSERT IGNORE INTO servicios (id, nombre, descripcion, precio_base, duracion_horas, activo) VALUES
  (1, 'Diagnóstico general', 'Revisión completa de hardware y software', 15.00, 1.00, 1),
  (2, 'Mantenimiento preventivo', 'Limpieza interna y cambio de pasta térmica', 35.00, 2.00, 1),
  (3, 'Formateo e instalación de sistema', 'Respaldo, instalación de SO y controladores', 30.00, 3.00, 1);

INSERT IGNORE INTO metodos_pago (id, nombre, descripcion, activo) VALUES
  (1, 'Efectivo', 'Pago en caja', 1),
  (2, 'Transferencia', 'Transferencia bancaria', 1),
  (3, 'Tarjeta', 'Débito o crédito con datáfono', 1);

INSERT IGNORE INTO categorias_gasto (id, nombre, descripcion) VALUES
  (1, 'Servicios básicos', 'Luz, agua, internet'),
  (2, 'Arriendo', 'Alquiler de locales'),
  (3, 'Insumos', 'Alcohol isopropílico, pasta térmica, estaño');

INSERT IGNORE INTO proveedores (id, razon_social, ruc, contacto, telefono, email, direccion) VALUES
  (1, 'Tecnoimport S.A.', '1790012345001', 'Paola Mena', '022345678', 'ventas@tecnoimport.ec', 'Av. Amazonas y Colón'),
  (2, 'Repuestos Digitales Cía. Ltda.', '1791234567001', 'Luis Cárdenas', '0987766554', 'pedidos@repdigitales.ec', 'Calle Guayaquil 45-12');

INSERT IGNORE INTO compras (id, proveedor_id, numero_factura, fecha_compra, total, estado, observaciones) VALUES
  (1, 1, '001-002-000004512', '2026-10-28', 845.50, 'Recibida', 'Memorias RAM y SSD'),
  (2, 2, '002-001-000000981', '2026-11-03', 320.00, 'Pendiente', 'Pantallas 15.6"');

INSERT IGNORE INTO herramientas (id, nombre, codigo, marca_id, sucursal_id, estado, fecha_adquisicion) VALUES
  (1, 'Estación de soldadura FX-951', 'HER-001', 1, 1, 'Operativa', '2024-02-10'),
  (2, 'Kit de destornilladores Pro Tech', 'HER-002', 2, 1, 'Operativa', '2024-05-22'),
  (3, 'Multímetro 117', 'HER-003', 3, 2, 'En mantenimiento', '2023-11-03');

INSERT IGNORE INTO citas (id, cliente_id, sucursal_id, fecha_hora, motivo, estado) VALUES
  (1, 1, 1, '2026-11-06 10:00:00', 'Retiro de laptop reparada', 'Programada'),
  (2, 2, 2, '2026-11-07 15:30:00', 'Revisión de PC que no enciende', 'Programada');

INSERT IGNORE INTO cotizaciones (id, orden_id, descripcion, monto, valida_hasta, estado) VALUES
  (1, 1, 'Cambio de pantalla 15.6" + mano de obra', 145.00, '2026-11-20', 'Aprobada');

INSERT IGNORE INTO seguimientos (id, orden_id, tecnico_id, nota, fecha) VALUES
  (1, 1, 1, 'Se confirma pantalla rota; se solicita repuesto a bodega.', '2026-11-04 11:20:00');

INSERT IGNORE INTO garantias (id, orden_id, fecha_inicio, fecha_fin, cobertura, estado) VALUES
  (1, 1, '2026-11-05', '2027-02-05', 'Pantalla reemplazada: 3 meses contra defectos de fábrica', 'Vigente');

INSERT IGNORE INTO pagos (id, orden_id, metodo_pago_id, monto, fecha_pago, referencia) VALUES
  (1, 1, 2, 70.00, '2026-11-04 12:00:00', 'Anticipo · TRX-88421');

INSERT IGNORE INTO gastos (id, concepto, categoria_gasto_id, sucursal_id, monto, fecha) VALUES
  (1, 'Internet fibra noviembre', 1, 1, 45.00, '2026-11-01'),
  (2, 'Pasta térmica y alcohol isopropílico', 3, 2, 28.40, '2026-11-02');


-- =====================================================================
-- 22 a 30. Roles y cuentas seguras, tienda, portal de clientes y automatización.
--          También disponible como migración en migrations/004_tienda_cuentas_automatizacion.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- Usuarios: roles y seguridad de la cuenta
-- ---------------------------------------------------------------------
ALTER TABLE usuarios
  MODIFY password_hash VARCHAR(255) NULL, -- NULL = cuenta creada con Google, sin contraseña
  ADD COLUMN rol ENUM('admin', 'tecnico', 'cliente') NOT NULL DEFAULT 'cliente' AFTER correo,
  ADD COLUMN cedula VARCHAR(10) NULL AFTER rol,
  ADD COLUMN telefono VARCHAR(20) NULL AFTER cedula,
  ADD COLUMN cliente_id INT UNSIGNED NULL AFTER telefono,
  ADD COLUMN correo_verificado TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN dos_pasos TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN google_id VARCHAR(64) NULL,
  ADD COLUMN intentos_fallidos INT NOT NULL DEFAULT 0,
  ADD COLUMN bloqueado_hasta DATETIME NULL,
  ADD COLUMN ultimo_acceso DATETIME NULL,
  ADD CONSTRAINT uq_usuarios_cedula UNIQUE (cedula),
  ADD CONSTRAINT uq_usuarios_google UNIQUE (google_id),
  ADD CONSTRAINT fk_usuarios_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE SET NULL;

-- Las cuentas que ya existían son del personal del taller y ya estaban en uso.
UPDATE usuarios SET rol = 'admin', correo_verificado = 1;

-- Códigos de un solo uso: confirmar correo, recuperar contraseña y verificación en dos pasos.
-- Se guarda solo el hash SHA-256 del código, nunca el código.
CREATE TABLE IF NOT EXISTS tokens_usuario (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT UNSIGNED NOT NULL,
  tipo        ENUM('verificacion', 'recuperacion', 'dos_pasos') NOT NULL,
  token_hash  CHAR(64) NOT NULL,
  expira_en   DATETIME NOT NULL,
  usado_en    DATETIME NULL,
  intentos    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tokens_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
  INDEX idx_tokens_busqueda (tipo, token_hash),
  INDEX idx_tokens_usuario (usuario_id)
);

-- Historial de inicios de sesión (exitosos y fallidos) para auditoría y el dashboard.
CREATE TABLE IF NOT EXISTS inicios_sesion (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT UNSIGNED NULL,
  correo          VARCHAR(120) NOT NULL,
  exito           TINYINT(1) NOT NULL,
  motivo          VARCHAR(60) NULL,
  ip              VARCHAR(45) NULL,
  agente_usuario  VARCHAR(255) NULL,
  fecha           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inicios_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL,
  INDEX idx_inicios_fecha (fecha),
  INDEX idx_inicios_usuario (usuario_id)
);

-- ---------------------------------------------------------------------
-- Tienda en línea
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias_producto (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(80)  NOT NULL,
  slug         VARCHAR(80)  NOT NULL,
  descripcion  VARCHAR(255) NULL,
  icono        VARCHAR(40)  NOT NULL DEFAULT 'Package',
  orden        INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_categorias_producto_nombre UNIQUE (nombre),
  CONSTRAINT uq_categorias_producto_slug UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS productos (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(160) NOT NULL,
  slug              VARCHAR(180) NOT NULL,
  sku               VARCHAR(40)  NOT NULL,
  categoria_id      INT UNSIGNED NOT NULL,
  marca_id          INT UNSIGNED NULL,
  descripcion       TEXT NULL,
  especificaciones  TEXT NULL, -- una por línea: "Clave: valor"
  precio            DECIMAL(10, 2) NOT NULL,
  precio_anterior   DECIMAL(10, 2) NULL,
  stock             INT NOT NULL DEFAULT 0,
  imagen_url        VARCHAR(500) NULL,
  garantia_meses    INT NOT NULL DEFAULT 12,
  destacado         TINYINT(1) NOT NULL DEFAULT 0,
  activo            TINYINT(1) NOT NULL DEFAULT 1,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_productos_slug UNIQUE (slug),
  CONSTRAINT uq_productos_sku UNIQUE (sku),
  CONSTRAINT chk_productos_precio CHECK (precio >= 0),
  CONSTRAINT chk_productos_stock CHECK (stock >= 0),
  CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias_producto (id) ON DELETE RESTRICT,
  CONSTRAINT fk_productos_marca FOREIGN KEY (marca_id) REFERENCES marcas (id) ON DELETE RESTRICT,
  INDEX idx_productos_categoria (categoria_id),
  INDEX idx_productos_marca (marca_id),
  INDEX idx_productos_precio (precio)
);

CREATE TABLE IF NOT EXISTS pedidos (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id    INT UNSIGNED NOT NULL,
  estado        ENUM('Pendiente', 'Confirmado', 'Preparando', 'Listo para retirar', 'Enviado', 'Entregado', 'Cancelado')
                NOT NULL DEFAULT 'Pendiente',
  metodo_pago   ENUM('Transferencia', 'Pago en tienda', 'Contra entrega') NOT NULL,
  tipo_entrega  ENUM('Retiro en tienda', 'Envío a domicilio') NOT NULL,
  direccion     VARCHAR(255) NULL,
  ciudad        VARCHAR(80) NULL,
  telefono      VARCHAR(20) NOT NULL,
  notas         VARCHAR(500) NULL,
  subtotal      DECIMAL(10, 2) NOT NULL,
  costo_envio   DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total         DECIMAL(10, 2) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT,
  INDEX idx_pedidos_usuario (usuario_id),
  INDEX idx_pedidos_estado (estado),
  INDEX idx_pedidos_fecha (created_at)
);

CREATE TABLE IF NOT EXISTS pedido_items (
  pedido_id        INT UNSIGNED NOT NULL,
  producto_id      INT UNSIGNED NOT NULL,
  nombre_producto  VARCHAR(160) NOT NULL, -- copia del nombre al momento de comprar
  cantidad         INT NOT NULL,
  precio_unitario  DECIMAL(10, 2) NOT NULL, -- precio al momento de comprar
  PRIMARY KEY (pedido_id, producto_id),
  CONSTRAINT chk_pedido_items_cantidad CHECK (cantidad > 0),
  CONSTRAINT fk_pedido_items_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE,
  CONSTRAINT fk_pedido_items_producto FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE RESTRICT,
  INDEX idx_pedido_items_producto (producto_id)
);

-- ---------------------------------------------------------------------
-- Portal de clientes: solicitudes de informe que el admin aprueba
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS solicitudes_informe (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id       INT UNSIGNED NOT NULL,
  orden_id         INT UNSIGNED NOT NULL,
  mensaje          VARCHAR(500) NULL,
  estado           ENUM('Pendiente', 'Aprobada', 'Rechazada') NOT NULL DEFAULT 'Pendiente',
  respuesta_admin  VARCHAR(500) NULL,
  revisado_por     INT UNSIGNED NULL,
  revisado_en      DATETIME NULL,
  enviado_en       DATETIME NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_solicitudes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
  CONSTRAINT fk_solicitudes_orden FOREIGN KEY (orden_id) REFERENCES ordenes_servicio (id) ON DELETE CASCADE,
  CONSTRAINT fk_solicitudes_revisor FOREIGN KEY (revisado_por) REFERENCES usuarios (id) ON DELETE SET NULL,
  INDEX idx_solicitudes_estado (estado)
);

-- ---------------------------------------------------------------------
-- Automatización: registro de correos y configuración
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS correos_enviados (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  destinatario  VARCHAR(255) NOT NULL,
  asunto        VARCHAR(255) NOT NULL,
  tipo          VARCHAR(40)  NOT NULL,
  estado        ENUM('Enviado', 'Simulado', 'Error') NOT NULL,
  error         VARCHAR(500) NULL,
  html          MEDIUMTEXT NULL,
  fecha         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_correos_fecha (fecha),
  INDEX idx_correos_tipo (tipo)
);

CREATE TABLE IF NOT EXISTS configuracion (
  clave       VARCHAR(60) PRIMARY KEY,
  valor       VARCHAR(500) NOT NULL,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO configuracion (clave, valor) VALUES
  ('informe_diario_activo', '1'),
  ('informe_diario_hora', '19:00'),
  ('informe_diario_destinatarios', ''),  -- vacío = todos los administradores
  ('notificar_inicio_sesion', '1'),
  ('tienda_costo_envio', '5.00'),
  ('tienda_envio_gratis_desde', '150.00');

-- =====================================================================
-- Datos de prueba de la tienda
-- =====================================================================
INSERT IGNORE INTO marcas (nombre, pais_origen, sitio_web) VALUES
  ('ASUS', 'Taiwán', 'https://www.asus.com'), ('Lenovo', 'China', 'https://www.lenovo.com'),
  ('HP', 'Estados Unidos', 'https://www.hp.com'), ('Dell', 'Estados Unidos', 'https://www.dell.com'),
  ('Logitech', 'Suiza', 'https://www.logitech.com'), ('Samsung', 'Corea del Sur', 'https://www.samsung.com'),
  ('Kingston', 'Estados Unidos', 'https://www.kingston.com'), ('NVIDIA', 'Estados Unidos', 'https://www.nvidia.com'),
  ('AMD', 'Estados Unidos', 'https://www.amd.com'), ('Intel', 'Estados Unidos', 'https://www.intel.com'),
  ('Corsair', 'Estados Unidos', 'https://www.corsair.com'), ('Razer', 'Estados Unidos', 'https://www.razer.com'),
  ('TP-Link', 'China', 'https://www.tp-link.com'), ('LG', 'Corea del Sur', 'https://www.lg.com'),
  ('MSI', 'Taiwán', 'https://www.msi.com'), ('Western Digital', 'Estados Unidos', 'https://www.westerndigital.com'),
  ('HyperX', 'Estados Unidos', 'https://www.hyperx.com');

INSERT IGNORE INTO categorias_producto (nombre, slug, descripcion, icono, orden) VALUES
  ('Laptops', 'laptops', 'Portátiles para estudio, oficina y gaming', 'Laptop', 1),
  ('Computadoras', 'computadoras', 'PC de escritorio armadas y listas para usar', 'Monitor', 2),
  ('Componentes', 'componentes', 'Tarjetas gráficas, procesadores, memorias y fuentes', 'Cpu', 3),
  ('Almacenamiento', 'almacenamiento', 'SSD, discos duros y memorias USB', 'HardDrive', 4),
  ('Monitores', 'monitores', 'Pantallas para trabajo, diseño y gaming', 'MonitorSmartphone', 5),
  ('Periféricos', 'perifericos', 'Teclados, mouse y mandos', 'Keyboard', 6),
  ('Audio', 'audio', 'Audífonos, micrófonos y parlantes', 'Headphones', 7),
  ('Redes', 'redes', 'Routers, repetidores y adaptadores Wi-Fi', 'Wifi', 8);

-- Productos (se resuelven categoría y marca por nombre para no depender de ids)
INSERT IGNORE INTO productos (nombre, slug, sku, categoria_id, marca_id, descripcion, especificaciones, precio, precio_anterior, stock, garantia_meses, destacado)
SELECT p.nombre, p.slug, p.sku, c.id, m.id, p.descripcion, p.especificaciones, p.precio, p.precio_anterior, p.stock, p.garantia, p.destacado
FROM (
  SELECT 'ASUS TUF Gaming F15 RTX 4060' AS nombre, 'asus-tuf-gaming-f15-rtx-4060' AS slug, 'LAP-ASUS-F15' AS sku, 'laptops' AS cat, 'ASUS' AS marca,
         'Laptop gamer con pantalla de 144 Hz y refrigeración reforzada para sesiones largas.' AS descripcion,
         'Procesador: Intel Core i7-13620H\nGráfica: NVIDIA RTX 4060 8 GB\nRAM: 16 GB DDR5\nAlmacenamiento: SSD 512 GB NVMe\nPantalla: 15.6" FHD 144 Hz' AS especificaciones,
         1299.00 AS precio, 1449.00 AS precio_anterior, 6 AS stock, 12 AS garantia, 1 AS destacado
  UNION ALL SELECT 'Lenovo IdeaPad Slim 3 Ryzen 7', 'lenovo-ideapad-slim-3-ryzen-7', 'LAP-LEN-IPS3', 'laptops', 'Lenovo',
         'Ligera y con batería para todo el día. Ideal para estudiantes y oficina.',
         'Procesador: AMD Ryzen 7 7730U\nRAM: 16 GB\nAlmacenamiento: SSD 512 GB\nPantalla: 15.6" FHD IPS\nPeso: 1.6 kg', 749.00, 829.00, 10, 12, 1
  UNION ALL SELECT 'HP 15 Core i5 13.ª generación', 'hp-15-core-i5-13-gen', 'LAP-HP-15I5', 'laptops', 'HP',
         'Equilibrio entre rendimiento y precio para el día a día.',
         'Procesador: Intel Core i5-1335U\nRAM: 8 GB\nAlmacenamiento: SSD 512 GB\nPantalla: 15.6" FHD', 629.00, NULL, 8, 12, 0
  UNION ALL SELECT 'Dell Latitude 5440 empresarial', 'dell-latitude-5440', 'LAP-DELL-5440', 'laptops', 'Dell',
         'Portátil empresarial resistente, con seguridad y conectividad completas.',
         'Procesador: Intel Core i7-1355U\nRAM: 16 GB\nAlmacenamiento: SSD 512 GB\nPantalla: 14" FHD\nExtras: lector de huellas, Wi-Fi 6E', 1149.00, NULL, 4, 24, 0
  UNION ALL SELECT 'PC Gamer Bancada Ryzen 5 + RTX 4060', 'pc-gamer-bancada-ryzen-5-rtx-4060', 'PC-BAN-R5-4060', 'computadoras', 'AMD',
         'Armada y probada en nuestro taller: lista para jugar en 1080p con todo en alto.',
         'Procesador: AMD Ryzen 5 7600\nGráfica: RTX 4060 8 GB\nRAM: 32 GB DDR5\nAlmacenamiento: SSD 1 TB NVMe\nFuente: 650 W 80+ Bronze', 1189.00, 1279.00, 3, 12, 1
  UNION ALL SELECT 'PC Oficina Bancada Core i3', 'pc-oficina-bancada-core-i3', 'PC-BAN-I3', 'computadoras', 'Intel',
         'Equipo silencioso y eficiente para oficina, facturación y estudio.',
         'Procesador: Intel Core i3-13100\nRAM: 16 GB\nAlmacenamiento: SSD 512 GB\nSistema: Windows 11 Pro', 469.00, NULL, 7, 12, 0
  UNION ALL SELECT 'NVIDIA GeForce RTX 4070 SUPER 12 GB', 'nvidia-rtx-4070-super-12gb', 'GPU-NV-4070S', 'componentes', 'NVIDIA',
         'Rendimiento de sobra para 1440p con trazado de rayos y DLSS 3.',
         'Memoria: 12 GB GDDR6X\nSalidas: 3× DisplayPort, 1× HDMI\nConsumo: 220 W', 679.00, 739.00, 5, 24, 1
  UNION ALL SELECT 'AMD Ryzen 7 7800X3D', 'amd-ryzen-7-7800x3d', 'CPU-AMD-7800X3D', 'componentes', 'AMD',
         'El procesador favorito para gaming gracias a su caché 3D V-Cache.',
         'Núcleos / hilos: 8 / 16\nFrecuencia: hasta 5.0 GHz\nSocket: AM5\nTDP: 120 W', 449.00, NULL, 6, 36, 1
  UNION ALL SELECT 'Intel Core i5-14600K', 'intel-core-i5-14600k', 'CPU-INT-14600K', 'componentes', 'Intel',
         'Gran rendimiento multinúcleo para crear contenido y jugar.',
         'Núcleos / hilos: 14 / 20\nFrecuencia: hasta 5.3 GHz\nSocket: LGA 1700', 319.00, NULL, 5, 36, 0
  UNION ALL SELECT 'Memoria Kingston FURY Beast 32 GB DDR5', 'kingston-fury-beast-32gb-ddr5', 'RAM-KIN-32D5', 'componentes', 'Kingston',
         'Kit de 2 × 16 GB a 5600 MT/s con perfiles XMP y EXPO.',
         'Capacidad: 32 GB (2 × 16 GB)\nVelocidad: 5600 MT/s\nLatencia: CL40', 109.00, 129.00, 15, 120, 0
  UNION ALL SELECT 'Fuente Corsair RM750e 80+ Gold', 'corsair-rm750e-80-gold', 'PSU-COR-750E', 'componentes', 'Corsair',
         'Fuente modular silenciosa con certificación 80 Plus Gold.',
         'Potencia: 750 W\nCertificación: 80+ Gold\nModular: sí\nVentilador: 120 mm', 119.00, NULL, 9, 84, 0
  UNION ALL SELECT 'SSD Samsung 990 PRO 1 TB NVMe', 'samsung-990-pro-1tb', 'SSD-SAM-990-1T', 'almacenamiento', 'Samsung',
         'Velocidades de hasta 7450 MB/s para cargar juegos y proyectos al instante.',
         'Capacidad: 1 TB\nInterfaz: PCIe 4.0 NVMe M.2\nLectura: 7450 MB/s\nEscritura: 6900 MB/s', 119.00, 149.00, 20, 60, 1
  UNION ALL SELECT 'SSD Kingston A400 480 GB SATA', 'kingston-a400-480gb', 'SSD-KIN-A400', 'almacenamiento', 'Kingston',
         'La mejora más efectiva para revivir una laptop o PC antigua.',
         'Capacidad: 480 GB\nInterfaz: SATA III 2.5"\nLectura: 500 MB/s', 39.00, NULL, 30, 36, 0
  UNION ALL SELECT 'Disco WD Blue 2 TB 7200 rpm', 'wd-blue-2tb', 'HDD-WD-2T', 'almacenamiento', 'Western Digital',
         'Almacenamiento amplio para fotos, respaldos y bibliotecas de juegos.',
         'Capacidad: 2 TB\nVelocidad: 7200 rpm\nInterfaz: SATA III 3.5"', 64.00, NULL, 12, 24, 0
  UNION ALL SELECT 'Monitor LG UltraGear 27" QHD 180 Hz', 'lg-ultragear-27-qhd-180hz', 'MON-LG-27GS', 'monitores', 'LG',
         'Panel IPS QHD con 1 ms de respuesta y colores precisos.',
         'Tamaño: 27"\nResolución: 2560 × 1440\nFrecuencia: 180 Hz\nPanel: IPS 1 ms', 329.00, 379.00, 7, 12, 1
  UNION ALL SELECT 'Monitor Samsung 24" FHD IPS', 'samsung-24-fhd-ips', 'MON-SAM-24F', 'monitores', 'Samsung',
         'Monitor de bordes delgados ideal para oficina y doble pantalla.',
         'Tamaño: 24"\nResolución: 1920 × 1080\nFrecuencia: 75 Hz\nPanel: IPS', 139.00, NULL, 14, 12, 0
  UNION ALL SELECT 'Monitor ASUS ProArt 27" 4K', 'asus-proart-27-4k', 'MON-ASUS-PA27', 'monitores', 'ASUS',
         'Calibrado de fábrica para diseño, fotografía y video.',
         'Tamaño: 27"\nResolución: 3840 × 2160\nColor: 100 % sRGB, ΔE < 2', 499.00, NULL, 3, 36, 0
  UNION ALL SELECT 'Teclado mecánico Logitech G Pro X TKL', 'logitech-g-pro-x-tkl', 'TEC-LOG-PROX', 'perifericos', 'Logitech',
         'Teclado mecánico inalámbrico sin pad numérico, pensado para competir.',
         'Switches: GX Brown táctiles\nConexión: LIGHTSPEED, Bluetooth y USB-C\nIluminación: RGB', 179.00, 199.00, 8, 24, 0
  UNION ALL SELECT 'Mouse Logitech G502 X Plus', 'logitech-g502-x-plus', 'MOU-LOG-G502X', 'perifericos', 'Logitech',
         'El clásico G502, ahora inalámbrico y más ligero.',
         'Sensor: HERO 25K\nConexión: LIGHTSPEED inalámbrico\nPeso: 106 g\nBotones: 13 programables', 139.00, NULL, 10, 24, 1
  UNION ALL SELECT 'Mouse Razer DeathAdder V3', 'razer-deathadder-v3', 'MOU-RAZ-DAV3', 'perifericos', 'Razer',
         'Ergonómico, ultraligero y preciso.',
         'Sensor: Focus Pro 30K\nPeso: 59 g\nConexión: USB', 69.00, 89.00, 12, 24, 0
  UNION ALL SELECT 'Combo teclado y mouse Logitech MK270', 'logitech-mk270', 'COM-LOG-MK270', 'perifericos', 'Logitech',
         'Combo inalámbrico confiable para casa y oficina.',
         'Conexión: receptor USB 2.4 GHz\nBatería: hasta 36 meses (teclado)', 29.00, NULL, 25, 12, 0
  UNION ALL SELECT 'Audífonos HyperX Cloud III', 'hyperx-cloud-iii', 'AUD-HYX-CL3', 'audio', 'HyperX',
         'Comodidad legendaria con sonido espacial y micrófono desmontable.',
         'Drivers: 53 mm\nConexión: 3.5 mm y USB\nMicrófono: desmontable con cancelación de ruido', 99.00, NULL, 9, 24, 0
  UNION ALL SELECT 'Audífonos Logitech G435 inalámbricos', 'logitech-g435', 'AUD-LOG-G435', 'audio', 'Logitech',
         'Ligeros y con doble conexión: LIGHTSPEED y Bluetooth.',
         'Peso: 165 g\nBatería: hasta 18 h\nConexión: LIGHTSPEED y Bluetooth', 59.00, 79.00, 11, 24, 0
  UNION ALL SELECT 'Router TP-Link Archer AX55 Wi-Fi 6', 'tp-link-archer-ax55', 'RED-TPL-AX55', 'redes', 'TP-Link',
         'Wi-Fi 6 de doble banda para toda la casa con más velocidad y menos interferencias.',
         'Estándar: Wi-Fi 6 (802.11ax)\nVelocidad: hasta 3000 Mbps\nPuertos: 4× Gigabit LAN', 89.00, NULL, 10, 36, 0
  UNION ALL SELECT 'Repetidor TP-Link RE315 Mesh', 'tp-link-re315', 'RED-TPL-RE315', 'redes', 'TP-Link',
         'Lleva el Wi-Fi a las habitaciones donde no llega.',
         'Velocidad: AC1200\nCompatibilidad: OneMesh\nPuerto: 1× Ethernet', 35.00, NULL, 16, 36, 0
  UNION ALL SELECT 'Adaptador Wi-Fi USB TP-Link Archer T3U', 'tp-link-archer-t3u', 'RED-TPL-T3U', 'redes', 'TP-Link',
         'Agrega Wi-Fi de doble banda a cualquier PC de escritorio.',
         'Velocidad: AC1300\nInterfaz: USB 3.0', 22.00, NULL, 0, 24, 0
) AS p
JOIN categorias_producto c ON c.slug = p.cat
LEFT JOIN marcas m ON m.nombre = p.marca;

-- =====================================================================
-- Migración 005 · Costa Rica (colones, IVA 13 %, SINPE Móvil, cédulas CR),
-- armador de PC (compatibilidad de componentes), facturas y automatizaciones.
-- Agrega la tabla facturas (total: 31). Ejecutar DESPUÉS de la migración 004.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Montos de dólares a colones (≈ ₡510 por dólar). Los precios de la tienda
--    quedan "redondos" terminando en 900 colones, como en el comercio local.
-- ---------------------------------------------------------------------
UPDATE productos SET
  precio = CEIL(precio * 510 / 1000) * 1000 - 100,
  precio_anterior = IF(precio_anterior IS NULL, NULL, CEIL(precio_anterior * 510 / 1000) * 1000 - 100)
WHERE precio < 50000;

UPDATE componentes_repuesto SET precio_unitario = ROUND(precio_unitario * 510, -2) WHERE precio_unitario < 50000;
UPDATE orden_componentes SET precio_unitario = ROUND(precio_unitario * 510, -2) WHERE precio_unitario < 50000;
UPDATE servicios SET precio_base = ROUND(precio_base * 510, -2) WHERE precio_base < 50000;
UPDATE cotizaciones SET monto = ROUND(monto * 510, -2) WHERE monto < 50000;
UPDATE pagos SET monto = ROUND(monto * 510, -2) WHERE monto < 50000;
UPDATE gastos SET monto = ROUND(monto * 510, -2) WHERE monto < 50000;
UPDATE compras SET total = ROUND(total * 510, -2) WHERE total < 100000;
UPDATE pedido_items SET precio_unitario = ROUND(precio_unitario * 510, -2) WHERE precio_unitario < 50000;
UPDATE pedidos SET subtotal = ROUND(subtotal * 510, -2), costo_envio = ROUND(costo_envio * 510, -2), total = ROUND(total * 510, -2) WHERE total < 100000;

UPDATE configuracion SET valor = '2500.00' WHERE clave = 'tienda_costo_envio';
UPDATE configuracion SET valor = '75000.00' WHERE clave = 'tienda_envio_gratis_desde';

-- ---------------------------------------------------------------------
-- 2. SINPE Móvil y cédulas de Costa Rica (física 9, jurídica 10, DIMEX 11-12 dígitos)
-- ---------------------------------------------------------------------
ALTER TABLE pedidos MODIFY metodo_pago ENUM('SINPE Móvil', 'Transferencia', 'Pago en tienda', 'Contra entrega') NOT NULL;
ALTER TABLE usuarios MODIFY cedula VARCHAR(12) NULL;
INSERT IGNORE INTO metodos_pago (nombre, descripcion, activo) VALUES ('SINPE Móvil', 'Pago inmediato al número del taller', 1);

-- ---------------------------------------------------------------------
-- 3. Armador de PC: datos de compatibilidad de cada componente
-- ---------------------------------------------------------------------
ALTER TABLE productos
  ADD COLUMN pc_tipo ENUM('cpu', 'motherboard', 'ram', 'gpu', 'almacenamiento', 'fuente', 'gabinete', 'enfriamiento') NULL AFTER garantia_meses,
  ADD COLUMN pc_socket VARCHAR(20) NULL AFTER pc_tipo,          -- AM4, AM5, LGA1700 (CPU, tarjeta madre, disipador*)
  ADD COLUMN pc_memoria ENUM('DDR4', 'DDR5') NULL AFTER pc_socket,
  ADD COLUMN pc_formato ENUM('ATX', 'mATX', 'ITX') NULL AFTER pc_memoria, -- tarjeta madre: su tamaño · gabinete: el máximo que admite
  ADD COLUMN pc_consumo_w INT NULL AFTER pc_formato,            -- CPU/GPU: consumo · fuente: potencia
  ADD INDEX idx_productos_pc_tipo (pc_tipo);
-- *En el disipador, pc_socket lista los sockets compatibles separados por coma.

-- Categorías al estilo de una tienda de componentes
INSERT IGNORE INTO categorias_producto (nombre, slug, descripcion, icono, orden) VALUES
  ('Procesadores', 'procesadores', 'CPU AMD Ryzen e Intel Core', 'Cpu', 3),
  ('Tarjetas madre', 'tarjetas-madre', 'Placas AM4, AM5 y LGA1700', 'CircuitBoard', 4),
  ('Memorias RAM', 'memorias-ram', 'DDR4 y DDR5 para escritorio', 'MemoryStick', 5),
  ('Tarjetas de video', 'tarjetas-de-video', 'GPU NVIDIA GeForce y AMD Radeon', 'Gpu', 6),
  ('Fuentes de poder', 'fuentes-de-poder', 'Fuentes certificadas 80 Plus', 'PlugZap', 8),
  ('Gabinetes', 'gabinetes', 'Cases ATX, Micro-ATX y Mini-ITX', 'Box', 9),
  ('Enfriamiento', 'enfriamiento', 'Disipadores por aire y enfriamiento líquido', 'Fan', 10);
UPDATE categorias_producto SET orden = 1 WHERE slug = 'laptops';
UPDATE categorias_producto SET orden = 2 WHERE slug = 'computadoras';
UPDATE categorias_producto SET orden = 7 WHERE slug = 'almacenamiento';
UPDATE categorias_producto SET orden = 11 WHERE slug = 'monitores';
UPDATE categorias_producto SET orden = 12 WHERE slug = 'perifericos';
UPDATE categorias_producto SET orden = 13 WHERE slug = 'audio';
UPDATE categorias_producto SET orden = 14 WHERE slug = 'redes';

-- Mover los componentes existentes a su categoría y darles datos de compatibilidad
UPDATE productos SET categoria_id = (SELECT id FROM categorias_producto WHERE slug = 'procesadores'), pc_tipo = 'cpu', pc_socket = 'AM5', pc_memoria = 'DDR5', pc_consumo_w = 120 WHERE slug = 'amd-ryzen-7-7800x3d';
UPDATE productos SET categoria_id = (SELECT id FROM categorias_producto WHERE slug = 'procesadores'), pc_tipo = 'cpu', pc_socket = 'LGA1700', pc_consumo_w = 181 WHERE slug = 'intel-core-i5-14600k';
UPDATE productos SET categoria_id = (SELECT id FROM categorias_producto WHERE slug = 'tarjetas-de-video'), pc_tipo = 'gpu', pc_consumo_w = 220 WHERE slug = 'nvidia-rtx-4070-super-12gb';
UPDATE productos SET categoria_id = (SELECT id FROM categorias_producto WHERE slug = 'memorias-ram'), pc_tipo = 'ram', pc_memoria = 'DDR5' WHERE slug = 'kingston-fury-beast-32gb-ddr5';
UPDATE productos SET categoria_id = (SELECT id FROM categorias_producto WHERE slug = 'fuentes-de-poder'), pc_tipo = 'fuente', pc_consumo_w = 750 WHERE slug = 'corsair-rm750e-80-gold';
UPDATE productos SET pc_tipo = 'almacenamiento' WHERE slug IN ('samsung-990-pro-1tb', 'kingston-a400-480gb', 'wd-blue-2tb');
DELETE FROM categorias_producto WHERE slug = 'componentes' AND NOT EXISTS (SELECT 1 FROM (SELECT categoria_id FROM productos) p WHERE p.categoria_id = categorias_producto.id);

INSERT IGNORE INTO marcas (nombre, pais_origen, sitio_web) VALUES
  ('Gigabyte', 'Taiwán', 'https://www.gigabyte.com'), ('ASRock', 'Taiwán', 'https://www.asrock.com'),
  ('G.Skill', 'Taiwán', 'https://www.gskill.com'), ('NZXT', 'Estados Unidos', 'https://nzxt.com'),
  ('Cooler Master', 'Taiwán', 'https://www.coolermaster.com'), ('Lian Li', 'Taiwán', 'https://lian-li.com'),
  ('DeepCool', 'China', 'https://www.deepcool.com'), ('Noctua', 'Austria', 'https://noctua.at'),
  ('EVGA', 'Estados Unidos', 'https://www.evga.com'), ('Sapphire', 'Hong Kong', 'https://www.sapphiretech.com');

-- ---------------------------------------------------------------------
-- 4. Nuevos componentes (precios en colones, IVA incluido)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO productos (nombre, slug, sku, categoria_id, marca_id, descripcion, especificaciones, precio, precio_anterior, stock, garantia_meses, destacado,
                              pc_tipo, pc_socket, pc_memoria, pc_formato, pc_consumo_w)
SELECT p.nombre, p.slug, p.sku, c.id, m.id, p.descripcion, p.espec, p.precio, p.anterior, p.stock, p.garantia, p.destacado,
       p.tipo, p.socket, p.memoria, p.formato, p.consumo
FROM (
  -- Procesadores
  SELECT 'AMD Ryzen 5 7600' AS nombre, 'amd-ryzen-5-7600' AS slug, 'CPU-AMD-7600' AS sku, 'procesadores' AS cat, 'AMD' AS marca,
         'El punto de entrada ideal a la plataforma AM5 con DDR5 y PCIe 5.0.' AS descripcion,
         'Núcleos / hilos: 6 / 12\nFrecuencia: hasta 5.1 GHz\nSocket: AM5\nTDP: 65 W\nIncluye disipador: Wraith Stealth' AS espec,
         114900 AS precio, 129900 AS anterior, 14 AS stock, 36 AS garantia, 1 AS destacado, 'cpu' AS tipo, 'AM5' AS socket, 'DDR5' AS memoria, NULL AS formato, 65 AS consumo
  UNION ALL SELECT 'AMD Ryzen 9 7900X', 'amd-ryzen-9-7900x', 'CPU-AMD-7900X', 'procesadores', 'AMD', 'Doce núcleos para crear contenido, programar y jugar sin límites.',
         'Núcleos / hilos: 12 / 24\nFrecuencia: hasta 5.6 GHz\nSocket: AM5\nTDP: 170 W', 229900, NULL, 6, 36, 0, 'cpu', 'AM5', 'DDR5', NULL, 170
  UNION ALL SELECT 'AMD Ryzen 5 5600', 'amd-ryzen-5-5600', 'CPU-AMD-5600', 'procesadores', 'AMD', 'El rey del costo-beneficio en AM4 con DDR4.',
         'Núcleos / hilos: 6 / 12\nFrecuencia: hasta 4.4 GHz\nSocket: AM4\nTDP: 65 W', 64900, 74900, 20, 36, 0, 'cpu', 'AM4', 'DDR4', NULL, 65
  UNION ALL SELECT 'Intel Core i7-14700K', 'intel-core-i7-14700k', 'CPU-INT-14700K', 'procesadores', 'Intel', '20 núcleos híbridos para gaming y productividad de alto nivel.',
         'Núcleos / hilos: 20 / 28\nFrecuencia: hasta 5.6 GHz\nSocket: LGA1700\nPotencia turbo: 253 W', 219900, 239900, 7, 36, 1, 'cpu', 'LGA1700', NULL, NULL, 253
  UNION ALL SELECT 'Intel Core i3-13100', 'intel-core-i3-13100', 'CPU-INT-13100', 'procesadores', 'Intel', 'Eficiente y económico para oficina y estudio.',
         'Núcleos / hilos: 4 / 8\nFrecuencia: hasta 4.5 GHz\nSocket: LGA1700\nTDP: 60 W', 69900, NULL, 15, 36, 0, 'cpu', 'LGA1700', NULL, NULL, 60
  -- Tarjetas madre
  UNION ALL SELECT 'ASUS TUF Gaming B650-PLUS WiFi', 'asus-tuf-b650-plus-wifi', 'MB-ASUS-B650P', 'tarjetas-madre', 'ASUS', 'Placa AM5 robusta con Wi-Fi 6 y doble M.2.',
         'Socket: AM5\nChipset: B650\nMemoria: DDR5 (4 ranuras)\nFormato: ATX\nConectividad: Wi-Fi 6, 2.5 GbE', 119900, NULL, 8, 36, 1, 'motherboard', 'AM5', 'DDR5', 'ATX', NULL
  UNION ALL SELECT 'MSI PRO B650M-A WiFi', 'msi-pro-b650m-a-wifi', 'MB-MSI-B650M', 'tarjetas-madre', 'MSI', 'Micro-ATX AM5 con Wi-Fi para builds compactos.',
         'Socket: AM5\nChipset: B650\nMemoria: DDR5 (4 ranuras)\nFormato: Micro-ATX', 94900, 104900, 9, 36, 0, 'motherboard', 'AM5', 'DDR5', 'mATX', NULL
  UNION ALL SELECT 'Gigabyte B550M DS3H', 'gigabyte-b550m-ds3h', 'MB-GIG-B550M', 'tarjetas-madre', 'Gigabyte', 'Placa AM4 confiable con soporte PCIe 4.0.',
         'Socket: AM4\nChipset: B550\nMemoria: DDR4 (4 ranuras)\nFormato: Micro-ATX', 54900, NULL, 12, 36, 0, 'motherboard', 'AM4', 'DDR4', 'mATX', NULL
  UNION ALL SELECT 'MSI PRO B760M-P DDR5', 'msi-pro-b760m-p-ddr5', 'MB-MSI-B760M', 'tarjetas-madre', 'MSI', 'Base sólida para Intel de 12.ª a 14.ª generación.',
         'Socket: LGA1700\nChipset: B760\nMemoria: DDR5 (4 ranuras)\nFormato: Micro-ATX', 69900, NULL, 10, 36, 0, 'motherboard', 'LGA1700', 'DDR5', 'mATX', NULL
  UNION ALL SELECT 'ASUS ROG Strix Z790-A Gaming WiFi', 'asus-rog-strix-z790-a', 'MB-ASUS-Z790A', 'tarjetas-madre', 'ASUS', 'Gama alta para overclock con Intel serie K.',
         'Socket: LGA1700\nChipset: Z790\nMemoria: DDR5 (4 ranuras)\nFormato: ATX\nConectividad: Wi-Fi 6E, 2.5 GbE', 179900, 199900, 4, 36, 0, 'motherboard', 'LGA1700', 'DDR5', 'ATX', NULL
  UNION ALL SELECT 'ASRock B650I Lightning WiFi', 'asrock-b650i-lightning', 'MB-ASR-B650I', 'tarjetas-madre', 'ASRock', 'Mini-ITX AM5 para PCs pequeñas y potentes.',
         'Socket: AM5\nChipset: B650\nMemoria: DDR5 (2 ranuras)\nFormato: Mini-ITX', 129900, NULL, 3, 36, 0, 'motherboard', 'AM5', 'DDR5', 'ITX', NULL
  -- Memorias RAM
  UNION ALL SELECT 'Corsair Vengeance 16 GB DDR5 5200', 'corsair-vengeance-16gb-ddr5', 'RAM-COR-16D5', 'memorias-ram', 'Corsair', 'Kit de 2 × 8 GB para plataformas DDR5.',
         'Capacidad: 16 GB (2 × 8 GB)\nTipo: DDR5\nVelocidad: 5200 MT/s', 34900, NULL, 18, 120, 0, 'ram', NULL, 'DDR5', NULL, NULL
  UNION ALL SELECT 'Corsair Vengeance LPX 16 GB DDR4 3200', 'corsair-vengeance-lpx-16gb-ddr4', 'RAM-COR-16D4', 'memorias-ram', 'Corsair', 'El clásico DDR4 de perfil bajo, compatible con casi cualquier disipador.',
         'Capacidad: 16 GB (2 × 8 GB)\nTipo: DDR4\nVelocidad: 3200 MT/s\nLatencia: CL16', 24900, 29900, 25, 120, 0, 'ram', NULL, 'DDR4', NULL, NULL
  UNION ALL SELECT 'G.Skill Ripjaws V 32 GB DDR4 3600', 'gskill-ripjaws-v-32gb-ddr4', 'RAM-GSK-32D4', 'memorias-ram', 'G.Skill', 'Kit de 2 × 16 GB DDR4 de alta velocidad.',
         'Capacidad: 32 GB (2 × 16 GB)\nTipo: DDR4\nVelocidad: 3600 MT/s\nLatencia: CL18', 44900, NULL, 10, 120, 0, 'ram', NULL, 'DDR4', NULL, NULL
  -- Tarjetas de video
  UNION ALL SELECT 'MSI GeForce RTX 4060 Ventus 2X 8 GB', 'msi-rtx-4060-ventus-8gb', 'GPU-MSI-4060', 'tarjetas-de-video', 'MSI', 'DLSS 3 y trazado de rayos para jugar en 1080p con bajo consumo.',
         'Memoria: 8 GB GDDR6\nConsumo: 115 W\nSalidas: 3× DisplayPort, 1× HDMI', 164900, 179900, 9, 36, 1, 'gpu', NULL, NULL, NULL, 115
  UNION ALL SELECT 'Sapphire Pulse Radeon RX 7600 8 GB', 'sapphire-pulse-rx-7600', 'GPU-SAP-7600', 'tarjetas-de-video', 'Sapphire', 'Excelente rendimiento por colón en 1080p.',
         'Memoria: 8 GB GDDR6\nConsumo: 165 W', 139900, NULL, 7, 24, 0, 'gpu', NULL, NULL, NULL, 165
  UNION ALL SELECT 'Sapphire Nitro+ Radeon RX 7800 XT 16 GB', 'sapphire-nitro-rx-7800-xt', 'GPU-SAP-7800XT', 'tarjetas-de-video', 'Sapphire', '16 GB de VRAM para jugar en 1440p a alta tasa de cuadros.',
         'Memoria: 16 GB GDDR6\nConsumo: 263 W', 289900, 319900, 4, 24, 1, 'gpu', NULL, NULL, NULL, 263
  UNION ALL SELECT 'ASUS TUF GeForce RTX 4080 SUPER 16 GB', 'asus-tuf-rtx-4080-super', 'GPU-ASUS-4080S', 'tarjetas-de-video', 'ASUS', 'Rendimiento 4K con DLSS 3.5 y construcción de grado militar.',
         'Memoria: 16 GB GDDR6X\nConsumo: 320 W\nFuente recomendada: 850 W', 599900, NULL, 2, 36, 0, 'gpu', NULL, NULL, NULL, 320
  -- Almacenamiento
  UNION ALL SELECT 'Kingston NV2 1 TB NVMe', 'kingston-nv2-1tb', 'SSD-KIN-NV2-1T', 'almacenamiento', 'Kingston', 'SSD NVMe económico, varias veces más rápido que un disco SATA.',
         'Capacidad: 1 TB\nInterfaz: PCIe 4.0 NVMe\nLectura: 3500 MB/s', 34900, 39900, 30, 36, 0, 'almacenamiento', NULL, NULL, NULL, NULL
  UNION ALL SELECT 'WD Black SN850X 2 TB NVMe', 'wd-black-sn850x-2tb', 'SSD-WD-SN850X-2T', 'almacenamiento', 'Western Digital', 'Velocidad tope para juegos y edición de video.',
         'Capacidad: 2 TB\nInterfaz: PCIe 4.0 NVMe\nLectura: 7300 MB/s', 99900, NULL, 8, 60, 0, 'almacenamiento', NULL, NULL, NULL, NULL
  -- Fuentes de poder
  UNION ALL SELECT 'MSI MAG A650BN 650 W 80+ Bronze', 'msi-mag-a650bn', 'PSU-MSI-650', 'fuentes-de-poder', 'MSI', 'Fuente confiable para equipos de gama media.',
         'Potencia: 650 W\nCertificación: 80+ Bronze\nModular: no', 39900, NULL, 15, 60, 0, 'fuente', NULL, NULL, NULL, 650
  UNION ALL SELECT 'EVGA 500 W1 80+', 'evga-500-w1', 'PSU-EVGA-500', 'fuentes-de-poder', 'EVGA', 'Para equipos de oficina sin tarjeta de video dedicada.',
         'Potencia: 500 W\nCertificación: 80 Plus', 26900, NULL, 12, 36, 0, 'fuente', NULL, NULL, NULL, 500
  UNION ALL SELECT 'Corsair RM1000e 1000 W 80+ Gold', 'corsair-rm1000e', 'PSU-COR-1000E', 'fuentes-de-poder', 'Corsair', 'Potencia de sobra para tarjetas de gama alta, totalmente modular.',
         'Potencia: 1000 W\nCertificación: 80+ Gold\nModular: sí\nATX 3.0 / PCIe 5.0', 99900, 109900, 5, 84, 0, 'fuente', NULL, NULL, NULL, 1000
  -- Gabinetes
  UNION ALL SELECT 'NZXT H5 Flow', 'nzxt-h5-flow', 'CASE-NZXT-H5F', 'gabinetes', 'NZXT', 'Flujo de aire excelente con un diseño limpio y minimalista.',
         'Formato máximo: ATX\nVentiladores incluidos: 2 × 120 mm\nPanel lateral: vidrio templado', 54900, NULL, 9, 24, 1, 'gabinete', NULL, NULL, 'ATX', NULL
  UNION ALL SELECT 'Corsair 4000D Airflow', 'corsair-4000d-airflow', 'CASE-COR-4000D', 'gabinetes', 'Corsair', 'Uno de los gabinetes más vendidos: amplio, fresco y fácil de armar.',
         'Formato máximo: ATX\nVentiladores incluidos: 2 × 120 mm', 59900, 64900, 7, 24, 0, 'gabinete', NULL, NULL, 'ATX', NULL
  UNION ALL SELECT 'Cooler Master MasterBox Q300L', 'cooler-master-q300l', 'CASE-CM-Q300L', 'gabinetes', 'Cooler Master', 'Compacto y económico para placas Micro-ATX.',
         'Formato máximo: Micro-ATX\nVentiladores incluidos: 1 × 120 mm', 32900, NULL, 11, 12, 0, 'gabinete', NULL, NULL, 'mATX', NULL
  UNION ALL SELECT 'Lian Li O11 Dynamic EVO', 'lian-li-o11-dynamic-evo', 'CASE-LL-O11E', 'gabinetes', 'Lian Li', 'Vitrina de doble cámara para builds que se lucen.',
         'Formato máximo: ATX\nPaneles: vidrio templado frontal y lateral', 99900, NULL, 3, 24, 0, 'gabinete', NULL, NULL, 'ATX', NULL
  UNION ALL SELECT 'Cooler Master NR200P Mini-ITX', 'cooler-master-nr200p', 'CASE-CM-NR200P', 'gabinetes', 'Cooler Master', 'Mini-ITX con espacio para tarjetas de video grandes.',
         'Formato máximo: Mini-ITX\nGPU de hasta 330 mm', 59900, NULL, 4, 24, 0, 'gabinete', NULL, NULL, 'ITX', NULL
  -- Enfriamiento (pc_socket = sockets compatibles)
  UNION ALL SELECT 'Cooler Master Hyper 212 Black', 'cooler-master-hyper-212', 'COOL-CM-212', 'enfriamiento', 'Cooler Master', 'El disipador por aire más popular: silencioso y efectivo.',
         'Tipo: aire, torre\nVentilador: 120 mm\nTDP soportado: hasta 150 W\nSockets: AM4, AM5, LGA1700', 24900, NULL, 20, 24, 0, 'enfriamiento', 'AM4,AM5,LGA1700', NULL, NULL, NULL
  UNION ALL SELECT 'DeepCool AK400', 'deepcool-ak400', 'COOL-DC-AK400', 'enfriamiento', 'DeepCool', 'Gran rendimiento térmico por su precio.',
         'Tipo: aire, torre\nTDP soportado: hasta 220 W\nSockets: AM4, AM5, LGA1700', 21900, 24900, 16, 36, 0, 'enfriamiento', 'AM4,AM5,LGA1700', NULL, NULL, NULL
  UNION ALL SELECT 'NZXT Kraken 240 RGB', 'nzxt-kraken-240-rgb', 'COOL-NZXT-K240', 'enfriamiento', 'NZXT', 'Enfriamiento líquido AIO con pantalla LCD personalizable.',
         'Tipo: líquido AIO 240 mm\nTDP soportado: hasta 250 W\nSockets: AM4, AM5, LGA1700', 89900, NULL, 5, 72, 1, 'enfriamiento', 'AM4,AM5,LGA1700', NULL, NULL, NULL
  UNION ALL SELECT 'Noctua NH-D15 chromax.black', 'noctua-nh-d15-chromax', 'COOL-NOC-D15', 'enfriamiento', 'Noctua', 'El disipador por aire de referencia en silencio y rendimiento.',
         'Tipo: aire, doble torre\nTDP soportado: hasta 250 W\nSockets: AM4, AM5, LGA1700', 64900, NULL, 4, 72, 0, 'enfriamiento', 'AM4,AM5,LGA1700', NULL, NULL, NULL
) AS p
JOIN categorias_producto c ON c.slug = p.cat
LEFT JOIN marcas m ON m.nombre = p.marca;

-- ---------------------------------------------------------------------
-- 5. Facturas (comprobantes de venta con consecutivo e IVA)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS facturas (
  id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  consecutivo             VARCHAR(40) NOT NULL,
  tipo                    ENUM('pedido', 'orden') NOT NULL,
  pedido_id               INT UNSIGNED NULL,
  orden_id                INT UNSIGNED NULL,
  usuario_id              INT UNSIGNED NULL,      -- dueño (cliente) para el portal
  emitida_por             INT UNSIGNED NULL,
  cliente_nombre          VARCHAR(150) NOT NULL,
  cliente_identificacion  VARCHAR(20) NULL,
  cliente_correo          VARCHAR(120) NULL,
  cliente_telefono        VARCHAR(20) NULL,
  cliente_direccion       VARCHAR(255) NULL,
  lineas                  JSON NOT NULL,          -- [{ codigo, descripcion, cantidad, precio_unitario }]
  subtotal                DECIMAL(12, 2) NOT NULL, -- sin IVA
  iva                     DECIMAL(12, 2) NOT NULL,
  total                   DECIMAL(12, 2) NOT NULL,
  metodo_pago             VARCHAR(40) NULL,
  notas                   VARCHAR(500) NULL,
  estado                  ENUM('Emitida', 'Anulada') NOT NULL DEFAULT 'Emitida',
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_facturas_consecutivo UNIQUE (consecutivo),
  CONSTRAINT uq_facturas_pedido UNIQUE (pedido_id),
  CONSTRAINT uq_facturas_orden UNIQUE (orden_id),
  CONSTRAINT fk_facturas_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE RESTRICT,
  CONSTRAINT fk_facturas_orden FOREIGN KEY (orden_id) REFERENCES ordenes_servicio (id) ON DELETE RESTRICT,
  CONSTRAINT fk_facturas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL,
  CONSTRAINT fk_facturas_emisor FOREIGN KEY (emitida_por) REFERENCES usuarios (id) ON DELETE SET NULL,
  INDEX idx_facturas_fecha (created_at)
);

-- ---------------------------------------------------------------------
-- 6. Datos de la empresa (para facturas y correos) y automatizaciones
-- ---------------------------------------------------------------------
INSERT IGNORE INTO configuracion (clave, valor) VALUES
  ('empresa_nombre', 'Bancada Tecnología S.A.'),
  ('empresa_cedula_juridica', '3-101-845210'),
  ('empresa_telefono', '+506 2222-4580'),
  ('empresa_correo', 'facturacion@bancada.cr'),
  ('empresa_direccion', 'Avenida Central, calles 5 y 7, San José, Costa Rica'),
  ('empresa_iban', 'CR05 0152 0200 1026 2840 66'),
  ('empresa_sinpe', '8888-4580'),
  ('iva_porcentaje', '13'),
  ('auto_factura', '1'),
  ('auto_vencer_garantias', '1'),
  ('auto_cancelar_pedidos_horas', '48'),
  ('auto_recordatorio_citas', '1'),
  ('auto_alerta_stock', '1'),
  ('informe_diario_ia', '1');

-- =====================================================================
-- Migración 006: datos de demostración con formato de Costa Rica.
-- Cédulas físicas (9 dígitos), cédulas jurídicas de proveedores (10 dígitos),
-- teléfonos de 8 dígitos y sucursales en San José y Heredia.
-- Solo cambia los registros de ejemplo originales (se identifican por su valor anterior).
-- =====================================================================

-- Clientes del taller
UPDATE clientes SET cedula = '109870654', telefono = '8812-3456' WHERE cedula = '0102030405';
UPDATE clientes SET cedula = '304560789', telefono = '8701-1122' WHERE cedula = '0923456781';

-- Técnicos
UPDATE tecnicos SET cedula = '205430876', telefono = '8445-5667' WHERE cedula = '1718293045';
UPDATE tecnicos SET cedula = '113450298', telefono = '8712-3788' WHERE cedula = '1722334455';

-- Proveedores: la columna "ruc" guarda ahora la cédula jurídica (10 dígitos)
UPDATE proveedores SET ruc = '3101234567', telefono = '2234-5678', direccion = 'Paseo Colón, calle 28, San José' WHERE ruc = '1790012345001';
UPDATE proveedores SET ruc = '3102765432', telefono = '8776-6554', direccion = 'Zona Franca Coyol, Alajuela' WHERE ruc = '1791234567001';

-- Sucursales
UPDATE sucursales SET ciudad = 'San José', direccion = 'Avenida Central, calles 5 y 7', telefono = '2222-4580'
WHERE nombre = 'Matriz Centro' AND ciudad = 'Quito';
UPDATE sucursales SET ciudad = 'Heredia', direccion = 'Del Oxígeno 300 m oeste, Heredia', telefono = '2260-9876'
WHERE nombre = 'Norte' AND ciudad = 'Quito';

-- Facturas ya emitidas con los datos anteriores del cliente
UPDATE facturas SET cliente_identificacion = '304560789', cliente_telefono = '8701-1122' WHERE cliente_identificacion = '0923456781';
UPDATE facturas SET cliente_identificacion = '109870654', cliente_telefono = '8812-3456' WHERE cliente_identificacion = '0102030405';
