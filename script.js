const STORAGE_KEY = "armonBoutiqueState";

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".main-nav a");
const productCards = [...document.querySelectorAll(".product-card")];
const cartButtons = document.querySelectorAll(".cart-button");
const favoriteButtons = document.querySelectorAll(".favorite-button");
const categoryLinks = document.querySelectorAll("[data-category-filter]");
const cartToast = document.querySelector(".cart-toast");
const cartCount = document.querySelector("#cartCount");
const cartIcon = document.querySelector("#openCart");
const cartPanel = document.querySelector("#cartPanel");
const favoritesIcon = document.querySelector("#openFavorites");
const favoritesPanel = document.querySelector("#favoritesPanel");
const favoritesCount = document.querySelector("#favoritesCount");
const favoritesItems = document.querySelector("#favoritesItems");
const cartItems = document.querySelector("#cartItems");
const cartTotal = document.querySelector("#cartTotal");
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

const products = productCards.map((card) => ({
  id: card.dataset.productId,
  name: card.dataset.productName,
  price: Number(card.dataset.productPrice),
  category: card.dataset.productCategory,
  image: card.querySelector(".product-photo")?.getAttribute("src") || "",
  card,
}));

let toastTimer;
let highlightedTimer;
let ambientTimer;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const defaultState = {
  cart: {},
  favorites: [],
  profile: {
    name: "",
    email: "",
    phone: "",
  },
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
      profile: {
        ...defaultState.profile,
        ...(saved?.profile || {}),
      },
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
  toastTimer = window.setTimeout(() => {
    cartToast.classList.remove("is-visible");
  }, 1800);
}

function openPanel(panel) {
  closeMenu();
  [searchPanel, favoritesPanel, profilePanel, cartPanel].forEach((item) => {
    item?.classList.toggle("is-open", item === panel);
    item?.setAttribute("aria-hidden", String(item !== panel));
  });
  panelScrim.hidden = false;

  if (panel === searchPanel) {
    window.setTimeout(() => searchInput?.focus(), 80);
  }
}

function closePanels() {
  [searchPanel, favoritesPanel, profilePanel, cartPanel].forEach((panel) => {
    panel?.classList.remove("is-open");
    panel?.setAttribute("aria-hidden", "true");
  });
  panelScrim.hidden = true;
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
  if (quantity <= 0) {
    delete state.cart[id];
  } else {
    state.cart[id] = quantity;
  }
  saveState();
  renderCart();
}

