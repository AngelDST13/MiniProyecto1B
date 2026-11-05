-- =====================================================================
-- Migración 002 · Día 2: entidad Usuario (autenticación)
-- Úsala si ya ejecutaste schema.sql del Día 1 y NO quieres perder datos.
-- =====================================================================
USE taller_servicio_tecnico;

CREATE TABLE IF NOT EXISTS usuarios (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,
  correo          VARCHAR(120) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  fecha_creacion  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_usuarios_correo UNIQUE (correo)
);

-- Usuario de demostración · correo: demo@bancada.com · contraseña: Demo12345
INSERT IGNORE INTO usuarios (nombre, correo, password_hash) VALUES
  ('Técnico Demo', 'demo@bancada.com', '$2b$10$zPH4IV3CbYy0Dm2duCLFzeOJcgGH6N9Sqgh0C0EXc/VVA0/epjwX6');
