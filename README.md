# Stock Control

Una aplicación web pensada para llevar el inventario de una tienda de forma simple: saber qué productos hay, cuánto stock queda y qué movimientos se realizaron.

El proyecto nació como un MVP para aprender y aplicar una arquitectura completa con Spring Boot, React y PostgreSQL. Actualmente permite administrar productos, registrar entradas y salidas y agilizar la carga mediante códigos de barras.

## Probar la aplicación

**[Abrir Stock Control](https://stock-control-mvp.vercel.app)**

> El backend funciona con el plan gratuito de Render. Si estuvo un tiempo sin actividad, la primera carga puede demorar unos segundos mientras el servicio vuelve a iniciarse.

## ¿Qué se puede hacer?

- Consultar el estado general del inventario.
- Crear y editar productos.
- Definir un stock inicial al dar de alta un producto.
- Registrar entradas y salidas de mercadería.
- Evitar salidas superiores al stock disponible.
- Detectar productos con stock bajo.
- Consultar el historial de movimientos.
- Activar o desactivar productos sin perder su historial.
- Buscar productos por nombre o código.
- Leer códigos de barras con la cámara, un lector USB o de forma manual.

## Carga mediante código de barras

Desde la sección **Productos** se puede seleccionar **Escanear código**.

Si el código todavía no existe, la aplicación abre el alta con el código ya cargado. Solo hay que completar el nombre, el precio, el stock mínimo y, si corresponde, el stock inicial.

Si el producto ya existe, se muestra directamente el formulario para confirmar una entrada o una salida. El stock nunca se modifica solamente por escanear: siempre se solicita confirmación para evitar movimientos accidentales.

La imagen de la cámara se procesa dentro del navegador y no se almacena ni se envía al servidor.

Formatos compatibles:

- EAN-13 y EAN-8.
- UPC-A y UPC-E.
- Code 128 y Code 39.
- ITF.

## Cómo está construido

```text
Vercel                    Render                     Supabase
React + TypeScript  --->  Spring Boot + Java  --->  PostgreSQL
      interfaz                 API y reglas              datos
```

El backend sigue una arquitectura por capas:

```text
Controller -> Service -> Repository -> Entity -> PostgreSQL
```

- **Controller** recibe las solicitudes de la aplicación.
- **Service** aplica las reglas del negocio.
- **Repository** consulta y guarda la información.
- **Entity** representa los datos almacenados en PostgreSQL.

### Tecnologías principales

| Parte | Tecnologías |
|---|---|
| Frontend | React, TypeScript, Vite, TanStack Query y Tailwind CSS |
| Backend | Java 21, Spring Boot, Spring Data JPA y Bean Validation |
| Base de datos | PostgreSQL, Supabase y Flyway |
| Lectura de códigos | ZXing para navegador |
| Despliegue | Vercel y Render |
| Pruebas | JUnit, Testcontainers, Vitest y Testing Library |

## Reglas importantes del inventario

La aplicación protege la consistencia del stock desde el backend:

- Cada producto tiene un código único.
- El stock y el stock mínimo no pueden ser negativos.
- Un producto inactivo no puede recibir movimientos.
- Una salida no puede dejar el stock por debajo de cero.
- El alta con stock inicial guarda el producto y su primer movimiento en una única transacción.
- Los movimientos concurrentes se controlan para reducir el riesgo de vender dos veces la misma unidad.

## Servicios publicados

- [Aplicación web](https://stock-control-mvp.vercel.app)
- [API](https://stock-control-api-emda.onrender.com)
- [Productos en la API](https://stock-control-api-emda.onrender.com/api/v1/products)
- [Estado del backend](https://stock-control-api-emda.onrender.com/actuator/health)

## Estado del proyecto

Stock Control es un MVP funcional que continúa creciendo.

La siguiente etapa será incorporar inicio de sesión y permisos para diferenciar entre un **administrador** y un **usuario operador**. En la versión actual todavía no hay autenticación, por lo que debe considerarse una demostración y no utilizarse para almacenar información sensible o el inventario real de una tienda.

## Documentación

Si quieres entender cómo funciona el proyecto desde cero, consulta la **[guía de estudio completa](docs/GUIA_DE_ESTUDIO.md)**. Explica el recorrido de la información, el backend, el frontend, la base de datos, las pruebas, el despliegue y la futura implementación de usuarios y roles.

---

Proyecto desarrollado como una aplicación real de aprendizaje, construida paso a paso y preparada para seguir incorporando nuevas funciones.