function renderCart() {
  const quantity = cartQuantity();
  cartCount.textContent = String(quantity);
  cartIcon?.classList.toggle("has-items", quantity > 0);
  cartIcon?.setAttribute("aria-label", quantity ? `Abrir carrito con ${quantity} productos` : "Abrir carrito");
  cartTotal.textContent = formatPrice(cartValue());

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
            <h3>${product.name}</h3>
            <p>${formatPrice(product.price)} · ${product.category}</p>
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
  favoriteButtons.forEach((button) => {
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
  favoritesIcon?.setAttribute(
    "aria-label",
    count ? `Abrir favoritos con ${count} piezas` : "Abrir favoritos"
  );

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
          <img class="favorite-thumb" src="${product.image}" alt="" loading="lazy" />
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
  const isActive = state.favorites.includes(id);
  state.favorites = isActive
    ? state.favorites.filter((favoriteId) => favoriteId !== id)
    : [...state.favorites, id];
  state.lastAction = isActive ? `${product.name} quitado de favoritos` : `${product.name} guardado en favoritos`;
  saveState();
  renderFavorites();
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
    const searchable = `${product.name} ${product.category} ${product.id}`.toLowerCase();
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
    : '<p class="empty-state">No encontramos piezas con esa búsqueda. Prueba con fit, casual, corsé o alo.</p>';
}

function highlightProduct(id) {
  const product = getProduct(id);
  if (!product) return;
  product.card.scrollIntoView({ behavior: "smooth", block: "center" });
  product.card.classList.add("is-highlighted");
  window.clearTimeout(highlightedTimer);
  highlightedTimer = window.setTimeout(() => {
    product.card.classList.remove("is-highlighted");
  }, 1600);
}

function filterCategory(category) {
  state.lastCategory = category;
  state.lastSearch = category;
  saveState();
  renderSearch(category);
  const targetId = category === "Fit" ? "fit" : category === "Casual" ? "casual" : "shop";
  document.querySelector(`#${targetId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  products.forEach((product) => {
    product.card.classList.toggle("is-highlighted", product.category === category);
  });
  window.clearTimeout(highlightedTimer);
  highlightedTimer = window.setTimeout(() => {
    products.forEach((product) => product.card.classList.remove("is-highlighted"));
  }, 1500);
  showToast(`Mostrando ${category}`);
}

function initAmbientBackground() {
  if (prefersReducedMotion) return;

  const ambientTargets = document.querySelectorAll("[data-accent-color]");
  if (!("IntersectionObserver" in window) || !ambientTargets.length) {
    return;
  }

  let activeColor = getComputedStyle(document.documentElement).getPropertyValue("--accent-color").trim();

  const ambientObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (!visible.length) return;

      const nextColor = visible[0].target.dataset.accentColor;
      if (!nextColor || nextColor === activeColor) return;

      activeColor = nextColor;
      window.clearTimeout(ambientTimer);
      ambientTimer = window.setTimeout(() => {
        document.documentElement.style.setProperty("--accent-color", nextColor);
      }, 150);
    },
    {
      threshold: 0.35,
      rootMargin: "-12% 0px -12% 0px",
    }
  );

  ambientTargets.forEach((target) => ambientObserver.observe(target));
}

menuToggle?.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

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

closePanelButtons.forEach((button) => {
  button.addEventListener("click", closePanels);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePanels();
    closeMenu();
  }
});

cartButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const productId = button.closest(".product-card")?.dataset.productId;
    addToCart(productId);
  });
});

favoriteButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const productId = button.closest(".product-card")?.dataset.productId;
    toggleFavorite(productId);
  });
});

categoryLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    filterCategory(link.dataset.categoryFilter);
  });
});

cartItems?.addEventListener("click", (event) => {
  const plus = event.target.closest("[data-cart-plus]");
  const minus = event.target.closest("[data-cart-minus]");

  if (plus) {
    const id = plus.dataset.cartPlus;
    updateCartItem(id, (state.cart[id] || 0) + 1);
  }

  if (minus) {
    const id = minus.dataset.cartMinus;
    updateCartItem(id, (state.cart[id] || 0) - 1);
  }
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

  const lines = Object.entries(state.cart)
    .map(([id, quantity]) => {
      const product = getProduct(id);
      return product ? `${quantity}x ${product.name} · ${formatPrice(product.price)}` : "";
    })
    .filter(Boolean);

  const message = encodeURIComponent(
    `Hola ARMON, me interesa:\n${lines.join("\n")}\n\nTotal: ${formatPrice(cartValue())}`
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
  const scrollButton = event.target.closest("[data-scroll-product]");

  if (addButton) {
    addToCart(addButton.dataset.addResult);
    renderSearch(searchInput.value);
  }

  if (scrollButton) {
    closePanels();
    highlightProduct(scrollButton.dataset.scrollProduct);
  }
});

favoritesItems?.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-favorite]");
  const removeButton = event.target.closest("[data-remove-favorite]");
  const scrollButton = event.target.closest("[data-scroll-product]");

  if (addButton) {
    addToCart(addButton.dataset.addFavorite);
  }

  if (removeButton) {
    toggleFavorite(removeButton.dataset.removeFavorite);
  }

  if (scrollButton) {
    closePanels();
    highlightProduct(scrollButton.dataset.scrollProduct);
  }
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

renderCart();
renderFavorites();
renderProfile();
renderSearch();
loadLazyImages();
initAmbientBackground();
