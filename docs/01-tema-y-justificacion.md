# Tema y justificación empresarial

**Proyecto:** Bancada · Sistema de gestión de órdenes de servicio técnico
**Tipo de sistema:** Transacciones y servicios. Gestiona la reparación de equipos de cómputo.

## El problema

Un taller de computación recibe todos los días laptops, PC de escritorio y tarjetas gráficas para diagnóstico y reparación. En la mayoría de talleres pequeños y medianos ese control se lleva en cuadernos, hojas de cálculo o mensajes de WhatsApp, lo que provoca:

- **Equipos "perdidos" en el proceso:** nadie sabe con certeza cuáles están en diagnóstico, cuáles ya se repararon o cuáles esperan al cliente.
- **Inventario descuadrado:** los repuestos (memorias, discos, pantallas, fuentes) se usan sin descontarse, y el stock real no coincide con el registrado.
- **Reclamos sin respaldo:** no queda registro de qué repuesto se instaló, a qué precio, quién hizo el trabajo ni qué garantía se dio.
- **Información de clientes dispersa:** se repiten datos y no hay un historial por cliente.

## La solución

Bancada centraliza el ciclo completo de una reparación:

1. **Recepción:** se registra el cliente y el equipo que deja (tipo, marca y modelo, número de serie, falla reportada).
2. **Diagnóstico:** el técnico anota sus hallazgos en la bitácora y se emite una cotización.
3. **Reparación:** se asignan los repuestos a la orden y el stock se descuenta automáticamente, con un precio histórico que no cambia aunque el repuesto suba de precio.
4. **Entrega:** se registran los pagos, se emite la garantía y la orden se cierra.

Alrededor de ese flujo, el módulo de **Administración** gestiona técnicos, especialidades, sucursales, proveedores, compras, herramientas, citas, gastos, métodos de pago, servicios, marcas y usuarios. En total son **20 CRUDs** sobre **21 tablas**.

## Valor para la empresa

| Necesidad del taller | Cómo la resuelve el sistema |
|---|---|
| Saber en qué estado está cada equipo | Tablero con 4 estados (Recibido → En diagnóstico → Reparado → Entregado) |
| Controlar el inventario | Descuento automático y transaccional del stock, más alertas de stock bajo |
| Respaldo ante reclamos | Repuestos por orden con precio histórico, bitácora de seguimiento y garantías |
| Control financiero | Pagos por orden, gastos por categoría y sucursal, compras a proveedores |
| Atención al cliente | Directorio con historial de órdenes y agenda de citas |
| Proteger la información | Acceso solo con cuenta, contraseñas cifradas y sesión con token JWT |

## Entidades principales

- **Cliente:** quien deja el equipo.
- **OrdenServicio:** el equipo ingresado y su estado.
- **ComponenteRepuesto:** el inventario de repuestos.
- **Usuario:** las cuentas con acceso al sistema.

Más 16 entidades de administración. El detalle está en [02-modelo-de-datos.md](02-modelo-de-datos.md).
