-- =====================================================================
-- Sistema de Gestión de Órdenes de Servicio Técnico
-- Script para MySQL 8 (ejecutar completo en MySQL Workbench: Ctrl+Shift+Enter)
-- Crea las 21 tablas del sistema con datos de prueba.
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
