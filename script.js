const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelectorAll(".main-nav a");
const cartButtons = document.querySelectorAll(".cart-button");
const cartToast = document.querySelector(".cart-toast");
const signupForm = document.querySelector(".signup-form");
const formNote = document.querySelector(".form-note");

let toastTimer;

function closeMenu() {
  document.body.classList.remove("nav-open");
  menuToggle?.setAttribute("aria-expanded", "false");
}

menuToggle?.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

cartButtons.forEach((button) => {
  button.addEventListener("click", () => {
    cartToast?.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      cartToast?.classList.remove("is-visible");
    }, 2200);
  });
});

signupForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(signupForm);
  const email = String(formData.get("email") || "").trim();

  if (!email) {
    return;
  }

  formNote.textContent = "Listo. Te enviaremos novedades y descuentos de ARMON.";
  signupForm.reset();
});
