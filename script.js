const STORAGE_KEY = "armonBoutiqueState";
const storeConfig = window.ARMON_STORE || { products: [], videos: [], freeShippingMin: 2499, standardShipping: 99 };

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".main-nav a");
const fitProductGrid = document.querySelector("#fitProductGrid");
const casualProductGrid = document.querySelector("#casualProductGrid");
const reelsGrid = document.querySelector("#reelsGrid");
const cartToast = document.querySelector(".cart-toast");
const cartCount = document.querySelector("#cartCount");
const cartIcon = document.querySelector("#openCart");
const cartPanel = document.querySelector("#cartPanel");
const favoritesIcon = document.querySelector("#openFavorites");
const favoritesPanel = document.querySelector("#favoritesPanel");
const favoritesCount = document.querySelector("#favoritesCount");
const favoritesItems = document.querySelector("#favoritesItems");
const cartItems = document.querySelector("#cartItems");
const cartSubtotal = document.querySelector("#cartSubtotal");
const cartShipping = document.querySelector("#cartShipping");
const cartTotal = document.querySelector("#cartTotal");
const cartShippingNote = document.querySelector("#cartShippingNote");
const clearCartButton = document.querySelector("#clearCart");
const checkoutButton = document.querySelector("#checkoutButton");
const searchPanel = document.querySelector("#searchPanel");
const searchForm = document.querySelector(".search-form");
const searchInput = document.querySelector("#searchInput");
const searchResults = document.querySelector("#searchResults");
const profilePanel = document.querySelector("#profilePanel");
const profileForm = document.querySelector(".profile-form");
const profileStatus = document.querySelector("#profileStatus");
const clearSavedDataButton = document.querySelector("#clearSavedData");
const panelScrim = document.querySelector(".panel-scrim");
const closePanelButtons = document.querySelectorAll("[data-close-panels]");
const lazyImageElements = document.querySelectorAll(".editorial-image, .category-card");
const productDetailPanel = document.querySelector("#productDetailPanel");
const productDetailImage = document.querySelector("#productDetailImage");
const productDetailTagline = document.querySelector("#productDetailTagline");
const productDetailTitle = document.querySelector("#productDetailTitle");
const productDetailPrice = document.querySelector("#productDetailPrice");
const productDetailShipping = document.querySelector("#productDetailShipping");
const productDetailDescription = document.querySelector("#productDetailDescription");
const productDetailSizes = document.querySelector("#productDetailSizes");
const productDetailMaterial = document.querySelector("#productDetailMaterial");
const productDetailCare = document.querySelector("#productDetailCare");
const productDetailDelivery = document.querySelector("#productDetailDelivery");
const productDetailAddCart = document.querySelector("#productDetailAddCart");
const productDetailFavorite = document.querySelector("#productDetailFavorite");
const productDetailWhatsApp = document.querySelector("#productDetailWhatsApp");
const categoryLinks = document.querySelectorAll("[data-category-filter]");
const helpLinks = document.querySelectorAll("[data-help-topic]");

let productCards = [];
let products = [];
let activeProductId = null;
let toastTimer;
let highlightedTimer;
let detailScrollY = 0;

const defaultState = {
  cart: {},
  favorites: [],
  profile: { name: "", email: "", phone: "" },
  lastSearch: "",
  lastCategory: "",
  lastAction: "",
};

let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      ...defaultState,
      ...saved,
      profile: { ...defaultState.profile, ...(saved?.profile || {}) },
      cart: saved?.cart || {},
      favorites: Array.isArray(saved?.favorites) ? saved.favorites : [],
    };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatPrice(value) {
  return `$${value.toLocaleString("es-MX")} MXN`;
}

function getProduct(id) {
  return products.find((product) => product.id === id);
}

function getShippingCost(subtotal) {
  if (!subtotal) return 0;
  return subtotal >= storeConfig.freeShippingMin ? 0 : storeConfig.standardShipping;
}

function shippingLabel(subtotal) {
  const cost = getShippingCost(subtotal);
  if (!subtotal) return "—";
  return cost === 0 ? "Gratis" : formatPrice(cost);
}

