/* ==========================================================================
   SPA STATE MANAGEMENT & BUSINESS LOGIC
   Handles Navigation, Auth, Recognition History, Cart & Checkout Calculations
   ========================================================================== */

(function () {
  const STORAGE_KEY = "ferremax_m3_spa_state_v1";

  const defaultState = {
    currentScreen: "login", // 'login' | 'home' | 'catalog' | 'cart'
    theme: "light",
    auth: {
      isAuthenticated: false,
      email: "inge.martinez@constructora.com",
      userName: "Ing. Roberto Martínez",
      company: "Constructora del Valle S.A."
    },
    catalog: {
      category: "all",
      search: "",
      sortBy: "featured" // 'featured' | 'price-asc' | 'price-desc' | 'name-asc'
    },
    /* Pre-populated recognition history so the Home screen immediately shows familiar items */
    recentlyViewed: ["DEW-DCD7781", "FLU-117-PRO", "IND-THW12-100", "URR-1214M"],
    /* Start with 2 realistic items in cart so user can inspect populated checkout or toggle Empty State */
    cart: [
      { productId: "DEW-DCD7781", quantity: 1 },
      { productId: "FIS-SX8-100", quantity: 2 }
    ],
    checkout: {
      deliveryMethod: "pickup", // 'pickup' (Free, 1h) | 'shipping' ($12.00 USD or Free > $250)
      paymentMethod: "card",    // 'card' | 'transfer'
      recipientName: "Ing. Roberto Martínez",
      branchOrAddress: "Sucursal Industrial Norte — Bahía de Carga Express #3",
      taxId: "CVA-940812-8R1"
    },
    lastOrder: null
  };

  function loadPersistedState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(defaultState);
      const parsed = JSON.parse(raw);
      return {
        ...structuredClone(defaultState),
        ...parsed,
        auth: { ...defaultState.auth, ...(parsed.auth || {}) },
        catalog: { ...defaultState.catalog, ...(parsed.catalog || {}) },
        checkout: { ...defaultState.checkout, ...(parsed.checkout || {}) }
      };
    } catch (_err) {
      return structuredClone(defaultState);
    }
  }

  const state = loadPersistedState();
  const listeners = new Set();

  function saveAndNotify() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_e) {
      // Ignore storage quota errors in restricted environments
    }
    listeners.forEach((fn) => fn(state));
  }

  window.FerreState = {
    get() {
      return state;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    setScreen(screenId) {
      const validScreens = ["login", "home", "catalog", "cart"];
      if (!validScreens.includes(screenId)) return;
      state.currentScreen = screenId;
      saveAndNotify();
      window.scrollTo({ top: 0, behavior: "smooth" });
    },

    toggleTheme() {
      state.theme = state.theme === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", state.theme);
      saveAndNotify();
    },

    loginSuccess(email, userName) {
      state.auth.isAuthenticated = true;
      state.auth.email = email;
      state.auth.userName = userName || "Ing. Roberto Martínez";
      state.currentScreen = "home";
      saveAndNotify();
      window.scrollTo({ top: 0, behavior: "smooth" });
    },

    logout() {
      state.auth.isAuthenticated = false;
      state.currentScreen = "login";
      saveAndNotify();
    },

    setCatalogFilter({ category, search, sortBy }) {
      if (category !== undefined) state.catalog.category = category;
      if (search !== undefined) state.catalog.search = search;
      if (sortBy !== undefined) state.catalog.sortBy = sortBy;
      saveAndNotify();
    },

    recordRecentlyViewed(productId) {
      const filtered = state.recentlyViewed.filter((id) => id !== productId);
      state.recentlyViewed = [productId, ...filtered].slice(0, 4);
      saveAndNotify();
    },

    getCartItemCount() {
      return state.cart.reduce((sum, item) => sum + item.quantity, 0);
    },

    getQuantityInCart(productId) {
      const found = state.cart.find((item) => item.productId === productId);
      return found ? found.quantity : 0;
    },

    addToCart(productId, delta = 1) {
      const product = window.FERREMAX_DATA.products.find((p) => p.id === productId);
      if (!product) return null;

      const existing = state.cart.find((item) => item.productId === productId);
      if (existing) {
        const nextQty = Math.min(product.stock, existing.quantity + delta);
        if (nextQty <= 0) {
          state.cart = state.cart.filter((item) => item.productId !== productId);
        } else {
          existing.quantity = nextQty;
        }
      } else if (delta > 0) {
        state.cart.push({ productId, quantity: Math.min(product.stock, delta) });
      }

      this.recordRecentlyViewed(productId);
      saveAndNotify();
      return product;
    },

    setItemQuantity(productId, quantity) {
      const product = window.FERREMAX_DATA.products.find((p) => p.id === productId);
      if (!product) return;

      if (quantity <= 0) {
        state.cart = state.cart.filter((item) => item.productId !== productId);
      } else {
        const existing = state.cart.find((item) => item.productId === productId);
        const clamped = Math.min(product.stock, quantity);
        if (existing) {
          existing.quantity = clamped;
        } else {
          state.cart.push({ productId, quantity: clamped });
        }
      }
      saveAndNotify();
    },

    removeFromCart(productId) {
      state.cart = state.cart.filter((item) => item.productId !== productId);
      saveAndNotify();
    },

    clearCart() {
      state.cart = [];
      saveAndNotify();
    },

    loadSampleOrder(productIds) {
      const ids = productIds || ["DEW-DCD7781", "IND-THW12-100", "FIS-SX8-100"];
      ids.forEach((id) => {
        const existing = state.cart.find((item) => item.productId === id);
        if (!existing) {
          state.cart.push({ productId: id, quantity: 1 });
        }
      });
      saveAndNotify();
    },

    updateCheckoutField(key, value) {
      if (key in state.checkout) {
        state.checkout[key] = value;
        saveAndNotify();
      }
    },

    getCartSummary() {
      const detailedItems = state.cart
        .map((entry) => {
          const product = window.FERREMAX_DATA.products.find((p) => p.id === entry.productId);
          if (!product) return null;
          return {
            ...product,
            quantity: entry.quantity,
            lineTotal: +(product.price * entry.quantity).toFixed(2)
          };
        })
        .filter(Boolean);

      const subtotal = +detailedItems.reduce((acc, item) => acc + item.lineTotal, 0).toFixed(2);
      // 5% professional contractor discount on orders >= $180.00 USD
      const discount = subtotal >= 180 ? +(subtotal * 0.05).toFixed(2) : 0;
      const discountedSubtotal = +(subtotal - discount).toFixed(2);

      let shipping = 0;
      if (detailedItems.length > 0 && state.checkout.deliveryMethod === "shipping") {
        shipping = discountedSubtotal >= 250 ? 0 : 12.0;
      }

      const tax = +((discountedSubtotal + shipping) * 0.16).toFixed(2);
      const total = +(discountedSubtotal + shipping + tax).toFixed(2);

      return {
        items: detailedItems,
        itemCount: detailedItems.reduce((acc, i) => acc + i.quantity, 0),
        subtotal,
        discount,
        shipping,
        tax,
        total
      };
    },

    completePurchase() {
      const summary = this.getCartSummary();
      if (summary.items.length === 0) return null;

      const folio = "FMX-" + Math.floor(100000 + Math.random() * 900000);
      const orderRecord = {
        folio,
        date: new Date().toLocaleDateString("es-MX", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
        summary,
        checkout: { ...state.checkout }
      };

      state.lastOrder = orderRecord;
      state.cart = [];
      saveAndNotify();
      return orderRecord;
    }
  };
})();
