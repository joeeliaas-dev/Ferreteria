# FerreMax Pro — Prototipo SPA Material Design 3 (Ferretería Industrial)

Prototipo funcional y navegable de comercio electrónico para una ferretería profesional construido con **HTML5 semántico, CSS nativo modular (Design Tokens) y JavaScript (ES6+)** siguiendo estrictamente **Material Design 3 (M3)** y principios de **Experiencia de Usuario (UX)**.

---

## Estructura del Proyecto

```text
Ferretería/
├── index.html          # Aplicación SPA con las 4 pantallas, modales M3 y barra de inspección UX
├── css/
│   ├── tokens.css      # Tokens de Material Design 3 (Paleta tonal, tipografía, elevaciones 0-5, shapes)
│   ├── base.css        # Reset, escala tipográfica M3, transiciones SPA y accesibilidad (:focus-visible)
│   ├── components.css  # Componentes M3 (Botones, TextFields, Cards, Chips, AppBar, Stepper, Snackbar)
│   └── views.css       # Diseño específico de las 4 vistas y adaptabilidad responsiva
├── js/
│   ├── data.js         # Catálogo realista de 16 herramientas, SKUs, precios en USD y vectores SVG
│   ├── state.js        # Gestión de estado reactivo (Auth, navegación SPA, filtros, carrito, checkout)
│   └── app.js          # Controlador DOM, validación con estado de error M3, flujo de compra y efecto Ripple
└── README.md           # Documentación técnica y de diseño UX/UI
```

---

## Las 4 Pantallas del Prototipo SPA

1. **Pantalla de Login (`#screen-login`)**:
   - Campos de texto *Outlined* de Material Design 3 con etiquetas claras, iconos y botón para mostrar/ocultar contraseña.
   - **Estado de Validación con Error**: Al ingresar una contraseña incorrecta (o pulsar el botón **"⚠️ Simular Contraseña Incorrecta"**), los campos muestran borde de `2px` en `--md-sys-color-error` (`#BA1A1A`), icono de alerta, mensaje de ayuda contextual en rojo, animación de sacudida (*shake*) y un banner superior M3 (`--md-sys-color-error-container`).
2. **Pantalla Principal (`#screen-home`)**:
   - Aplica **Reconocimiento sobre Recuerdo**:
     - Barra de búsqueda con sugerencias visuales clicables (*Taladro 20V*, *Cable 12 AWG*, *Multímetro Fluke*, *Taquetes 5/16"*).
     - **Accesos Directos y Kits por Tarea** (incluyendo carga de pedido frecuente en 1 clic).
     - **6 Categorías Principales** con ilustraciones vectoriales e indicación explícita de los artículos que contienen.
     - Sección **"Vistos Recientemente y Esenciales de Obra"** para retomar productos sin memorizar códigos SKU.
3. **Pantalla de Catálogo (`#screen-catalog`)**:
   - Listado de 16 artículos reales de ferretería (DeWalt, Bosch, Milwaukee, Makita, Urrea, Truper Expert, Klein Tools, Fischer, Hilti, Fluke, Indiana, Square D, 3M, Ansell) con precios plausibles en dólares (`USD`), unidad de venta, disponibilidad en almacén y ficha técnica en modal.
   - Filtrado instantáneo mediante **Filter Chips M3** y selector de ordenamiento.
4. **Pantalla de Compra / Carrito y Checkout (`#screen-cart`)**:
   - **Diseño de Estado Vacío Alternativo (`#cart-empty-state`)**: Cuando no hay productos seleccionados (o al pulsar *"🗑️ Vaciar carrito (Ver Estado Vacío)"*), presenta una ilustración dedicada, mensaje claro, accesos directos por departamento y dos botones amplios (*Explorar Catálogo* o *Cargar Kit Demo de Obra*).
   - **Diseño con Productos y Checkout (`#cart-filled-state`)**: Control de cantidades con *steppers* accesibles, selección de entrega (*Retiro Express 1h Gratis* vs *Envío a Obra*), desglose financiero con descuento mayorista del 5%, IVA (16%) y confirmación de compra de principio a fin con folio de orden.

---

## Leyes de UX y Requerimientos Técnicos Aplicados

- **Ley de Jakob**: Arquitectura familiar de e-commerce (barra superior con marca a la izquierda, navegación central, usuario y carrito con *badge* a la derecha; cuadrícula de productos estandarizada; checkout de dos columnas con resumen financiero fijo).
- **Ley de Hick**: Reducción de carga cognitiva mediante 6 categorías principales bien diferenciadas, tarjetas de producto con solo 3 etiquetas técnicas clave y un checkout simplificado en una sola vista.
- **Ley de Fitts**: Botones de acción principal (CTA) amplios (`min-height: 48px` a `56px`), ancho completo en formularios y tarjetas, y controles de cantidad (`+` / `−`) de `38x38px` con espaciado seguro.
- **Estados Interactivos CSS**: Todos los botones, tarjetas, chips, enlaces y campos de entrada cuentan con estados definidos para `:hover`, `:focus-visible`, `:active` (incluyendo onda *ripple* M3) y `:disabled`.
