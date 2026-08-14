# Stock Control

Stock Control es una aplicación para administrar inventario y ventas de una o varias tiendas desde un mismo lugar. Cada negocio conserva sus propios productos, usuarios, cajas, movimientos y ventas.

**[Abrir la aplicación](https://stock-control-mvp.vercel.app)**

> El backend utiliza el plan gratuito de Render. La primera carga puede demorar unos segundos si el servicio estuvo inactivo.

## Qué permite hacer

- Administrar varias tiendas sin mezclar su información.
- Invitar administradores y cajeros con permisos diferentes.
- Crear productos y asignarles stock inicial.
- Leer códigos de barras con cámara, lector USB o carga manual.
- Registrar entradas y salidas con historial inmutable.
- Abrir y cerrar turnos de caja con arqueo de efectivo.
- Vender con efectivo, tarjeta, transferencia o pagos combinados.
- Calcular automáticamente el vuelto.
- Autorizar descuentos máximos por cajero y guardar su motivo.
- Anular una venta mientras el turno original siga abierto y devolver el stock.
- Imprimir y reimprimir tickets térmicos de 80 mm o en formato A4.
- Personalizar el nombre, logo, colores y textos del ticket de cada tienda.

## Roles

### Superadministrador

Crea tiendas, invita al primer administrador y activa o desactiva negocios. Su función es administrar la plataforma, no operar una caja.

### Administrador

Gestiona los productos, el stock, las cajas, las ventas, los usuarios y la apariencia de su tienda. También puede anular ventas válidas.

### Cajero

Abre su turno, arma ventas, cobra, imprime tickets y realiza el cierre de caja. Solo puede aplicar descuentos dentro del límite definido por un administrador.

## Flujo de una venta

```text
Abrir turno → Escanear productos → Armar carrito → Cobrar → Actualizar stock → Imprimir ticket → Cerrar turno
```

El precio y el stock siempre se comprueban en el backend. Una venta, sus artículos, los pagos y los movimientos de inventario se guardan en una única transacción para evitar datos parciales.

## Códigos de barras

El lector admite EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39 e ITF.

Desde **Productos**, un administrador puede escanear un código nuevo y completar el nombre, precio, stock mínimo y stock inicial. Desde **Caja**, un código desconocido no crea productos: informa que debe registrarlo un administrador.

La imagen de la cámara se procesa dentro del navegador. No se almacena ni se envía al servidor.

## Tickets

Los comprobantes incluyen tienda, número de venta, fecha, caja, cajero, artículos, descuentos, total, medios de pago, efectivo recibido y vuelto.

Se imprimen mediante el diálogo del navegador y contienen la leyenda:

> Comprobante interno — no válido como factura

No se guarda un PDF. La aplicación conserva una copia inmutable de los datos usados para poder reimprimir el comprobante aunque después cambien el producto o la identidad visual de la tienda.

## Cómo está construido

```text
Vercel                    Render                         Supabase
React + TypeScript  →     Spring Boot + Spring Security → Auth + PostgreSQL + Storage
Interfaz                  API y reglas de negocio       Identidad, datos y logos
```

El backend mantiene la separación habitual por responsabilidades:

```text
Controller → Service → Repository → Entity → PostgreSQL
```

| Parte | Tecnologías |
|---|---|
| Frontend | React, TypeScript, Vite, TanStack Query, Tailwind CSS y Radix UI |
| Backend | Java 21, Spring Boot, Spring Security, Spring Data JPA y Flyway |
| Servicios | Supabase Auth, PostgreSQL y Storage |
| Códigos de barras | ZXing para navegador |
| Despliegue | Vercel y Render |
| Pruebas | JUnit, Mockito, Testcontainers, Vitest y Testing Library |

## Seguridad y consistencia

- Supabase Auth inicia las sesiones con email y contraseña.
- Spring valida la firma, el emisor, la audiencia y el vencimiento de cada JWT.
- Los roles se consultan en la base de datos; el frontend no decide los permisos.
- Cambiar el identificador de una tienda en una URL no permite acceder a sus datos.
- Los productos y movimientos siempre quedan asociados a una tienda.
- El stock no puede quedar en negativo, incluso con dos cajas vendiendo al mismo tiempo.
- La clave administrativa de Supabase solo se utiliza en el backend.
- Las tablas operativas no se exponen directamente al navegador mediante la Data API.

## Servicios

- [Aplicación web](https://stock-control-mvp.vercel.app)
- [Estado de la API](https://stock-control-api-emda.onrender.com/actuator/health)

## Alcance actual

El ticket es un comprobante interno y no una factura fiscal. La integración con ARCA, productos fraccionados, devoluciones parciales, clientes, sucursales internas y funcionamiento sin conexión quedan fuera de esta versión.
