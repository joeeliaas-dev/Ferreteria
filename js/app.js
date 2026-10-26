/* ==========================================================================
   MAIN SPA CONTROLLER & UI RENDERER (Material Design 3)
   Manages the 4 screens: Login, Principal, Catálogo, Compra (Carrito/Checkout)
   ========================================================================== */

(function () {
  const DATA = window.FERREMAX_DATA;
  const State = window.FerreState;

  let snackbarTimer = null;

  /* ------------------------------------------------------------------------
     UTILITY: Format Currency in USD
     ------------------------------------------------------------------------ */
  function formatUSD(amount) {
    return "$" + Number(amount).toFixed(2) + " USD";
  }

  /* ------------------------------------------------------------------------
     UTILITY: Material Design 3 Snackbar Notification
     ------------------------------------------------------------------------ */
  function showSnackbar(message, actionLabel = "Ver carrito", actionCallback = null) {
    const snackbar = document.getElementById("md-snackbar");
    const msgEl = document.getElementById("md-snackbar-msg");
    const actionBtn = document.getElementById("md-snackbar-action");

    if (!snackbar || !msgEl || !actionBtn) return;

    msgEl.textContent = message;
    if (actionLabel) {
      actionBtn.textContent = actionLabel;
      actionBtn.style.display = "inline-flex";
      actionBtn.onclick = () => {
        snackbar.classList.remove("is-visible");
        if (typeof actionCallback === "function") {
          actionCallback();
        } else {
          State.setScreen("cart");
        }
      };
    } else {
      actionBtn.style.display = "none";
    }

    snackbar.classList.add("is-visible");
    if (snackbarTimer) clearTimeout(snackbarTimer);
    snackbarTimer = setTimeout(() => {
      snackbar.classList.remove("is-visible");
    }, 4200);
  }

  /* ------------------------------------------------------------------------
     UTILITY: Material Design 3 Ripple Effect on Interactive Elements
     ------------------------------------------------------------------------ */
  function attachRippleEffect() {
    document.addEventListener("pointerdown", (e) => {
      const target = e.target.closest(".md-btn, .md-nav-item, .md-chip");
      if (!target || target.disabled) return;

      const rect = target.getBoundingClientRect();
      const ripple = document.createElement("span");
      const size = Math.max(rect.width, rect.height);
      ripple.className = "md-ripple";
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

      target.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  }

  /* ------------------------------------------------------------------------
     RENDER: Top App Bar, Navigation Tabs & Cart Badge
     ------------------------------------------------------------------------ */
  function renderNavigation(currentState) {
    // 1. Toggle active SPA screen
    document.querySelectorAll(".spa-screen").forEach((section) => {
      const screenName = section.getAttribute("data-screen");
      section.classList.toggle("is-active", screenName === currentState.currentScreen);
    });

    // 2. Highlight active M3 Navigation Bar pill
    document.querySelectorAll("[data-nav-target]").forEach((btn) => {
      const target = btn.getAttribute("data-nav-target");
      const isActive = target === currentState.currentScreen;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-current", isActive ? "page" : "false");
    });

    // 3. Update Cart Badges
    const totalCount = State.getCartItemCount();
    document.querySelectorAll(".js-cart-count").forEach((badge) => {
      const prev = badge.textContent;
      badge.textContent = String(totalCount);
      if (prev !== String(totalCount)) {
        badge.classList.add("bump");
        setTimeout(() => badge.classList.remove("bump"), 220);
      }
    });

    // 4. Update User Status Chip in Header
    const userChipLabel = document.getElementById("header-user-status");
    if (userChipLabel) {
      userChipLabel.textContent = currentState.auth.isAuthenticated
        ? currentState.auth.userName
        : "Iniciar sesión";
    }

    // 5. Update Theme button icon
    const themeLabel = document.getElementById("theme-toggle-label");
    if (themeLabel) {
      themeLabel.textContent = currentState.theme === "dark" ? "Modo Claro" : "Modo Oscuro";
    }
  }

  /* ------------------------------------------------------------------------
     SCREEN 1: LOGIN & M3 ERROR VALIDATION LOGIC
     ------------------------------------------------------------------------ */
  function setFieldError(fieldWrapperId, helperId, errorMessage, defaultHelperText) {
    const wrapper = document.getElementById(fieldWrapperId);
    const helper = document.getElementById(helperId);
    const input = wrapper ? wrapper.querySelector("input") : null;
    if (!wrapper || !helper) return;

    if (errorMessage) {
      wrapper.classList.add("has-error");
      helper.textContent = errorMessage;
      if (input) input.setAttribute("aria-invalid", "true");
    } else {
      wrapper.classList.remove("has-error");
      helper.textContent = defaultHelperText;
      if (input) input.setAttribute("aria-invalid", "false");
    }
  }

  function triggerLoginErrorState(emailVal, passwordVal, reasonMessage) {
    const banner = document.getElementById("login-error-banner");
    const bannerText = document.getElementById("login-error-banner-text");
    const loginCard = document.getElementById("login-card-container");

    if (banner && bannerText) {
      banner.style.display = "flex";
      bannerText.textContent =
        reasonMessage ||
        "Credenciales inválidas: La contraseña ingresada no coincide con la cuenta registrada.";
    }

    if (loginCard) {
      loginCard.classList.remove("animate-shake");
      void loginCard.offsetWidth; // Force reflow for shake animation
      loginCard.classList.add("animate-shake");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal || !emailRegex.test(emailVal)) {
      setFieldError(
        "field-login-email",
        "helper-login-email",
        "Ingresa un correo corporativo válido (ej. inge.martinez@constructora.com).",
        "Correo registrado en tu cuenta empresarial o personal"
      );
    } else {
      setFieldError(
        "field-login-email",
        "helper-login-email",
        null,
        "Correo registrado en tu cuenta empresarial o personal"
      );
    }

    setFieldError(
      "field-login-password",
      "helper-login-password",
      "Contraseña incorrecta. Verifica mayúsculas o usa la clave demo: FerrePro2026",
      "Mínimo 8 caracteres. Clave demo: FerrePro2026"
    );
  }

  function clearLoginErrors() {
    const banner = document.getElementById("login-error-banner");
    if (banner) banner.style.display = "none";

    setFieldError(
      "field-login-email",
      "helper-login-email",
      null,
      "Correo registrado en tu cuenta empresarial o personal"
    );
    setFieldError(
      "field-login-password",
      "helper-login-password",
      null,
      "Mínimo 8 caracteres. Clave demo: FerrePro2026"
    );
  }

  function initLoginScreen() {
    const form = document.getElementById("login-form");
    const emailInput = document.getElementById("login-email");
    const passInput = document.getElementById("login-password");
    const togglePassBtn = document.getElementById("toggle-password-btn");
    const simulateErrorBtn = document.getElementById("btn-simulate-login-error");
    const fillValidBtn = document.getElementById("btn-fill-valid-login");

    if (!form || !emailInput || !passInput) return;

    // Clear error state when typing
    emailInput.addEventListener("input", () => {
      setFieldError(
        "field-login-email",
        "helper-login-email",
        null,
        "Correo registrado en tu cuenta empresarial o personal"
      );
    });

    passInput.addEventListener("input", () => {
      setFieldError(
        "field-login-password",
        "helper-login-password",
        null,
        "Mínimo 8 caracteres. Clave demo: FerrePro2026"
      );
    });

    // Show / Hide password toggle
    if (togglePassBtn) {
      togglePassBtn.addEventListener("click", () => {
        const isPass = passInput.type === "password";
        passInput.type = isPass ? "text" : "password";
        togglePassBtn.setAttribute(
          "aria-label",
          isPass ? "Ocultar contraseña" : "Mostrar contraseña"
        );
        togglePassBtn.innerHTML = isPass
          ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
          : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
      });
    }

    // 1-Click Simulate Error State (Required by prompt: design validation with error state)
    if (simulateErrorBtn) {
      simulateErrorBtn.addEventListener("click", () => {
        emailInput.value = DATA.demoCredentials.email;
        passInput.value = "ClaveErronea123";
        triggerLoginErrorState(
          emailInput.value,
          passInput.value,
          "Error de autenticación (Código AUTH-401): La contraseña ingresada es incorrecta para inge.martinez@constructora.com."
        );
        passInput.focus();
      });
    }

    // 1-Click Fill Valid Credentials
    if (fillValidBtn) {
      fillValidBtn.addEventListener("click", () => {
        emailInput.value = DATA.demoCredentials.email;
        passInput.value = DATA.demoCredentials.password;
        clearLoginErrors();
        showSnackbar("Credenciales válidas cargadas. Haz clic en 'Iniciar Sesión'.", null);
      });
    }

    // Form Submit Handler
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailVal = emailInput.value.trim();
      const passVal = passInput.value;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailVal || !emailRegex.test(emailVal)) {
        triggerLoginErrorState(
          emailVal,
          passVal,
          "Por favor verifica el formato de tu correo electrónico antes de continuar."
        );
        emailInput.focus();
        return;
      }

      if (passVal !== DATA.demoCredentials.password) {
        triggerLoginErrorState(
          emailVal,
          passVal,
          "La contraseña ingresada es incorrecta. Verifica tus datos o utiliza el botón 'Usar Clave Correcta'."
        );
        passInput.focus();
        return;
      }

      clearLoginErrors();
      State.loginSuccess(emailVal, DATA.demoCredentials.userName);
      showSnackbar(
        `¡Sesión iniciada! Bienvenido, ${DATA.demoCredentials.userName}.`,
        "Ir al Catálogo",
        () => State.setScreen("catalog")
      );
    });
  }

  /* ------------------------------------------------------------------------
     PRODUCT CARD HTML BUILDER (Shared by Home Recognition Strip & Catalog)
     Applies Hick's Law (concise key specs) & Fitts's Law (large CTA/Stepper)
     ------------------------------------------------------------------------ */
  function createProductCardHTML(product) {
    const qtyInCart = State.getQuantityInCart(product.id);
    const svgArt = DATA.svgIcons[product.iconKey] || DATA.svgIcons.drill;
    const isLowStock = product.stock <= 10;

    const specsHTML = product.specs
      .slice(0, 3)
      .map((s) => `<span class="spec-tag">${s}</span>`)
      .join("");

    const oldPriceHTML = product.oldPrice
      ? `<span class="product-price__old">$${product.oldPrice.toFixed(2)}</span>`
      : "";

    const actionAreaHTML =
      qtyInCart > 0
        ? `<div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
             <div class="md-stepper" aria-label="Cantidad en carrito">
               <button type="button" class="md-stepper__btn" data-action="decrease-qty" data-product-id="${product.id}" aria-label="Disminuir cantidad">−</button>
               <span class="md-stepper__value">${qtyInCart}</span>
               <button type="button" class="md-stepper__btn" data-action="increase-qty" data-product-id="${product.id}" aria-label="Aumentar cantidad">+</button>
             </div>
             <button type="button" class="md-btn md-btn--tonal md-btn--sm" data-action="go-to-cart" style="flex:1;">
               En carrito (${qtyInCart}) →
             </button>
           </div>`
        : `<button type="button" class="md-btn md-btn--filled md-btn--full" data-action="add-to-cart" data-product-id="${product.id}">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
               <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
               <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
             </svg>
             Agregar al carrito
           </button>`;

    return `
      <article class="product-card" data-product-card="${product.id}">
        <div class="product-card__media" data-action="open-product-detail" data-product-id="${product.id}" title="Ver ficha técnica completa">
          <div class="product-card__badges">
            <span class="product-badge-brand">${product.brand}</span>
            <span class="product-badge-stock ${isLowStock ? "product-badge-stock--low" : ""}">
              ${isLowStock ? `Últimas ${product.stock} pzas` : `En stock (${product.stock})`}
            </span>
          </div>
          <div class="product-card__svg-wrap">${svgArt}</div>
        </div>
        <div class="product-card__body">
          <div class="product-card__sku">SKU: ${product.sku} · ${product.unit}</div>
          <h3 class="product-card__title" data-action="open-product-detail" data-product-id="${product.id}">
            ${product.name}
          </h3>
          <div class="product-card__specs">${specsHTML}</div>
        </div>
        <div class="product-card__footer">
          <div class="product-card__price-row">
            <div>
              <span class="product-price">$${product.price.toFixed(2)}</span>
              <span class="product-price__unit">USD / ${product.unit}</span>
              ${oldPriceHTML}
            </div>
          </div>
          ${actionAreaHTML}
        </div>
      </article>
    `;
  }

  /* ------------------------------------------------------------------------
     SCREEN 2: RENDER HOME SCREEN (RECOGNITION OVER RECALL)
     ------------------------------------------------------------------------ */
  function renderHomeScreen(currentState) {
    // 1. Render Quick Shortcuts (Accesos Directos)
    const shortcutsContainer = document.getElementById("home-shortcuts-grid");
    if (shortcutsContainer) {
      shortcutsContainer.innerHTML = DATA.quickShortcuts
        .map(
          (sc) => `
          <button type="button" class="shortcut-card" data-shortcut-id="${sc.id}">
            <div class="shortcut-card__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div>
              <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
                <span class="shortcut-card__title">${sc.title}</span>
              </div>
              <p class="shortcut-card__meta">${sc.subtitle}</p>
              <span class="spec-tag" style="display:inline-block; margin-top:6px; color:var(--md-sys-color-primary); font-weight:700;">
                ${sc.badge}
              </span>
            </div>
          </button>
        `
        )
        .join("");
    }

    // 2. Render Principal Categories (with visual icons & concrete examples for Recognition)
    const categoriesContainer = document.getElementById("home-categories-grid");
    if (categoriesContainer) {
      categoriesContainer.innerHTML = DATA.categories
        .map((cat) => {
          const iconSvg = DATA.svgIcons[cat.iconKey] || DATA.svgIcons.drill;
          return `
            <button type="button" class="category-card" data-action="select-category" data-category-id="${cat.id}">
              <div>
                <div class="category-card__top">
                  <div class="category-card__icon">${iconSvg}</div>
                  <span class="category-card__count">${cat.itemCount} artículos</span>
                </div>
                <h3 class="md-title-medium">${cat.name}</h3>
                <p class="category-card__examples">${cat.examples}</p>
              </div>
              <div style="display:flex; align-items:center; justify-content:space-between; width:100%; padding-top:8px; border-top:1px solid var(--md-sys-color-outline-variant);">
                <span class="md-body-small" style="font-weight:600;">${cat.highlight}</span>
                <span class="category-card__cta">Explorar →</span>
              </div>
            </button>
          `;
        })
        .join("");
    }

    // 3. Render Recently Viewed / Recognized Essential Products
    const recognitionGrid = document.getElementById("home-recognition-products");
    if (recognitionGrid) {
      const recentProducts = currentState.recentlyViewed
        .map((id) => DATA.products.find((p) => p.id === id))
        .filter(Boolean);

      recognitionGrid.innerHTML = recentProducts
        .map((product) => createProductCardHTML(product))
        .join("");
    }
  }

  /* ------------------------------------------------------------------------
     SCREEN 3: RENDER CATALOG SCREEN
     ------------------------------------------------------------------------ */
  function renderCatalogScreen(currentState) {
    const { category, search, sortBy } = currentState.catalog;

    // 1. Render Category Filter Chips (Hick's Law)
    const chipContainer = document.getElementById("catalog-category-chips");
    if (chipContainer) {
      const allChip = `
        <button type="button" class="md-chip ${category === "all" ? "is-selected" : ""}" data-action="filter-chip" data-category-id="all">
          ${category === "all" ? "✓ " : ""}Todas las categorías (${DATA.products.length})
        </button>
      `;

      const catChips = DATA.categories
        .map((cat) => {
          const isSelected = category === cat.id;
          return `
            <button type="button" class="md-chip ${isSelected ? "is-selected" : ""}" data-action="filter-chip" data-category-id="${cat.id}">
              ${isSelected ? "✓ " : ""}${cat.name} (${cat.itemCount})
            </button>
          `;
        })
        .join("");

      chipContainer.innerHTML = allChip + catChips;
    }

    // 2. Sync Search & Sort Controls
    const searchInput = document.getElementById("catalog-search-input");
    if (searchInput && document.activeElement !== searchInput) {
      searchInput.value = search;
    }

    const sortSelect = document.getElementById("catalog-sort-select");
    if (sortSelect) {
      sortSelect.value = sortBy;
    }

    // 3. Filter and Sort Products
    const normalizedQuery = search.trim().toLowerCase();
    let filtered = DATA.products.filter((prod) => {
      const matchesCat = category === "all" || prod.category === category;
      if (!matchesCat) return false;
      if (!normalizedQuery) return true;

      const haystack = `${prod.name} ${prod.brand} ${prod.sku} ${prod.specs.join(" ")}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });

    if (sortBy === "price-asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "name-asc") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      filtered.sort((a, b) => Number(b.featured) - Number(a.featured));
    }

    // 4. Update Counter & Product Grid
    const countLabel = document.getElementById("catalog-results-count");
    if (countLabel) {
      countLabel.textContent = `Mostrando ${filtered.length} de ${DATA.products.length} productos disponibles`;
    }

    const productsGrid = document.getElementById("catalog-products-grid");
    if (!productsGrid) return;

    if (filtered.length === 0) {
      productsGrid.innerHTML = `
        <div class="cart-empty-card" style="grid-column: 1 / -1; padding: var(--space-8);">
          <h3 class="md-headline-small" style="margin-bottom: var(--space-2);">
            Sin coincidencias para "${search}"
          </h3>
          <p class="md-body-medium" style="color: var(--md-sys-color-on-surface-variant); margin-bottom: var(--space-5);">
            Intenta buscar por nombre de herramienta (ej. "Taladro", "Cable 12 AWG", "Llaves") o restablece los filtros.
          </p>
          <button type="button" class="md-btn md-btn--filled" data-action="reset-catalog-filters">
            Restablecer todos los filtros
          </button>
        </div>
      `;
    } else {
      productsGrid.innerHTML = filtered.map((p) => createProductCardHTML(p)).join("");
    }
  }

  /* ------------------------------------------------------------------------
     SCREEN 4: RENDER CART / CHECKOUT SCREEN (INCLUDES EMPTY STATE)
     ------------------------------------------------------------------------ */
  function renderCartScreen(currentState) {
    const summary = State.getCartSummary();
    const emptyStateEl = document.getElementById("cart-empty-state");
    const filledStateEl = document.getElementById("cart-filled-state");
    const toggleEmptyBtn = document.getElementById("btn-toggle-cart-state");

    if (!emptyStateEl || !filledStateEl) return;

    // Update top helper button to quickly test Empty vs Populated Cart
    if (toggleEmptyBtn) {
      if (summary.items.length === 0) {
        toggleEmptyBtn.textContent = "⚡ Cargar 3 artículos de prueba";
        toggleEmptyBtn.setAttribute("data-cart-demo-mode", "load");
      } else {
        toggleEmptyBtn.textContent = "🗑️ Vaciar carrito (Ver Estado Vacío)";
        toggleEmptyBtn.setAttribute("data-cart-demo-mode", "clear");
      }
    }

    // Show Alternative Empty State if no items selected
    if (summary.items.length === 0) {
      emptyStateEl.style.display = "block";
      filledStateEl.style.display = "none";
      return;
    }

    emptyStateEl.style.display = "none";
    filledStateEl.style.display = "grid";

    // Render Selected Cart Items
    const listEl = document.getElementById("cart-items-container");
    if (listEl) {
      listEl.innerHTML = summary.items
        .map((item) => {
          const svgIcon = DATA.svgIcons[item.iconKey] || DATA.svgIcons.drill;
          return `
            <article class="cart-item-card">
              <div class="cart-item-card__thumb">${svgIcon}</div>
              <div>
                <div class="product-card__sku">SKU: ${item.sku} · ${item.brand}</div>
                <h3 class="md-title-medium" style="margin: 2px 0 4px;">${item.name}</h3>
                <div class="md-body-small">
                  Precio unitario: <strong>${formatUSD(item.price)}</strong> (${item.unit})
                </div>
              </div>
              <div class="cart-item-card__actions">
                <div class="md-title-medium" style="color: var(--md-sys-color-primary);">
                  ${formatUSD(item.lineTotal)}
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <div class="md-stepper" aria-label="Modificar cantidad de ${item.name}">
                    <button type="button" class="md-stepper__btn" data-action="decrease-qty" data-product-id="${item.id}" title="Reducir cantidad">−</button>
                    <span class="md-stepper__value">${item.quantity}</span>
                    <button type="button" class="md-stepper__btn" data-action="increase-qty" data-product-id="${item.id}" title="Aumentar cantidad">+</button>
                  </div>
                  <button type="button" class="md-icon-btn" data-action="remove-item" data-product-id="${item.id}" title="Eliminar artículo del pedido" aria-label="Eliminar artículo">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          `;
        })
        .join("");
    }

    // Sync Radio Cards for Delivery & Payment
    document.querySelectorAll("[data-delivery-option]").forEach((card) => {
      const val = card.getAttribute("data-delivery-option");
      const isSelected = val === currentState.checkout.deliveryMethod;
      card.classList.toggle("is-selected", isSelected);
      const radio = card.querySelector("input[type='radio']");
      if (radio) radio.checked = isSelected;
    });

    document.querySelectorAll("[data-payment-option]").forEach((card) => {
      const val = card.getAttribute("data-payment-option");
      const isSelected = val === currentState.checkout.paymentMethod;
      card.classList.toggle("is-selected", isSelected);
      const radio = card.querySelector("input[type='radio']");
      if (radio) radio.checked = isSelected;
    });

    // Update Summary Numbers
    const subtotalEl = document.getElementById("summary-subtotal");
    const discountRowEl = document.getElementById("summary-discount-row");
    const discountEl = document.getElementById("summary-discount");
    const shippingEl = document.getElementById("summary-shipping");
    const taxEl = document.getElementById("summary-tax");
    const totalEl = document.getElementById("summary-total");
    const ctaBtnText = document.getElementById("checkout-primary-cta-text");

    if (subtotalEl) subtotalEl.textContent = formatUSD(summary.subtotal);
    if (discountRowEl && discountEl) {
      discountRowEl.style.display = summary.discount > 0 ? "flex" : "none";
      discountEl.textContent = "−" + formatUSD(summary.discount);
    }
    if (shippingEl) {
      shippingEl.textContent =
        summary.shipping === 0 ? "GRATIS ($0.00 USD)" : formatUSD(summary.shipping);
    }
    if (taxEl) taxEl.textContent = formatUSD(summary.tax);
    if (totalEl) totalEl.textContent = formatUSD(summary.total);
    if (ctaBtnText) {
      ctaBtnText.textContent = `Confirmar y Pagar Pedido · ${formatUSD(summary.total)}`;
    }
  }

  /* ------------------------------------------------------------------------
     MODALS: Product Technical Detail Dialog & Order Confirmation Dialog
     ------------------------------------------------------------------------ */
  function openProductDetailModal(productId) {
    const product = DATA.products.find((p) => p.id === productId);
    if (!product) return;

    State.recordRecentlyViewed(productId);
    const scrim = document.getElementById("product-detail-dialog");
    const content = document.getElementById("product-detail-content");
    if (!scrim || !content) return;

    const svgArt = DATA.svgIcons[product.iconKey] || DATA.svgIcons.drill;
    const specsList = product.specs
      .map((s) => `<li class="spec-tag" style="font-size:0.85rem; padding:4px 10px;">✓ ${s}</li>`)
      .join("");

    content.innerHTML = `
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:16px;">
        <div>
          <span class="product-badge-brand">${product.brand}</span>
          <span class="product-card__sku" style="margin-left:8px;">SKU: ${product.sku}</span>
          <h2 class="md-headline-small" style="margin-top:6px;">${product.name}</h2>
        </div>
        <button type="button" class="md-icon-btn" data-action="close-modals" aria-label="Cerrar ventana">✕</button>
      </div>
      <div style="display:flex; align-items:center; justify-content:center; background:var(--md-sys-color-surface-container); border-radius:16px; padding:24px; margin-bottom:16px;">
        <div style="transform:scale(1.3);">${svgArt}</div>
      </div>
      <p class="md-body-large" style="color:var(--md-sys-color-on-surface-variant); margin-bottom:16px;">
        ${product.description}
      </p>
      <div style="margin-bottom:20px;">
        <div class="md-label-medium" style="margin-bottom:8px; color:var(--md-sys-color-on-surface-variant);">
          ESPECIFICACIONES TÉCNICAS:
        </div>
        <ul style="display:flex; flex-wrap:wrap; gap:8px;">${specsList}</ul>
      </div>
      <div style="display:flex; align-items:center; justify-content:space-between; padding-top:16px; border-top:1px solid var(--md-sys-color-outline-variant); gap:16px;">
        <div>
          <div class="product-price">${formatUSD(product.price)}</div>
          <div class="md-body-small">Unidad de venta: ${product.unit} · Stock: ${product.stock} disp.</div>
        </div>
        <button type="button" class="md-btn md-btn--filled md-btn--cta-xl" data-action="add-from-modal" data-product-id="${product.id}">
          Agregar al pedido
        </button>
      </div>
    `;

    scrim.classList.add("is-open");
  }

  function openOrderConfirmationModal(order) {
    const scrim = document.getElementById("order-confirm-dialog");
    const content = document.getElementById("order-confirm-content");
    if (!scrim || !content || !order) return;

    const itemsRows = order.summary.items
      .map(
        (item) => `
        <li style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px dashed var(--md-sys-color-outline-variant); font-size:0.88rem;">
          <span><strong>${item.quantity}x</strong> ${item.name}</span>
          <span class="font-mono">${formatUSD(item.lineTotal)}</span>
        </li>
      `
      )
      .join("");

    content.innerHTML = `
      <div style="text-align:center; margin-bottom:20px;">
        <div style="width:68px; height:68px; border-radius:50%; background:var(--md-sys-color-success-container); color:var(--md-sys-color-on-success-container); display:grid; place-items:center; margin:0 auto 14px;">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <span class="ux-pill">Folio de Orden: <strong>${order.folio}</strong></span>
        <h2 class="md-headline-small" style="margin-top:10px;">¡Compra Confirmada con Éxito!</h2>
        <p class="md-body-medium" style="color:var(--md-sys-color-on-surface-variant); margin-top:4px;">
          ${order.date} · Preparando salida de almacén para <strong>${order.checkout.recipientName}</strong>
        </p>
      </div>

      <div style="background:var(--md-sys-color-surface-container-lowest); border-radius:16px; padding:16px; border:1px solid var(--md-sys-color-outline-variant); margin-bottom:20px;">
        <div class="md-label-medium" style="margin-bottom:8px; color:var(--md-sys-color-primary);">
          RESUMEN DE HERRAMIENTAS E INSUMOS (${order.summary.itemCount} unidades)
        </div>
        <ul style="margin-bottom:12px;">${itemsRows}</ul>
        <div style="display:flex; justify-content:space-between; font-weight:800; font-size:1.1rem; padding-top:6px;">
          <span>Total Pagado (IVA incluido):</span>
          <span style="color:var(--md-sys-color-primary);">${formatUSD(order.summary.total)}</span>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <button type="button" class="md-btn md-btn--tonal" data-action="close-modals-and-home">
          Volver al Inicio
        </button>
        <button type="button" class="md-btn md-btn--filled" data-action="close-modals-and-catalog">
          Seguir Comprando
        </button>
      </div>
    `;

    scrim.classList.add("is-open");
  }

  function closeAllModals() {
    document.querySelectorAll(".md-dialog-scrim.is-open").forEach((el) => {
      el.classList.remove("is-open");
    });
  }

  /* ------------------------------------------------------------------------
     GLOBAL EVENT DELEGATION & INTERACTION BINDINGS
     ------------------------------------------------------------------------ */
  function bindGlobalEvents() {
    // 1. Navigation clicks (Top App Bar, UX Bar, Action links)
    document.addEventListener("click", (e) => {
      // Screen navigation
      const navTrigger = e.target.closest("[data-nav-target]");
      if (navTrigger) {
        const targetScreen = navTrigger.getAttribute("data-nav-target");
        State.setScreen(targetScreen);
        return;
      }

      // Theme toggle
      if (e.target.closest("#btn-theme-toggle")) {
        State.toggleTheme();
        return;
      }

      // Quick UX Bar: Jump directly to Login Error State
      if (e.target.closest("#ux-btn-test-login-error")) {
        State.setScreen("login");
        setTimeout(() => {
          const btn = document.getElementById("btn-simulate-login-error");
          if (btn) btn.click();
        }, 120);
        return;
      }

      // Quick UX Bar: Jump directly to Empty Cart State
      if (e.target.closest("#ux-btn-test-empty-cart")) {
        State.clearCart();
        State.setScreen("cart");
        showSnackbar("Mostrando diseño de Estado Vacío en Pantalla de Compra.", "Cargar kit demo", () => {
          State.loadSampleOrder();
        });
        return;
      }

      // Home Quick Shortcuts
      const shortcutCard = e.target.closest("[data-shortcut-id]");
      if (shortcutCard) {
        const scId = shortcutCard.getAttribute("data-shortcut-id");
        const sc = DATA.quickShortcuts.find((item) => item.id === scId);
        if (sc) {
          if (sc.actionType === "filter-category") {
            State.setCatalogFilter({ category: sc.target, search: "" });
            State.setScreen("catalog");
          } else if (sc.actionType === "load-sample-order") {
            State.loadSampleOrder(sc.target);
            State.setScreen("cart");
            showSnackbar("Pedido frecuente de obra cargado al carrito (3 productos).", null);
          }
        }
        return;
      }

      // Category selection from Home or Empty Cart
      const catBtn = e.target.closest("[data-action='select-category']");
      if (catBtn) {
        const catId = catBtn.getAttribute("data-category-id");
        State.setCatalogFilter({ category: catId, search: "" });
        State.setScreen("catalog");
        return;
      }

      // Recognition search tag click on Home
      const recTag = e.target.closest("[data-recognition-search]");
      if (recTag) {
        const term = recTag.getAttribute("data-recognition-search");
        State.setCatalogFilter({ category: "all", search: term });
        State.setScreen("catalog");
        return;
      }

      // Catalog Filter Chip
      const filterChip = e.target.closest("[data-action='filter-chip']");
      if (filterChip) {
        const catId = filterChip.getAttribute("data-category-id");
        State.setCatalogFilter({ category: catId });
        return;
      }

      // Reset Catalog Filters
      if (e.target.closest("[data-action='reset-catalog-filters']")) {
        State.setCatalogFilter({ category: "all", search: "", sortBy: "featured" });
        return;
      }

      // Add to Cart
      const addBtn = e.target.closest("[data-action='add-to-cart']");
      if (addBtn) {
        const prodId = addBtn.getAttribute("data-product-id");
        const added = State.addToCart(prodId, 1);
        if (added) {
          showSnackbar(`${added.name} agregado al carrito.`);
        }
        return;
      }

      // Add from Modal
      const addModalBtn = e.target.closest("[data-action='add-from-modal']");
      if (addModalBtn) {
        const prodId = addModalBtn.getAttribute("data-product-id");
        const added = State.addToCart(prodId, 1);
        closeAllModals();
        if (added) {
          showSnackbar(`${added.name} agregado al carrito.`);
        }
        return;
      }

      // Stepper Increase / Decrease
      const incBtn = e.target.closest("[data-action='increase-qty']");
      if (incBtn) {
        const prodId = incBtn.getAttribute("data-product-id");
        State.addToCart(prodId, 1);
        return;
      }

      const decBtn = e.target.closest("[data-action='decrease-qty']");
      if (decBtn) {
        const prodId = decBtn.getAttribute("data-product-id");
        State.addToCart(prodId, -1);
        return;
      }

      // Remove item from cart
      const removeBtn = e.target.closest("[data-action='remove-item']");
      if (removeBtn) {
        const prodId = removeBtn.getAttribute("data-product-id");
        State.removeFromCart(prodId);
        showSnackbar("Artículo eliminado del carrito.", "Deshacer", () => {
          State.addToCart(prodId, 1);
        });
        return;
      }

      // Go to cart
      if (e.target.closest("[data-action='go-to-cart']")) {
        State.setScreen("cart");
        return;
      }

      // Open product detail modal
      const detailTrigger = e.target.closest("[data-action='open-product-detail']");
      if (detailTrigger) {
        const prodId = detailTrigger.getAttribute("data-product-id");
        openProductDetailModal(prodId);
        return;
      }

      // Close modals
      if (
        e.target.closest("[data-action='close-modals']") ||
        e.target.classList.contains("md-dialog-scrim")
      ) {
        closeAllModals();
        return;
      }

      if (e.target.closest("[data-action='close-modals-and-home']")) {
        closeAllModals();
        State.setScreen("home");
        return;
      }

      if (e.target.closest("[data-action='close-modals-and-catalog']")) {
        closeAllModals();
        State.setScreen("catalog");
        return;
      }

      // Toggle Empty Cart vs Demo Cart on Cart Screen
      const toggleCartStateBtn = e.target.closest("#btn-toggle-cart-state");
      if (toggleCartStateBtn) {
        const mode = toggleCartStateBtn.getAttribute("data-cart-demo-mode");
        if (mode === "clear") {
          State.clearCart();
          showSnackbar("Carrito vaciado. Mostrando estado vacío alternativo.", null);
        } else {
          State.loadSampleOrder();
          showSnackbar("Kit de muestra cargado en el carrito.", null);
        }
        return;
      }

      // Load sample kit from Empty State button
      if (e.target.closest("#btn-empty-load-kit")) {
        State.loadSampleOrder();
        showSnackbar("Kit básico de obra cargado al carrito.", null);
        return;
      }

      // Delivery option radio cards
      const deliveryCard = e.target.closest("[data-delivery-option]");
      if (deliveryCard) {
        const method = deliveryCard.getAttribute("data-delivery-option");
        State.updateCheckoutField("deliveryMethod", method);
        return;
      }

      // Payment option radio cards
      const paymentCard = e.target.closest("[data-payment-option]");
      if (paymentCard) {
        const method = paymentCard.getAttribute("data-payment-option");
        State.updateCheckoutField("paymentMethod", method);
        return;
      }
    });

    // 2. Home Hero Search Form
    const homeSearchForm = document.getElementById("home-search-form");
    if (homeSearchForm) {
      homeSearchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = document.getElementById("home-search-input");
        const query = input ? input.value.trim() : "";
        State.setCatalogFilter({ category: "all", search: query });
        State.setScreen("catalog");
      });
    }

    // 3. Catalog Live Search & Sort
    const catalogSearchInput = document.getElementById("catalog-search-input");
    if (catalogSearchInput) {
      catalogSearchInput.addEventListener("input", (e) => {
        State.setCatalogFilter({ search: e.target.value });
      });
    }

    const catalogSortSelect = document.getElementById("catalog-sort-select");
    if (catalogSortSelect) {
      catalogSortSelect.addEventListener("change", (e) => {
        State.setCatalogFilter({ sortBy: e.target.value });
      });
    }

    // 4. Checkout Form Submission (End-to-End Purchase Flow)
    const checkoutForm = document.getElementById("checkout-form");
    if (checkoutForm) {
      checkoutForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const nameInput = document.getElementById("checkout-recipient");
        const addressInput = document.getElementById("checkout-address");

        if (nameInput && !nameInput.value.trim()) {
          nameInput.focus();
          showSnackbar("Ingresa el nombre de quien recibe el pedido.", null);
          return;
        }

        if (nameInput) State.updateCheckoutField("recipientName", nameInput.value.trim());
        if (addressInput) State.updateCheckoutField("branchOrAddress", addressInput.value.trim());

        const completedOrder = State.completePurchase();
        if (completedOrder) {
          openOrderConfirmationModal(completedOrder);
        }
      });
    }

    // Escape key closes modals
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAllModals();
    });
  }

  /* ------------------------------------------------------------------------
     MAIN RENDER LOOP & INITIALIZATION
     ------------------------------------------------------------------------ */
  function renderApp(currentState) {
    document.documentElement.setAttribute("data-theme", currentState.theme);
    renderNavigation(currentState);
    renderHomeScreen(currentState);
    renderCatalogScreen(currentState);
    renderCartScreen(currentState);
  }

  document.addEventListener("DOMContentLoaded", () => {
    attachRippleEffect();
    initLoginScreen();
    bindGlobalEvents();
    State.subscribe(renderApp);
    renderApp(State.get());
  });
})();
