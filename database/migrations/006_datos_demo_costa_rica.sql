-- =====================================================================
-- Migración 006: datos de demostración con formato de Costa Rica.
-- Cédulas físicas (9 dígitos), cédulas jurídicas de proveedores (10 dígitos),
-- teléfonos de 8 dígitos y sucursales en San José y Heredia.
-- Solo cambia los registros de ejemplo originales (se identifican por su valor anterior).
-- =====================================================================
USE taller_servicio_tecnico;

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
