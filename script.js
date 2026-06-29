const STORAGE_KEY = "armonBoutiqueState";

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".main-nav a");
const productCards = [...document.querySelectorAll(".product-card")];
const categoryLinks = document.querySelectorAll("[data-category-filter]");
const helpLinks = document.querySelectorAll("[data-help-topic]");
const cartToast = document.querySelector(".cart-toast");
const cartCount = document.querySelector("#cartCount");
const cartIcon = document.querySelector("#openCart");
const cartPanel = document.querySelector("#cartPanel");
const cartItems = document.querySelector("#cartItems");
const cartTotal = document.querySelector("#cartTotal");
const clearCartButton = document.querySelector("#clearCart");
const checkoutButton = document.querySelector("#checkoutButton");
const searchPanel = document.querySelector("#searchPanel");
const searchForm = document.querySelector(".search-form");
const searchInput = document.querySelector("#searchInput");
const searchResults = document.querySelector("#searchResults");
const favoritesIcon = document.querySelector("#openFavorites");
const favoritesPanel = document.querySelector("#favoritesPanel");
const favoritesCount = document.querySelector("#favoritesCount");
const favoritesItems = document.querySelector("#favoritesItems");
const profilePanel = document.querySelector("#profilePanel");
const profileForm = document.querySelector(".profile-form");
const profileStatus = document.querySelector("#profileStatus");
const clearSavedDataButton = document.querySelector("#clearSavedData");
const panelScrim = document.querySelector(".panel-scrim");
const closePanelButtons = document.querySelectorAll("[data-close-panels]");
const ambientBg = document.querySelector(".ambient-bg");

const panels = [searchPanel, favoritesPanel, profilePanel, cartPanel];

const products = productCards.map((card) => ({
  id: card.dataset.productId,
  name: card.dataset.productName,
  price: Number(card.dataset.productPrice),
  category: card.dataset.productCategory,
  image: card.dataset.productImage || "",
  thumb: card.dataset.productImage
    ? card.dataset.productImage.replace("/product/", "/thumb/")
    : "",
  card,
}));

let toastTimer;
let highlightedTimer;
let ambientTimer;
let ambientColor = "#0b0b0b";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

function closeMenu() {
  document.body.classList.remove("nav-open");
  menuToggle?.setAttribute("aria-expanded", "false");
}

function showToast(message = "Producto agregado al carrito") {
  if (!cartToast) return;
  cartToast.textContent = message;
  cartToast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => cartToast.classList.remove("is-visible"), 1600);
}

function openPanel(panel) {
  closeMenu();
  panels.forEach((item) => {
    item?.classList.toggle("is-open", item === panel);
    item?.setAttribute("aria-hidden", String(item !== panel));
  });
  panelScrim.hidden = false;
  if (panel === searchPanel) window.setTimeout(() => searchInput?.focus(), 60);
}

function closePanels() {
  panels.forEach((panel) => {
    panel?.classList.remove("is-open");
    panel?.setAttribute("aria-hidden", "true");
  });
  panelScrim.hidden = true;
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
  cartCount.textContent = String(quantity);
  cartIcon?.setAttribute("aria-label", quantity ? `Abrir carrito con ${quantity} productos` : "Abrir carrito");
  cartTotal.textContent = formatPrice(cartValue());

  if (!quantity) {
    cartItems.innerHTML = '<p class="empty-state">Tu carrito está vacío.</p>';
    return;
  }

  cartItems.innerHTML = Object.entries(state.cart)
    .map(([id, itemQuantity]) => {
      const product = getProduct(id);
      if (!product) return "";
      return `
        <article class="cart-item">
          <div>
            <h3>${product.name}</h3>
            <p>${formatPrice(product.price)} · ${product.category}</p>
          </div>
          <div class="cart-controls">
            <button class="quantity-button" type="button" data-cart-minus="${product.id}" aria-label="Quitar">-</button>
            <span>${itemQuantity}</span>
            <button class="quantity-button" type="button" data-cart-plus="${product.id}" aria-label="Agregar">+</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderFavorites() {
  productCards.forEach((card) => {
    const button = card.querySelector(".favorite-button");
    const productId = card.dataset.productId;
    const isActive = state.favorites.includes(productId);
    button?.classList.toggle("is-active", isActive);
    button?.setAttribute("aria-pressed", String(isActive));
  });
  renderFavoritesPanel();
}

function renderFavoritesPanel() {
  const count = state.favorites.length;
  if (favoritesCount) favoritesCount.textContent = String(count);
  favoritesIcon?.setAttribute("aria-label", count ? `Abrir favoritos con ${count} piezas` : "Abrir favoritos");
  if (!favoritesItems) return;

  if (!count) {
    favoritesItems.innerHTML = '<p class="empty-state">Toca el corazón en una pieza para guardarla aquí.</p>';
    return;
  }

  favoritesItems.innerHTML = state.favorites
    .map((id) => {
      const product = getProduct(id);
      if (!product) return "";
      return `
        <article class="favorite-item">
          <img class="favorite-thumb" src="${product.thumb}" alt="" width="48" height="58" loading="lazy" decoding="async" />
          <div class="favorite-copy">
            <button class="result-text" type="button" data-scroll-product="${product.id}">
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
  state.favorites = isActive
    ? state.favorites.filter((favoriteId) => favoriteId !== id)
    : [...state.favorites, id];
  saveState();
  renderFavorites();
  showToast(isActive ? `${product.name} quitado de favoritos` : `${product.name} guardado en favoritos`);
}

function renderProfile() {
  if (!profileForm) return;
  profileForm.elements.name.value = state.profile.name || "";
  profileForm.elements.email.value = state.profile.email || "";
  profileForm.elements.phone.value = state.profile.phone || "";
  profileStatus.textContent = state.profile.name
    ? `Hola, ${state.profile.name}. Datos guardados en este navegador.`
    : "Tu información se guarda en este navegador.";
}

function renderSearch(query = state.lastSearch) {
  const term = query.trim().toLowerCase();
  searchInput.value = query;
  const matches = products.filter((product) => {
    const searchable = `${product.name} ${product.category}`.toLowerCase();
    return !term || searchable.includes(term);
  });

  searchResults.innerHTML = matches.length
    ? matches
        .map(
          (product) => `
            <article class="result-item">
              <button class="result-text" type="button" data-scroll-product="${product.id}">
                <h3>${product.name}</h3>
                <p>${product.category} · ${formatPrice(product.price)}</p>
              </button>
              <button class="result-add" type="button" data-add-result="${product.id}">Agregar</button>
            </article>
          `
        )
        .join("")
    : '<p class="empty-state">Prueba con fit, casual o corsé.</p>';
}

function highlightProduct(id) {
  const product = getProduct(id);
  if (!product) return;
  product.card.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
  product.card.classList.add("is-highlighted");
  window.clearTimeout(highlightedTimer);
  highlightedTimer = window.setTimeout(() => product.card.classList.remove("is-highlighted"), 1200);
}

function filterCategory(category) {
  state.lastCategory = category;
  state.lastSearch = category;
  saveState();
  renderSearch(category);
  const targetId = category === "Fit" ? "fit" : "casual";
  document.querySelector(`#${targetId}`)?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  showToast(`Mostrando ${category}`);
}

function hexToRgb(hex) {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function setAmbientColor(hex) {
  if (!ambientBg || prefersReducedMotion || hex === ambientColor) return;
  ambientColor = hex;
  window.clearTimeout(ambientTimer);
  ambientTimer = window.setTimeout(() => {
    const [r, g, b] = hexToRgb(hex);
    ambientBg.style.background = `
      radial-gradient(ellipse 120% 80% at 50% -5%, rgba(${r}, ${g}, ${b}, 0.28), transparent 60%),
      radial-gradient(ellipse 80% 60% at 100% 90%, rgba(${r}, ${g}, ${b}, 0.12), transparent 55%),
      #0b0b0b`;
  }, 120);
}

function initAmbientBackground() {
  if (prefersReducedMotion || !("IntersectionObserver" in window)) return;

  const ambientObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]?.target.dataset.accentColor) setAmbientColor(visible[0].target.dataset.accentColor);
    },
    { threshold: 0.35, rootMargin: "-10% 0px -10% 0px" }
  );

  document.querySelectorAll("[data-accent-color]").forEach((target) => ambientObserver.observe(target));
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
panelScrim?.addEventListener("click", closePanels);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePanels();
    closeMenu();
  }
});