function freeShippingHint(subtotal) {
  if (!subtotal || subtotal >= storeConfig.freeShippingMin) {
    return subtotal >= storeConfig.freeShippingMin ? "Tu pedido califica para envío gratis." : "";
  }
  const remaining = storeConfig.freeShippingMin - subtotal;
  return `Agrega ${formatPrice(remaining)} más para envío gratis.`;
}

function renderProductCard(product) {
  return `
    <article
      class="product-card"
      data-product-id="${product.id}"
      data-product-name="${product.name}"
      data-product-price="${product.price}"
      data-product-category="${product.category}"
      data-accent-color="${product.accentColor}"
      tabindex="0"
      role="button"
      aria-label="Ver ${product.name}"
    >
      <button class="favorite-button" type="button" aria-label="Guardar ${product.name}" aria-pressed="false">
        <span aria-hidden="true">&#9825;</span>
      </button>
      <img
        class="product-photo"
        src="${product.image}"
        alt="${product.alt}"
        width="400"
        height="400"
        loading="lazy"
        decoding="async"
        fetchpriority="low"
      />
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="product-price">${formatPrice(product.price)}</p>
        <button class="cart-button" type="button">Agregar al carrito</button>
      </div>
    </article>
  `;
}

function renderProductGrids() {
  products = storeConfig.products.map((product) => ({ ...product, card: null }));

  if (fitProductGrid) {
    const fitItems = products.filter((product) => product.category === "Fit");
    fitProductGrid.innerHTML = fitItems.map((product) => renderProductCard(product)).join("");
  }

  if (casualProductGrid) {
    const casualItems = products.filter((product) => product.category === "Casual");
    casualProductGrid.innerHTML = casualItems.map((product) => renderProductCard(product)).join("");
  }

  productCards = [...document.querySelectorAll(".product-card")];
  products.forEach((product) => {
    product.card = productCards.find((card) => card.dataset.productId === product.id) || null;
  });
}

function renderReels() {
  if (!reelsGrid || !storeConfig.videos?.length) return;

  reelsGrid.innerHTML = storeConfig.videos
    .map(
      (video) => `
        <article class="reel-card" data-video-id="${video.id}">
          <video
            class="reel-video"
            muted
            playsinline
            loop
            preload="none"
            poster="${video.poster}"
            data-src="${video.src}"
            aria-label="${video.label}"
          ></video>
          <button class="reel-play" type="button" aria-label="Reproducir ${video.label}">
            <span aria-hidden="true">▶</span>
          </button>
          <p class="reel-label">${video.label}</p>
        </article>
      `
    )
    .join("");
}

function closeMenu() {
  document.body.classList.remove("nav-open");
  menuToggle?.setAttribute("aria-expanded", "false");
}

function showToast(message = "Producto agregado al carrito") {
  if (!cartToast) return;
  cartToast.textContent = message;
  cartToast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => cartToast.classList.remove("is-visible"), 1800);
}

function openPanel(panel) {
  closeMenu();
  closeProductDetail();
  [searchPanel, favoritesPanel, profilePanel, cartPanel].forEach((item) => {
    item?.classList.toggle("is-open", item === panel);
    item?.setAttribute("aria-hidden", String(item !== panel));
  });
  panelScrim.hidden = false;
  if (panel === searchPanel) window.setTimeout(() => searchInput?.focus(), 80);
}

function closePanels() {
  [searchPanel, favoritesPanel, profilePanel, cartPanel].forEach((panel) => {
    panel?.classList.remove("is-open");
    panel?.setAttribute("aria-hidden", "true");
  });
  panelScrim.hidden = true;
}

function openProductDetail(id) {
  const product = getProduct(id);
  if (!product || !productDetailPanel) return;

  activeProductId = id;
  detailScrollY = window.scrollY;
  document.body.classList.add("product-detail-open");

  productDetailImage.src = product.image;
  productDetailImage.alt = product.alt;
  productDetailTagline.textContent = product.tagline;
  productDetailTitle.textContent = product.name;
  productDetailPrice.textContent = formatPrice(product.price);
  productDetailDescription.textContent = product.description;
  productDetailSizes.textContent = product.sizes.join(" · ");
  productDetailMaterial.textContent = product.material;
  productDetailCare.textContent = product.care;
  productDetailDelivery.textContent = product.delivery;
  productDetailShipping.textContent =
    product.price >= storeConfig.freeShippingMin
      ? "Envío gratis en este artículo"
      : `Envío desde ${formatPrice(storeConfig.standardShipping)} · Gratis desde ${formatPrice(storeConfig.freeShippingMin)}`;

  const isFavorite = state.favorites.includes(id);
  productDetailFavorite.textContent = isFavorite ? "Quitar de favoritos" : "Guardar favorito";

  productDetailPanel.classList.add("is-open");
  productDetailPanel.setAttribute("aria-hidden", "false");
  panelScrim.hidden = false;
}

