-- =====================================================================
-- Migración 005 · Costa Rica (colones, IVA 13 %, SINPE Móvil, cédulas CR),
-- armador de PC (compatibilidad de componentes), facturas y automatizaciones.
-- Agrega la tabla facturas (total: 31). Ejecutar DESPUÉS de la migración 004.
-- =====================================================================
USE taller_servicio_tecnico;

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