document.addEventListener("click", (event) => {
  const cartButton = event.target.closest(".cart-button");
  const favoriteButton = event.target.closest(".favorite-button");
  const categoryLink = event.target.closest("[data-category-filter]");
  const helpLink = event.target.closest("[data-help-topic]");

  if (cartButton) {
    const productId = cartButton.closest(".product-card")?.dataset.productId;
    if (productId) addToCart(productId);
    return;
  }

  if (favoriteButton) {
    const productId = favoriteButton.closest(".product-card")?.dataset.productId;
    if (productId) toggleFavorite(productId);
    return;
  }

  if (categoryLink) {
    event.preventDefault();
    filterCategory(categoryLink.dataset.categoryFilter);
    return;
  }

  if (helpLink) {
    showToast(helpLink.dataset.helpTopic);
  }
});

cartItems?.addEventListener("click", (event) => {
  const plus = event.target.closest("[data-cart-plus]");
  const minus = event.target.closest("[data-cart-minus]");
  if (plus) updateCartItem(plus.dataset.cartPlus, (state.cart[plus.dataset.cartPlus] || 0) + 1);
  if (minus) updateCartItem(minus.dataset.cartMinus, (state.cart[minus.dataset.cartMinus] || 0) - 1);
});

clearCartButton?.addEventListener("click", () => {
  state.cart = {};
  saveState();
  renderCart();
  showToast("Carrito vacío");
});

checkoutButton?.addEventListener("click", () => {
  if (!cartQuantity()) {
    showToast("Agrega productos primero");
    return;
  }
  showToast("Pedido preparado para WhatsApp");
});

searchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  state.lastSearch = searchInput.value.trim();
  saveState();
  renderSearch(state.lastSearch);
});

function handlePanelAction(event) {
  const addButton = event.target.closest("[data-add-result], [data-add-favorite]");
  const removeButton = event.target.closest("[data-remove-favorite]");
  const scrollButton = event.target.closest("[data-scroll-product]");

  if (addButton) addToCart(addButton.dataset.addResult || addButton.dataset.addFavorite);
  if (removeButton) toggleFavorite(removeButton.dataset.removeFavorite);
  if (scrollButton) {
    closePanels();
    highlightProduct(scrollButton.dataset.scrollProduct);
  }
}

searchResults?.addEventListener("click", handlePanelAction);
favoritesItems?.addEventListener("click", handlePanelAction);

profileForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(profileForm);
  state.profile = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
  };
  saveState();
  renderProfile();
  showToast("Info guardada");
});

clearSavedDataButton?.addEventListener("click", () => {
  state = { ...defaultState, profile: { ...defaultState.profile } };
  saveState();
  renderCart();
  renderFavorites();
  renderProfile();
  renderSearch("");
  showToast("Datos borrados");
});

renderCart();
renderFavorites();
renderProfile();
renderSearch();
initAmbientBackground();