function closeProductDetail() {
  if (!productDetailPanel?.classList.contains("is-open")) return;
  productDetailPanel.classList.remove("is-open");
  productDetailPanel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("product-detail-open");
  activeProductId = null;

  if (!document.querySelector(".shop-panel.is-open")) {
    panelScrim.hidden = true;
  }

  window.scrollTo(0, detailScrollY);
}

function loadLazyImages() {
  if (!("IntersectionObserver" in window)) {
    lazyImageElements.forEach((element) => element.classList.add("is-loaded"));
    return;
  }

  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-loaded");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "520px 0px" }
  );

  lazyImageElements.forEach((element) => imageObserver.observe(element));
}

function initLazyVideos() {
  const reelCards = document.querySelectorAll(".reel-card");
  if (!reelCards.length) return;

  const attachVideo = (video) => {
    if (!video.dataset.src || video.src) return;
    video.src = video.dataset.src;
    video.removeAttribute("data-src");
  };

  if (!("IntersectionObserver" in window)) return;

  const videoObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const video = entry.target.querySelector(".reel-video");
        if (video) attachVideo(video);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "240px 0px" }
  );

  reelCards.forEach((card) => videoObserver.observe(card));
}

function pauseAllReels(exceptVideo = null) {
  document.querySelectorAll(".reel-video").forEach((video) => {
    if (video !== exceptVideo) {
      video.pause();
      video.closest(".reel-card")?.classList.remove("is-playing");
    }
  });
}

function cartQuantity() {
  return Object.values(state.cart).reduce((sum, quantity) => sum + quantity, 0);
}

function cartValue() {
  return Object.entries(state.cart).reduce((sum, [id, quantity]) => {
    const product = getProduct(id);
    return product ? sum + product.price * quantity : sum;
  }, 0);
}

function addToCart(id, quantity = 1) {
  state.cart[id] = (state.cart[id] || 0) + quantity;
  state.lastAction = `${getProduct(id)?.name || "Producto"} agregado al carrito`;
  saveState();
  renderCart();
  showToast(state.lastAction);
}

function updateCartItem(id, quantity) {
  if (quantity <= 0) delete state.cart[id];
  else state.cart[id] = quantity;
  saveState();
  renderCart();
}

