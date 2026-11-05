-- =====================================================================
-- Migración 004 · Roles y cuentas seguras, tienda en línea, portal de clientes,
-- solicitudes de informe, correos y automatización. Agrega 9 tablas (total: 30).
-- Ejecutar DESPUÉS de 003_administracion.sql. No borra datos.
-- =====================================================================
USE taller_servicio_tecnico;

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
