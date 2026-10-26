# FerreMax Pro — Prototipo SPA Material Design 3 (Escritorio y Móvil)

Prototipo funcional y navegable de comercio electrónico para una ferretería profesional construido con **HTML5 semántico, CSS nativo modular (Design Tokens) y JavaScript (ES6+)** siguiendo estrictamente **Material Design 3 (M3)** y principios de **Experiencia de Usuario (UX)**.

---

## Estructura del Proyecto

```text
Ferretería/
├── index.html          # Aplicación SPA con las 4 pantallas, selector Escritorio/Móvil y modales M3
├── css/
│   ├── tokens.css      # Tokens de Material Design 3 (Paleta tonal, tipografía, elevaciones 0-5, shapes)
│   ├── base.css        # Reset, escala tipográfica M3, contenedor de vista móvil y accesibilidad
│   ├── components.css  # Componentes M3 (Segmented Buttons, Botones, TextFields, Chips, Bottom Nav)
│   └── views.css       # Maquetación de las 4 vistas para Escritorio y Vista Móvil dedicada
├── js/
│   ├── data.js         # Catálogo realista de 16 herramientas, SKUs, precios en USD e iconografía SVG
│   ├── state.js        # Gestión de estado reactivo (Auth, navegación, modo Escritorio/Móvil, carrito)
│   └── app.js          # Controlador DOM, validación con estado de error M3, flujo de compra y Ripple
└── README.md           # Documentación técnica y de diseño UX/UI
```

---

## Selector Interactivo: Vista Escritorio y Vista Móvil

En la barra superior de control se incluye un **Segmented Button M3 (`Vista Escritorio` / `Vista Móvil`)**:
- **Vista Escritorio**: Muestra la arquitectura completa a pantalla ancha (`1280px`) con barra de navegación superior y distribución multi-columna.
- **Vista Móvil (`412x844px`)**: Transforma instantáneamente el área de trabajo en un dispositivo móvil Material Design 3 con:
  - Barra de estado superior Android (hora, cámara frontal, iconos vectoriales de señal, Wi-Fi y batería).
  - **M3 Bottom Navigation Bar** fija en la parte inferior con las 4 pantallas (`Login`, `Principal`, `Catálogo`, `Compra`), indicador activo en forma de píldora (`60x30px`) y *badge* dinámico.
  - Chips de categorías con desplazamiento horizontal táctil, tarjetas compactas y botones de acción principal optimizados para la zona del pulgar (**Ley de Fitts**).

---

## Las 4 Pantallas del Prototipo SPA

1. **Pantalla de Login (`#screen-login`)**:
   - Campos de texto *Outlined* de Material Design 3 con etiquetas estructuradas, iconos vectoriales SVG y botón para mostrar/ocultar contraseña.
   - **Estado de Validación con Error**: Al ingresar una contraseña incorrecta (o pulsar **"Simular Contraseña Incorrecta"**), los campos muestran borde de `2px` en `--md-sys-color-error` (`#BA1A1A`), icono vectorial de alerta, mensaje de ayuda en rojo, animación de sacudida (*shake*) y banner superior M3 (`--md-sys-color-error-container`).
2. **Pantalla Principal (`#screen-home`)**:
   - Aplica **Reconocimiento sobre Recuerdo**:
     - Barra de búsqueda con sugerencias clicables (*Taladro 20V*, *Cable 12 AWG*, *Multímetro Fluke*, *Taquetes 5/16"*).
     - **Accesos Directos y Kits por Tarea** (incluyendo carga de pedido frecuente en 1 clic).
     - **6 Categorías Principales** con ilustraciones vectoriales e indicación explícita de los artículos que contienen.
     - Sección **"Vistos Recientemente y Esenciales de Obra"** para retomar productos sin memorizar códigos SKU.
3. **Pantalla de Catálogo (`#screen-catalog`)**:
   - Listado de 16 artículos reales de ferretería (DeWalt, Bosch, Milwaukee, Makita, Urrea, Truper Expert, Klein Tools, Fischer, Hilti, Fluke, Indiana, Square D, 3M, Ansell) con precios plausibles en dólares (`USD`), unidad de venta, disponibilidad en almacén y ficha técnica en modal.
   - Filtrado instantáneo mediante **Filter Chips M3** con icono SVG de selección y selector de ordenamiento.
4. **Pantalla de Compra / Carrito y Checkout (`#screen-cart`)**:
   - **Diseño de Estado Vacío Alternativo (`#cart-empty-state`)**: Cuando no hay productos seleccionados (o al pulsar *"Vaciar carrito (Ver Estado Vacío)"*), presenta una ilustración vectorial dedicada, mensaje claro, accesos directos por departamento y dos botones amplios (*Explorar Catálogo* o *Cargar Kit Demo de Obra*).
   - **Diseño con Productos y Checkout (`#cart-filled-state`)**: Control de cantidades con *steppers* accesibles, selección de entrega (*Retiro Express 1h Gratis* vs *Envío a Obra*), desglose financiero con descuento mayorista del 5%, IVA (16%) y confirmación de compra con folio de orden.