function renderCart() {
  const quantity = cartQuantity();
  const subtotal = cartValue();
  const shipping = getShippingCost(subtotal);
  const total = subtotal + shipping;

  cartCount.textContent = String(quantity);
  cartIcon?.classList.toggle("has-items", quantity > 0);
  cartIcon?.setAttribute("aria-label", quantity ? `Abrir carrito con ${quantity} productos` : "Abrir carrito");

  if (cartSubtotal) cartSubtotal.textContent = formatPrice(subtotal);
  if (cartShipping) cartShipping.textContent = shippingLabel(subtotal);
  if (cartTotal) cartTotal.textContent = formatPrice(total);
  if (cartShippingNote) cartShippingNote.textContent = freeShippingHint(subtotal);

  if (!quantity) {
    cartItems.innerHTML = '<p class="empty-state">Tu carrito está vacío. Agrega una pieza para guardar tu selección.</p>';
    return;
  }

  cartItems.innerHTML = Object.entries(state.cart)
    .map(([id, itemQuantity]) => {
      const product = getProduct(id);
      if (!product) return "";
      return `
        <article class="cart-item">
          <div>
            <button class="result-text" type="button" data-open-product="${product.id}">
              <h3>${product.name}</h3>
              <p>${formatPrice(product.price)} · ${product.category}</p>
            </button>
          </div>
          <div class="cart-controls" data-cart-controls="${product.id}">
            <button class="quantity-button" type="button" data-cart-minus="${product.id}" aria-label="Quitar ${product.name}">-</button>
            <span>${itemQuantity}</span>
            <button class="quantity-button" type="button" data-cart-plus="${product.id}" aria-label="Agregar ${product.name}">+</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderFavorites() {
  document.querySelectorAll(".favorite-button").forEach((button) => {
    const productId = button.closest(".product-card")?.dataset.productId;
    const isActive = state.favorites.includes(productId);
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  renderFavoritesPanel();
}

function renderFavoritesPanel() {
  const count = state.favorites.length;
  if (favoritesCount) favoritesCount.textContent = String(count);
  favoritesIcon?.classList.toggle("has-items", count > 0);
  favoritesIcon?.setAttribute("aria-label", count ? `Abrir favoritos con ${count} piezas` : "Abrir favoritos");

  if (!favoritesItems) return;

  if (!count) {
    favoritesItems.innerHTML =
      '<p class="empty-state">Aún no guardas favoritos. Toca el corazón en una pieza para tenerla aquí.</p>';
    return;
  }

  favoritesItems.innerHTML = state.favorites
    .map((id) => {
      const product = getProduct(id);
      if (!product) return "";
      return `
        <article class="favorite-item">
          <img class="favorite-thumb" src="${product.image}" alt="" loading="lazy" decoding="async" width="72" height="96" />
          <div class="favorite-copy">
            <button class="result-text" type="button" data-open-product="${product.id}">
              <h3>${product.name}</h3>
              <p>${product.category} · ${formatPrice(product.price)}</p>
            </button>
          </div>
          <div class="favorite-actions">
            <button class="result-add" type="button" data-add-favorite="${product.id}">Agregar</button>
            <button class="favorite-remove" type="button" data-remove-favorite="${product.id}">Quitar</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function toggleFavorite(id) {
  const product = getProduct(id);
  if (!product) return;
  const isActive = state.favorites.includes(id);
  state.favorites = isActive ? state.favorites.filter((favoriteId) => favoriteId !== id) : [...state.favorites, id];
  state.lastAction = isActive ? `${product.name} quitado de favoritos` : `${product.name} guardado en favoritos`;
  saveState();
  renderFavorites();
  if (activeProductId === id) {
    productDetailFavorite.textContent = isActive ? "Guardar favorito" : "Quitar de favoritos";
  }
  showToast(state.lastAction);
}

function renderProfile() {
  if (!profileForm) return;
  profileForm.elements.name.value = state.profile.name || "";
  profileForm.elements.email.value = state.profile.email || "";
  profileForm.elements.phone.value = state.profile.phone || "";
  profileStatus.textContent = state.profile.name
    ? `Hola, ${state.profile.name}. Tus datos quedaron guardados en este navegador.`
    : "Tu información se guarda en este navegador.";
}

function renderSearch(query = state.lastSearch) {
  const term = query.trim().toLowerCase();
  searchInput.value = query;

  const matches = products.filter((product) => {
    const searchable = `${product.name} ${product.category} ${product.tagline}`.toLowerCase();
    return !term || searchable.includes(term);
  });

  searchResults.innerHTML = matches.length
    ? matches
        .map(
          (product) => `
            <article class="result-item">
              <button class="result-text" type="button" data-open-product="${product.id}">
                <h3>${product.name}</h3>
                <p>${product.category} · ${formatPrice(product.price)}</p>
              </button>
              <button class="result-add" type="button" data-add-result="${product.id}">Agregar</button>
            </article>
          `
        )
        .join("")
    : '<p class="empty-state">No encontramos piezas con esa búsqueda. Prueba con fit, casual, corsé o alo.</p>';
}

function highlightProduct(id) {
  const product = getProduct(id);
  if (!product?.card) return;
  product.card.scrollIntoView({ behavior: "smooth", block: "center" });
  product.card.classList.add("is-highlighted");
  window.clearTimeout(highlightedTimer);
  highlightedTimer = window.setTimeout(() => product.card.classList.remove("is-highlighted"), 1600);
}

function filterCategory(category) {
  state.lastCategory = category;
  state.lastSearch = category;
  saveState();
  renderSearch(category);
  const targetId = category === "Fit" ? "fit" : category === "Casual" ? "casual" : "shop";
  document.querySelector(`#${targetId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  products.forEach((product) => product.card?.classList.toggle("is-highlighted", product.category === category));
  window.clearTimeout(highlightedTimer);
  highlightedTimer = window.setTimeout(() => {
    products.forEach((product) => product.card?.classList.remove("is-highlighted"));
  }, 1500);
  showToast(`Mostrando ${category}`);
}

function initAmbientBackground() {
  const ambientTargets = document.querySelectorAll(
    "section[data-accent-color], .gateway-card[data-accent-color], .editorial[data-accent-color], .product-card[data-accent-color]"
  );
  if (!("IntersectionObserver" in window) || !ambientTargets.length) return;

  let activeColor = getComputedStyle(document.documentElement).getPropertyValue("--accent-color").trim();
  let frame = null;
  let lastChange = 0;
  const visible = new Map();
  const throttleMs = window.matchMedia("(hover: none)").matches ? 420 : 260;

  const applyAmbient = (target) => {
    const nextColor = target?.dataset.accentColor;
    if (!nextColor || nextColor === activeColor) return;

    const now = performance.now();
    if (now - lastChange < throttleMs) return;
    lastChange = now;

    if (frame) window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(() => {
      activeColor = nextColor;
      document.documentElement.style.setProperty("--accent-color", nextColor);
    });
  };

  const ambientObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.set(entry.target, entry.intersectionRatio);
        else visible.delete(entry.target);
      });

      if (!visible.size) return;

      let bestTarget = null;
      let bestRatio = -1;
      visible.forEach((ratio, target) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestTarget = target;
        }
      });

      applyAmbient(bestTarget);
    },
    { threshold: [0, 0.2, 0.4, 0.6, 0.8], rootMargin: "-30% 0px -30% 0px" }
  );

  ambientTargets.forEach((target) => ambientObserver.observe(target));
}

function openWhatsAppForProduct(product) {
  const message = encodeURIComponent(
    `Hola ARMON, me interesa:\n${product.name}\n${formatPrice(product.price)}\n\n¿Tienen talla disponible y cuánto tarda el envío?`
  );
  window.open(`https://wa.me/524776798491?text=${message}`, "_blank", "noopener,noreferrer");
}

function bindCatalogEvents() {
  document.body.addEventListener("click", (event) => {
    const card = event.target.closest(".product-card");
    const favoriteButton = event.target.closest(".favorite-button");
    const cartButton = event.target.closest(".cart-button");
    const openProductButton = event.target.closest("[data-open-product]");
    const reelPlay = event.target.closest(".reel-play");
    const closeDetail = event.target.closest("[data-close-product-detail]");

    if (closeDetail) {
      closeProductDetail();
      return;
    }

    if (reelPlay) {
      const reelCard = reelPlay.closest(".reel-card");
      const video = reelCard?.querySelector(".reel-video");
      if (!video) return;
      if (!video.src && video.dataset.src) {
        video.src = video.dataset.src;
        video.removeAttribute("data-src");
      }
      const isPlaying = !video.paused;
      pauseAllReels();
      if (!isPlaying) {
        video.play().catch(() => {});
        reelCard.classList.add("is-playing");
      }
      return;
    }

    if (favoriteButton && card) {
      event.stopPropagation();
      toggleFavorite(card.dataset.productId);
      return;
    }

    if (cartButton && card) {
      event.stopPropagation();
      addToCart(card.dataset.productId);
      return;
    }

    if (openProductButton) {
      closePanels();
      openProductDetail(openProductButton.dataset.openProduct);
      return;
    }

    if (card && !event.target.closest("button")) {
      openProductDetail(card.dataset.productId);
    }
  });

  document.body.addEventListener("keydown", (event) => {
    const card = event.target.closest(".product-card");
    if (card && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openProductDetail(card.dataset.productId);
    }
  });
}

menuToggle?.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => link.addEventListener("click", closeMenu));

document.querySelector("#openSearch")?.addEventListener("click", () => {
  renderSearch();
  openPanel(searchPanel);
});

document.querySelector("#openFavorites")?.addEventListener("click", () => {
  renderFavoritesPanel();
  openPanel(favoritesPanel);
});

document.querySelector("#openProfile")?.addEventListener("click", () => {
  renderProfile();
  openPanel(profilePanel);
});

cartIcon?.addEventListener("click", () => {
  renderCart();
  openPanel(cartPanel);
});

closePanelButtons.forEach((button) => button.addEventListener("click", closePanels));

panelScrim?.addEventListener("click", () => {
  closeProductDetail();
  closePanels();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeProductDetail();
    closePanels();
    closeMenu();
  }
});

categoryLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    filterCategory(link.dataset.categoryFilter);
  });
});

