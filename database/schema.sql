-- =====================================================================
-- Sistema de Gestión de Órdenes de Servicio Técnico
-- Script para MySQL 8 (ejecutar completo en MySQL Workbench: Ctrl+Shift+Enter)
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