helpLinks.forEach((link) => {
  link.addEventListener("click", () => {
    state.lastAction = `Consulta abierta: ${link.dataset.helpTopic}`;
    saveState();
    showToast(link.dataset.helpTopic);
  });
});

cartItems?.addEventListener("click", (event) => {
  const plus = event.target.closest("[data-cart-plus]");
  const minus = event.target.closest("[data-cart-minus]");
  if (plus) updateCartItem(plus.dataset.cartPlus, (state.cart[plus.dataset.cartPlus] || 0) + 1);
  if (minus) updateCartItem(minus.dataset.cartMinus, (state.cart[minus.dataset.cartMinus] || 0) - 1);
});

clearCartButton?.addEventListener("click", () => {
  state.cart = {};
  state.lastAction = "Carrito vacío";
  saveState();
  renderCart();
  showToast("Carrito vacío");
});

checkoutButton?.addEventListener("click", () => {
  if (!cartQuantity()) {
    showToast("Agrega productos primero");
    return;
  }

  const subtotal = cartValue();
  const shipping = getShippingCost(subtotal);
  const lines = Object.entries(state.cart)
    .map(([id, quantity]) => {
      const product = getProduct(id);
      return product ? `${quantity}x ${product.name} · ${formatPrice(product.price)}` : "";
    })
    .filter(Boolean);

  const message = encodeURIComponent(
    `Hola ARMON, me interesa:\n${lines.join("\n")}\n\nSubtotal: ${formatPrice(subtotal)}\nEnvío: ${shippingLabel(subtotal)}\nTotal: ${formatPrice(subtotal + shipping)}`
  );

  window.open(`https://wa.me/524776798491?text=${message}`, "_blank", "noopener,noreferrer");
  showToast("Pedido preparado para WhatsApp");
});

searchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  state.lastSearch = searchInput.value.trim();
  saveState();
  renderSearch(state.lastSearch);
});

searchResults?.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-result]");
  if (addButton) {
    addToCart(addButton.dataset.addResult);
    renderSearch(searchInput.value);
  }
});

favoritesItems?.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-favorite]");
  const removeButton = event.target.closest("[data-remove-favorite]");
  if (addButton) addToCart(addButton.dataset.addFavorite);
  if (removeButton) toggleFavorite(removeButton.dataset.removeFavorite);
});

productDetailAddCart?.addEventListener("click", () => {
  if (activeProductId) addToCart(activeProductId);
});

productDetailFavorite?.addEventListener("click", () => {
  if (activeProductId) toggleFavorite(activeProductId);
});

productDetailWhatsApp?.addEventListener("click", () => {
  const product = getProduct(activeProductId);
  if (product) openWhatsAppForProduct(product);
});

profileForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(profileForm);
  state.profile = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
  };
  state.lastAction = "Perfil guardado";
  saveState();
  renderProfile();
  showToast("Info guardada");
});

clearSavedDataButton?.addEventListener("click", () => {
  state = { ...defaultState, profile: { ...defaultState.profile }, cart: {}, favorites: [] };
  saveState();
  renderCart();
  renderFavorites();
  renderFavoritesPanel();
  renderProfile();
  renderSearch("");
  showToast("Datos borrados");
});

renderProductGrids();
renderReels();
bindCatalogEvents();
renderCart();
renderFavorites();
renderProfile();
renderSearch();
loadLazyImages();
initLazyVideos();
initAmbientBackground();

if ("connection" in navigator && navigator.connection?.saveData) {
  document.documentElement.classList.add("save-data");
}
