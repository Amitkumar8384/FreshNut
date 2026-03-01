"use strict";

var APP_ROOT = (function () {
  try {
    if (document.currentScript && document.currentScript.src) {
      return new URL(".", document.currentScript.src);
    }
    return new URL(".", window.location.href);
  } catch (_err) {
    return new URL(window.location.origin + "/");
  }
})();

function appUrl(route) {
  var normalized = String(route || "").replace(/^\.\//, "").replace(/^\//, "");
  return new URL(normalized, APP_ROOT).toString();
}

function readJson(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_err) {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

var seedProducts = [
  {
    id: 101,
    category: "dryfruits",
    title: "Premium Almonds 500g",
    img: "https://images.unsplash.com/photo-1574570171040-84f6fe12d8ca?auto=format&fit=crop&w=900&q=80",
    old: 899,
    price: 649,
    badge: "28% OFF",
    rating: 4.8,
    reviews: 124,
    status: "active",
    stock: 35,
    desc: "Crunchy California almonds, rich in protein and healthy fats."
  },
  {
    id: 102,
    category: "seeds",
    title: "Roasted Pumpkin Seeds",
    img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3f?auto=format&fit=crop&w=900&q=80",
    old: 499,
    price: 349,
    badge: "Healthy",
    rating: 4.6,
    reviews: 73,
    status: "active",
    stock: 40,
    desc: "Lightly roasted pumpkin seeds with natural sea salt."
  },
  {
    id: 103,
    category: "sweets",
    title: "Kaju Katli Special",
    img: "https://images.unsplash.com/photo-1589118949245-7d38baf380d6?auto=format&fit=crop&w=900&q=80",
    old: 699,
    price: 499,
    badge: "Festive",
    rating: 4.9,
    reviews: 87,
    status: "active",
    stock: 22,
    desc: "Traditional kaju katli, prepared fresh for festive gifting."
  },
  {
    id: 104,
    category: "pickles",
    title: "Homestyle Mango Pickle",
    img: "https://images.unsplash.com/photo-1613145993513-c74e95e8d30a?auto=format&fit=crop&w=900&q=80",
    old: 399,
    price: 299,
    badge: "Bestseller",
    rating: 4.7,
    reviews: 59,
    status: "active",
    stock: 18,
    desc: "Small-batch mango pickle with classic Indian spices."
  },
  {
    id: 105,
    category: "combos",
    title: "Festive Gift Combo Box",
    img: "https://images.unsplash.com/photo-1603532648955-039310d9ed75?auto=format&fit=crop&w=900&q=80",
    old: 1499,
    price: 1099,
    badge: "Gift Pack",
    rating: 4.8,
    reviews: 41,
    status: "active",
    stock: 15,
    desc: "Curated combo with dry fruits, sweets, and festive treats."
  }
];

var products = readJson("products", []);
if (!Array.isArray(products) || products.length === 0) {
  products = seedProducts.slice();
  writeJson("products", products);
}

var cart = [];
var wishlist = [];

function loadSessionCollections() {
  cart = readScopedJson("cart", []);
  if (!Array.isArray(cart)) {
    cart = [];
  }

  wishlist = readScopedJson("wishlist", []);
  if (!Array.isArray(wishlist)) {
    wishlist = [];
  }

  window.cart = cart;
  window.wishlist = wishlist;
}

function getRecentlyViewedKey() {
  return scopedKey("recentlyViewedProductIds");
}

loadSessionCollections();

window.products = products;
window.cart = cart;
window.wishlist = wishlist;

var grid = document.getElementById("bestsellersGrid");
var cartList = document.getElementById("cartList");
var cartTotalEl = document.getElementById("cartTotal");
var cartCountEl = document.getElementById("cartCount");
var wishList = document.getElementById("wishList");

var toastNode = null;

function ensureToast() {
  if (toastNode || !document.body) {
    return;
  }
  toastNode = document.createElement("div");
  toastNode.className = "toast";
  toastNode.textContent = "Added to cart";
  document.body.appendChild(toastNode);
}

function showToast(message) {
  ensureToast();
  if (!toastNode) {
    return;
  }
  toastNode.textContent = message || "Updated";
  toastNode.classList.add("show");
  setTimeout(function () {
    toastNode.classList.remove("show");
  }, 1500);
}

function getCurrentUser() {
  return readJson("currentUser", null);
}

function getUserStorageId(user) {
  var u = user || getCurrentUser();
  if (!u || !u.email) {
    return "guest";
  }
  return String(u.email).trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
}

function scopedKey(baseKey, user) {
  return String(baseKey) + "::" + getUserStorageId(user);
}

function readScopedJson(baseKey, fallback, user) {
  var key = scopedKey(baseKey, user);
  var scoped = readJson(key, null);
  if (scoped !== null && scoped !== undefined) {
    return scoped;
  }

  var legacy = readJson(baseKey, null);
  if (legacy !== null && legacy !== undefined) {
    writeJson(key, legacy);
    localStorage.removeItem(baseKey);
    return legacy;
  }
  return fallback;
}

function writeScopedJson(baseKey, value, user) {
  writeJson(scopedKey(baseKey, user), value);
}

var THEME_STORAGE_KEY = "themeMode";
var __themeSyncBound = false;

function getSavedTheme() {
  var saved = String(localStorage.getItem(THEME_STORAGE_KEY) || "light").toLowerCase();
  return saved === "dark" ? "dark" : "light";
}

function updateThemeButtons(theme) {
  var isDark = theme === "dark";
  var buttons = document.querySelectorAll("#navThemeToggle, #themeToggle");
  buttons.forEach(function (button) {
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute("title", isDark ? "Switch to light mode" : "Switch to dark mode");
    button.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    var icon = button.querySelector("i");
    if (icon) {
      icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
    } else {
      button.textContent = isDark ? "Light Mode" : "Dark Mode";
    }
  });
}

function applyTheme(theme) {
  var normalized = theme === "dark" ? "dark" : "light";
  document.body.classList.toggle("dark-mode", normalized === "dark");
  updateThemeButtons(normalized);
  return normalized;
}

function toggleTheme() {
  var next = document.body.classList.contains("dark-mode") ? "light" : "dark";
  localStorage.setItem(THEME_STORAGE_KEY, next);
  applyTheme(next);
}

function initTheme() {
  applyTheme(getSavedTheme());
  if (__themeSyncBound) {
    return;
  }
  __themeSyncBound = true;
  window.addEventListener("storage", function (event) {
    if (event && event.key && event.key !== THEME_STORAGE_KEY) {
      return;
    }
    applyTheme(getSavedTheme());
  });
}

function initThemeToggle() {
  initTheme();
  document.querySelectorAll("#navThemeToggle, #themeToggle").forEach(function (button) {
    if (button.dataset.themeBound === "1") {
      return;
    }
    button.dataset.themeBound = "1";
    button.addEventListener("click", toggleTheme);
  });
  updateThemeButtons(getSavedTheme());
}

function saveProducts() {
  writeJson("products", products);
  window.products = products;
}

function saveCart() {
  writeScopedJson("cart", cart);
  window.cart = cart;
  updateCartCount();
}

function saveWishlist() {
  writeScopedJson("wishlist", wishlist);
  window.wishlist = wishlist;
}

function formatInr(value) {
  return "Rs " + Number(value || 0).toFixed(0);
}

function stars(rating) {
  var rounded = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));
  var html = "";
  for (var i = 1; i <= 5; i += 1) {
    html += i <= rounded ? '<span class="star-full">&#9733;</span>' : '<span class="star-empty">&#9734;</span>';
  }
  return '<span class="rating-stars" aria-hidden="true">' + html + "</span>";
}

function updateCartCount() {
  if (!cartCountEl) {
    cartCountEl = document.getElementById("cartCount");
  }
  if (!cartCountEl) {
    return;
  }
  var uniqueIds = {};
  (Array.isArray(cart) ? cart : []).forEach(function (item) {
    if (item && item.id !== undefined && item.id !== null) {
      uniqueIds[String(item.id)] = true;
    }
  });
  cartCountEl.textContent = String(Object.keys(uniqueIds).length);
}

function applyAppRoutes() {
  document.querySelectorAll("[data-route]").forEach(function (el) {
    var route = el.getAttribute("data-route");
    if (!route) {
      return;
    }
    el.setAttribute("href", appUrl(route));
  });

  document.querySelectorAll("[data-route-click]").forEach(function (el) {
    if (el.dataset.routeBound === "1") {
      return;
    }
    var route = el.getAttribute("data-route-click");
    if (!route) {
      return;
    }
    el.dataset.routeBound = "1";
    el.addEventListener("click", function () {
      if (el.classList.contains("cart-checkout") && (!Array.isArray(cart) || cart.length === 0)) {
        showToast("Your cart is empty");
        return;
      }
      window.location.href = appUrl(route);
    });
  });
}

function setActiveNavLink() {
  var current = new URL(window.location.href);
  var currentPath = current.pathname.replace(/\/+$/, "").toLowerCase();
  if (!currentPath) {
    currentPath = "/";
  }

  document.querySelectorAll("[data-route]").forEach(function (el) {
    el.classList.remove("active-page");

    var href = el.getAttribute("href");
    if (!href || href === "#") {
      return;
    }

    try {
      var target = new URL(href, window.location.origin);
      var targetPath = target.pathname.replace(/\/+$/, "").toLowerCase();
      if (!targetPath) {
        targetPath = "/";
      }

      if (targetPath === currentPath) {
        el.classList.add("active-page");
      }
    } catch (_err) {
      // ignore invalid href
    }
  });
}

function initHero() {
  var slides = document.querySelectorAll(".hero-slide");
  if (!slides.length) {
    return;
  }
  var prev = document.getElementById("heroPrev");
  var next = document.getElementById("heroNext");
  var idx = 0;

  function show(n) {
    slides.forEach(function (slide, i) {
      slide.classList.toggle("active", i === n);
    });
  }

  function step(offset) {
    idx = (idx + offset + slides.length) % slides.length;
    show(idx);
  }

  prev && prev.addEventListener("click", function () { step(-1); });
  next && next.addEventListener("click", function () { step(1); });

  show(0);
  setInterval(function () {
    step(1);
  }, 4500);
}

function initTopOffer() {
  var offerEl = document.querySelector(".top-offer");
  if (!offerEl) {
    return;
  }

  var defaultOffers = [
    "Free Traditional Mango Pickle on orders above Rs 999.",
    "Get 10% OFF on first order with code WELCOME10.",
    "Free Shipping on prepaid orders above Rs 799."
  ];
  var offers = Array.isArray(window.TOP_OFFERS) && window.TOP_OFFERS.length ? window.TOP_OFFERS : defaultOffers;
  var dayIndex = new Date().getDate() % offers.length;
  var offerText = String(offers[dayIndex] || defaultOffers[0]);

  offerEl.textContent = "";
  var track = document.createElement("span");
  track.className = "top-offer-track";
  track.textContent = offerText;
  offerEl.appendChild(track);
}

function initNavbar() {
  initTopOffer();
  initThemeToggle();
  applyAppRoutes();
  setActiveNavLink();
  initGlobalNavProductRouting();

  var hamburger = document.getElementById("hamburger");
  var navLinks = document.getElementById("navLinks");
  var navOverlay = document.getElementById("navOverlay");
  var drawerClose = document.getElementById("drawerClose");

  if (!hamburger || !navLinks) {
    return;
  }

  function openMenu() {
    navLinks.classList.add("active");
    navOverlay && navOverlay.classList.add("show");
    document.body.classList.add("nav-open");
  }

  function closeMenu() {
    navLinks.classList.remove("active");
    navOverlay && navOverlay.classList.remove("show");
    document.body.classList.remove("nav-open");
  }

  hamburger.addEventListener("click", function () {
    if (navLinks.classList.contains("active")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  drawerClose && drawerClose.addEventListener("click", closeMenu);
  navOverlay && navOverlay.addEventListener("click", closeMenu);

  navLinks.addEventListener("click", function (event) {
    var link = event.target.closest("a");
    if (!link) {
      return;
    }
    if (link.classList.contains("cat-toggle")) {
      return;
    }
    closeMenu();
  });

  document.addEventListener("click", function (event) {
    var toggle = event.target.closest(".cat-toggle");
    if (!toggle) {
      return;
    }
    event.preventDefault();
    if (window.innerWidth > 900) {
      return;
    }
    var li = toggle.closest(".category");
    li && li.classList.toggle("open");
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 900) {
      closeMenu();
    }
  });
}

function initGlobalNavProductRouting() {
  var navSearch = document.getElementById("navSearch");
  var navSearchBtn = document.getElementById("navSearchBtn");
  var navCategory = document.getElementById("navCategory");

  document.querySelectorAll(".cat-dropdown a[data-cat]").forEach(function (anchor) {
    if (anchor.dataset.routeBound === "1") {
      return;
    }
    anchor.dataset.routeBound = "1";
    anchor.addEventListener("click", function (event) {
      event.preventDefault();
      var cat = String(anchor.dataset.cat || "").trim().toLowerCase();
      if (!cat) {
        window.location.href = appUrl("All Page/view-all-page.html");
        return;
      }
      window.location.href = appUrl("All Page/view-all-page.html?cat=" + encodeURIComponent(cat));
    });
  });

  function normalizeCat(catRaw) {
    var key = String(catRaw || "").toLowerCase().replace(/\s+/g, "").trim();
    if (key === "dryfruits") { return "dryfruits"; }
    if (key === "seeds") { return "seeds"; }
    if (key === "sweets") { return "sweets"; }
    if (key === "pickles") { return "pickles"; }
    if (key === "combopacks" || key === "combos") { return "combos"; }
    return "";
  }

  function goToViewProducts() {
    var params = new URLSearchParams();
    var q = navSearch ? String(navSearch.value || "").trim() : "";
    var cat = normalizeCat(navCategory ? navCategory.value : "");

    if (cat) {
      params.set("cat", cat);
    }
    if (q) {
      params.set("q", q);
    }

    var query = params.toString();
    var path = "All Page/view-all-page.html" + (query ? "?" + query : "");
    window.location.href = appUrl(path);
  }

  if (navSearchBtn && navSearchBtn.dataset.routeBound !== "1") {
    navSearchBtn.dataset.routeBound = "1";
    navSearchBtn.addEventListener("click", function () {
      goToViewProducts();
    });
  }

  if (navSearch && navSearch.dataset.routeBound !== "1") {
    navSearch.dataset.routeBound = "1";
    navSearch.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        goToViewProducts();
      }
    });
  }

  if (navCategory && navCategory.dataset.routeBound !== "1") {
    navCategory.dataset.routeBound = "1";
    navCategory.addEventListener("change", function () {
      var selected = normalizeCat(navCategory.value);
      if (selected) {
        goToViewProducts();
      }
    });
  }
}

function initAccount() {
  var accBtn = document.querySelector(".acc-btn");
  var accDropdown = document.getElementById("accDropdown");
  var accUserName = document.getElementById("accUserName");
  var accUserEmail = document.getElementById("accUserEmail");
  var accLogout = document.getElementById("accLogout");
  var accLogin = document.querySelector(".acc-login");
  var adminLink = document.getElementById("adminMenuLink");
  var navMyAccountItem = document.getElementById("navMyAccountItem");
  var navMyOrdersItem = document.getElementById("navMyOrdersItem");
  var navLoginItem = document.getElementById("navLoginItem");
  var navAdminItem = document.getElementById("navAdminItem");
  var authOnly = document.querySelectorAll("[data-auth-only]");
  var guestOnly = document.querySelectorAll("[data-guest-only]");

  if (!accBtn || !accDropdown) {
    return;
  }

  function updateAccountUI() {
    var user = getCurrentUser();
    if (user) {
      accUserName && (accUserName.textContent = user.name || "User");
      accUserEmail && (accUserEmail.textContent = user.email || "");
      if (accLogout) {
        accLogout.style.display = "block";
      }
      if (accLogin) {
        accLogin.style.display = "none";
      }
      if (adminLink) {
        adminLink.style.display = user.role === "admin" ? "block" : "none";
      }
      if (navAdminItem) {
        navAdminItem.style.display = user.role === "admin" ? "list-item" : "none";
      }
      if (navMyAccountItem) {
        navMyAccountItem.style.display = "list-item";
      }
      if (navMyOrdersItem) {
        navMyOrdersItem.style.display = "list-item";
      }
      if (navLoginItem) {
        navLoginItem.style.display = "none";
      }
      authOnly.forEach(function (el) { el.style.display = "block"; });
      guestOnly.forEach(function (el) { el.style.display = "none"; });
    } else {
      accUserName && (accUserName.textContent = "Guest");
      accUserEmail && (accUserEmail.textContent = "Please login");
      if (accLogout) {
        accLogout.style.display = "none";
      }
      if (accLogin) {
        accLogin.style.display = "block";
        accLogin.setAttribute("href", appUrl("auth/login.html"));
      }
      if (adminLink) {
        adminLink.style.display = "none";
      }
      if (navAdminItem) {
        navAdminItem.style.display = "none";
      }
      if (navMyAccountItem) {
        navMyAccountItem.style.display = "none";
      }
      if (navMyOrdersItem) {
        navMyOrdersItem.style.display = "none";
      }
      if (navLoginItem) {
        navLoginItem.style.display = "list-item";
      }
      authOnly.forEach(function (el) { el.style.display = "none"; });
      guestOnly.forEach(function (el) { el.style.display = "block"; });
    }
  }

  accBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    accDropdown.classList.toggle("show");
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".account-wrap")) {
      accDropdown.classList.remove("show");
    }
  });

  accLogout && accLogout.addEventListener("click", function () {
    localStorage.removeItem("currentUser");
    // Ensure logged-out (guest) session starts clean.
    writeScopedJson("cart", []);
    writeScopedJson("wishlist", []);
    loadSessionCollections();
    updateCartCount();
    renderCart();
    renderWishlist();
    if (typeof window.renderCategorySections === "function") {
      window.renderCategorySections();
    }
    if (typeof window.renderRecentlyViewedHome === "function") {
      window.renderRecentlyViewedHome();
    }
    updateAccountUI();
    accDropdown.classList.remove("show");
  });

  updateAccountUI();
}

function initDrawers() {
  var cartDrawer = document.getElementById("cartDrawer");
  var cartOverlay = document.getElementById("cartOverlay");
  var cartClose = document.getElementById("cartClose");

  var wishDrawer = document.getElementById("wishDrawer");
  var wishOverlay = document.getElementById("wishOverlay");
  var wishClose = document.getElementById("wishClose");

  var cartBtn = document.querySelector('.icon-btn[title="Cart"]');
  var wishBtn = document.querySelector('.icon-btn[title="Wishlist"]');
  var wishShopBtn = document.getElementById("wishShop");

  function openCart() {
    if (!getCurrentUser()) {
      requireAuth();
      return;
    }
    if (!cartDrawer) {
      return;
    }
    cartDrawer.classList.add("open");
    document.body.style.overflow = "hidden";
    renderCart();
  }

  function closeCart() {
    if (!cartDrawer) {
      return;
    }
    cartDrawer.classList.remove("open");
    document.body.style.overflow = "";
  }

  function openWish() {
    if (!getCurrentUser()) {
      requireAuth();
      return;
    }
    if (!wishDrawer) {
      return;
    }
    wishDrawer.classList.add("open");
    document.body.style.overflow = "hidden";
    renderWishlist();
  }

  function closeWish() {
    if (!wishDrawer) {
      return;
    }
    wishDrawer.classList.remove("open");
    document.body.style.overflow = "";
  }

  cartBtn && cartBtn.addEventListener("click", openCart);
  cartClose && cartClose.addEventListener("click", closeCart);
  cartOverlay && cartOverlay.addEventListener("click", closeCart);

  wishBtn && wishBtn.addEventListener("click", openWish);
  wishClose && wishClose.addEventListener("click", closeWish);
  wishOverlay && wishOverlay.addEventListener("click", closeWish);
  wishShopBtn && wishShopBtn.addEventListener("click", function () {
    closeWish();
    window.location.href = appUrl("All Page/view-all-page.html");
  });
}

function addToCart(id, qty) {
  if (!getCurrentUser()) {
    requireAuth();
    return;
  }
  loadSessionCollections();

  var itemQty = Math.max(1, Number(qty || 1));
  var product = products.find(function (p) { return Number(p.id) === Number(id); });
  if (!product) {
    return;
  }

  var found = cart.find(function (entry) { return Number(entry.id) === Number(id); });
  if (found) {
    found.qty += itemQty;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: Number(product.price || 0),
      img: product.img,
      qty: itemQty
    });
  }

  saveCart();
  renderCart();
}

function removeFromCart(id) {
  loadSessionCollections();
  cart = cart.filter(function (entry) {
    return Number(entry.id) !== Number(id);
  });
  window.cart = cart;
  saveCart();
  renderCart();
}

function renderCart() {
  loadSessionCollections();
  if (!cartList) {
    cartList = document.getElementById("cartList");
  }
  if (!cartTotalEl) {
    cartTotalEl = document.getElementById("cartTotal");
  }
  if (!cartList) {
    return;
  }

  cartList.innerHTML = "";
  var total = 0;

  if (!cart.length) {
    cartList.innerHTML = '<li class="cart-item"><div><h5>Your cart is empty</h5></div></li>';
  }

  cart.forEach(function (item) {
    var lineTotal = Number(item.price || 0) * Number(item.qty || 1);
    total += lineTotal;

    var li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = [
      '<img src="' + (item.img || "") + '" alt="' + (item.title || "Product") + '">',
      "<div>",
      '<h5>' + item.title + '</h5>',
      '<div class="ci-price">' + formatInr(item.price) + '</div>',
      '<div class="ci-qty">',
      '<button class="dec" type="button">-</button>',
      '<span>' + item.qty + "</span>",
      '<button class="inc" type="button">+</button>',
      "</div>",
      "</div>",
      '<button class="ci-remove" type="button">x</button>'
    ].join("");

    li.querySelector(".inc").addEventListener("click", function () {
      item.qty += 1;
      saveCart();
      renderCart();
    });

    li.querySelector(".dec").addEventListener("click", function () {
      item.qty = Math.max(1, item.qty - 1);
      saveCart();
      renderCart();
    });

    li.querySelector(".ci-remove").addEventListener("click", function () {
      removeFromCart(item.id);
    });

    cartList.appendChild(li);
  });

  if (cartTotalEl) {
    cartTotalEl.textContent = formatInr(total);
  }

  var checkoutBtn = document.querySelector(".cart-checkout");
  if (checkoutBtn) {
    var hasItems = Array.isArray(cart) && cart.length > 0;
    checkoutBtn.removeAttribute("disabled");
    checkoutBtn.setAttribute("aria-disabled", hasItems ? "false" : "true");
    checkoutBtn.title = hasItems ? "Proceed to Checkout" : "Your cart is empty";
  }
  updateCartCount();
}

function toggleWish(id) {
  if (!getCurrentUser()) {
    requireAuth();
    return;
  }
  loadSessionCollections();

  var n = Number(id);
  var exists = wishlist.indexOf(n);
  if (exists >= 0) {
    wishlist.splice(exists, 1);
  } else {
    wishlist.push(n);
  }
  saveWishlist();
  renderProducts();
  renderWishlist();
}

function renderWishlist() {
  loadSessionCollections();
  if (!wishList) {
    wishList = document.getElementById("wishList");
  }
  if (!wishList) {
    return;
  }

  wishList.innerHTML = "";

  if (!wishlist.length) {
    wishList.innerHTML = '<p style="text-align:center;padding:12px 4px">Wishlist is empty</p>';
    return;
  }

  wishlist.forEach(function (id) {
    var p = products.find(function (item) {
      return Number(item.id) === Number(id);
    });
    if (!p) {
      return;
    }

    var li = document.createElement("li");
    li.className = "wish-item";
    li.innerHTML = [
      '<img src="' + p.img + '" alt="' + p.title + '">',
      "<div>",
      '<h5>' + p.title + '</h5>',
      '<div style="font-weight:700">' + formatInr(p.price) + "</div>",
      "</div>",
      '<button class="ci-remove" type="button">x</button>'
    ].join("");

    li.querySelector(".ci-remove").addEventListener("click", function (event) {
      event.stopPropagation();
      wishlist = wishlist.filter(function (w) {
        return Number(w) !== Number(id);
      });
      window.wishlist = wishlist;
      saveWishlist();
      renderWishlist();
      renderProducts();
    });

    li.addEventListener("click", function () {
      window.location.href = appUrl("products/product.html?id=" + p.id);
    });

    wishList.appendChild(li);
  });
}

function initSearchAndFilters() {
  document.querySelectorAll(".pc-card").forEach(function (card) {
    card.addEventListener("click", function () {
      var cat = card.dataset.cat;
      var filtered = products.filter(function (p) {
        return p.category === cat;
      });
      renderProducts(filtered);
      grid && grid.scrollIntoView({ behavior: "smooth" });
    });
  });

}

function skeletonCardHTML() {
  return [
    '<div class="bs-card sk-card" aria-hidden="true">',
    '<div class="sk-media skeleton"></div>',
    '<div class="sk-body">',
    '<div class="sk-line w-90 skeleton"></div>',
    '<div class="sk-line w-70 skeleton"></div>',
    '<div class="sk-price-row">',
    '<span class="sk-chip skeleton"></span>',
    '<span class="sk-chip skeleton"></span>',
    "</div>",
    '<div class="sk-actions">',
    '<span class="sk-qty skeleton"></span>',
    '<span class="sk-btn skeleton"></span>',
    "</div>",
    "</div>",
    "</div>"
  ].join("");
}

function renderProductGridSkeleton(container, count) {
  if (!container) {
    return;
  }
  var total = Math.max(1, Number(count) || 6);
  var cards = "";
  for (var i = 0; i < total; i += 1) {
    cards += skeletonCardHTML();
  }

  var isGrid = container.classList && container.classList.contains("bs-grid");
  if (isGrid) {
    container.innerHTML = cards;
    return;
  }
  container.innerHTML = '<div class="bs-grid sk-grid">' + cards + "</div>";
}

function getSkeletonDelayMs() {
  var delay = Number(window.__SKELETON_DELAY_MS);
  if (!Number.isFinite(delay)) {
    delay = Number(localStorage.getItem("skeletonDelayMs"));
  }
  if (!Number.isFinite(delay)) {
    delay = Number(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.skeletonDelayMs);
  }
  if (!Number.isFinite(delay)) {
    delay = 220;
  }
  return Math.max(0, Math.min(1200, Math.round(delay)));
}

function renderProducts(list) {
  var source = Array.isArray(list) ? list : products;
  if (!grid) {
    grid = document.getElementById("bestsellersGrid");
  }
  if (!grid) {
    return;
  }

  grid.innerHTML = '<div class="bs-grid"></div>';
  var wrap = grid.querySelector(".bs-grid");

  if (!source.length) {
    wrap.innerHTML = '<p style="padding:20px">No products found.</p>';
    return;
  }

  source.forEach(function (p) {
    var isWish = wishlist.includes(Number(p.id));
    var card = document.createElement("div");
    card.className = "bs-card";
    card.innerHTML = [
      '<div class="bs-img">',
      '<img src="' + p.img + '" alt="' + p.title + '">',
      p.badge ? '<span class="bs-badge">' + p.badge + "</span>" : "",
      '<button class="wish-btn ' + (isWish ? "active" : "") + '" data-id="' + p.id + '">&#9829;</button>',
      "</div>",
      '<div class="bs-info">',
      '<h4>' + p.title + '</h4>',
      '<p class="bs-desc">' + (p.desc || "") + '</p>',
      '<div class="bs-price">',
      p.old ? '<span class="old">' + formatInr(p.old) + "</span>" : "",
      '<span class="new">' + formatInr(p.price) + "</span>",
      "</div>",
      '<div class="bs-rating">' + stars(p.rating) + " " + Number(p.rating || 0).toFixed(1) + " | " + Number(p.reviews || 0) + " reviews</div>",
      '<div class="bs-actions">',
      '<div class="qty">',
      '<button class="dec" type="button">-</button>',
      '<span class="qty-val">1</span>',
      '<button class="inc" type="button">+</button>',
      "</div>",
      '<button class="add-cart" type="button">Add</button>',
      "</div>",
      "</div>"
    ].join("");

    var qtyEl = card.querySelector(".qty-val");

    card.querySelector(".inc").addEventListener("click", function (event) {
      event.stopPropagation();
      qtyEl.textContent = String(Number(qtyEl.textContent) + 1);
    });

    card.querySelector(".dec").addEventListener("click", function (event) {
      event.stopPropagation();
      qtyEl.textContent = String(Math.max(1, Number(qtyEl.textContent) - 1));
    });

    card.querySelector(".add-cart").addEventListener("click", function (event) {
      event.stopPropagation();
      var qty = Number(qtyEl.textContent || "1");
      addToCart(p.id, qty);
      showToast("Added " + qty + " item(s)");
      qtyEl.textContent = "1";
    });

    card.querySelector(".wish-btn").addEventListener("click", function (event) {
      event.stopPropagation();
      toggleWish(p.id);
    });

    card.addEventListener("click", function () {
      window.location.href = appUrl("products/product.html?id=" + p.id);
    });

    wrap.appendChild(card);
  });
}

function renderBestSellers() {
  var isMobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
  var limit = isMobile ? 6 : 5;
  var source = products
    .filter(function (p) { return p && p.status !== "draft"; })
    .slice()
    .sort(function (a, b) {
      var byRating = Number(b.rating || 0) - Number(a.rating || 0);
      if (byRating !== 0) {
        return byRating;
      }
      return Number(b.reviews || 0) - Number(a.reviews || 0);
    })
    .slice(0, limit);

  renderProducts(source);
}

function renderRecentlyViewedHome() {
  var gridNode = document.getElementById("recentViewedHomeGrid");
  var section = document.getElementById("recentViewedHome");
  if (!gridNode || !section) {
    return;
  }

  var ids = [];
  try {
    ids = JSON.parse(localStorage.getItem(getRecentlyViewedKey()) || "[]");
  } catch (_err) {
    ids = [];
  }

  if (!Array.isArray(ids) || !ids.length) {
    section.style.display = "none";
    return;
  }

  var recentProducts = ids
    .map(function (rid) {
      return products.find(function (p) { return Number(p.id) === Number(rid); });
    })
    .filter(Boolean);

  var isMobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
  var recentLimit = isMobile ? 6 : 5;

  recentProducts = recentProducts.slice(0, recentLimit);

  if (!recentProducts.length) {
    section.style.display = "none";
    return;
  }

  section.style.display = "";
  gridNode.innerHTML = "";

  recentProducts.forEach(function (p) {
    var isWish = wishlist.includes(Number(p.id));
    var card = document.createElement("div");
    card.className = "bs-card";
    card.innerHTML = [
      '<div class="bs-img">',
      '<img src="' + (p.img || "https://via.placeholder.com/300x300?text=No+Image") + '" alt="' + (p.title || "Product") + '">',
      p.badge ? '<span class="bs-badge">' + p.badge + "</span>" : "",
      '<button class="wish-btn ' + (isWish ? "active" : "") + '" data-id="' + p.id + '">&#9829;</button>',
      "</div>",
      '<div class="bs-info">',
      '<h4>' + (p.title || "Untitled") + '</h4>',
      '<p class="bs-desc">' + (p.desc || "") + '</p>',
      '<div class="bs-price">' + (p.old ? '<span class="old">' + formatInr(p.old) + '</span>' : "") + '<span class="new">' + formatInr(p.price) + "</span></div>",
      '<div class="bs-actions">',
      '<div class="qty"><button class="dec" type="button">-</button><span class="qty-val">1</span><button class="inc" type="button">+</button></div>',
      '<button class="add-cart" type="button">Add</button>',
      "</div>",
      "</div>"
    ].join("");

    var qtyEl = card.querySelector(".qty-val");

    card.querySelector(".inc").addEventListener("click", function (event) {
      event.stopPropagation();
      qtyEl.textContent = String(Number(qtyEl.textContent || "1") + 1);
    });

    card.querySelector(".dec").addEventListener("click", function (event) {
      event.stopPropagation();
      qtyEl.textContent = String(Math.max(1, Number(qtyEl.textContent || "1") - 1));
    });

    card.querySelector(".add-cart").addEventListener("click", function (event) {
      event.stopPropagation();
      addToCart(p.id, Number(qtyEl.textContent || "1"));
      showToast("Added to cart");
      qtyEl.textContent = "1";
    });

    card.querySelector(".wish-btn").addEventListener("click", function (event) {
      event.stopPropagation();
      toggleWish(p.id);
    });

    card.addEventListener("click", function () {
      window.location.href = appUrl("products/product.html?id=" + p.id);
    });

    gridNode.appendChild(card);
  });
}

function initDealTimer() {
  var dDays = document.getElementById("dDays");
  var dHours = document.getElementById("dHours");
  var dMins = document.getElementById("dMins");
  var dSecs = document.getElementById("dSecs");
  if (!dDays || !dHours || !dMins || !dSecs) {
    return;
  }

  var endTime = Date.now() + 48 * 60 * 60 * 1000;

  function update() {
    var diff = Math.max(0, endTime - Date.now());
    var days = Math.floor(diff / (24 * 60 * 60 * 1000));
    var hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    var mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    var secs = Math.floor((diff % (60 * 1000)) / 1000);

    dDays.textContent = String(days).padStart(2, "0");
    dHours.textContent = String(hours).padStart(2, "0");
    dMins.textContent = String(mins).padStart(2, "0");
    dSecs.textContent = String(secs).padStart(2, "0");
  }

  update();
  setInterval(update, 1000);
}

function initNewsletter() {
  var form = document.getElementById("newsForm");
  var email = document.getElementById("newsEmail");
  if (!form || !email) {
    return;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var value = email.value.trim();
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      alert("Please enter a valid email address.");
      return;
    }
    alert("Coupon sent to " + value + " (demo)");
    form.reset();
  });
}

function initBackToTop() {
  var btn = document.getElementById("backToTop");
  if (!btn || btn.dataset.bound === "true") {
    return;
  }
  btn.dataset.bound = "true";

  var syncVisibility = function () {
    if (window.scrollY > 500) {
      btn.classList.add("show");
    } else {
      btn.classList.remove("show");
    }
  };

  window.addEventListener("scroll", syncVisibility);
  syncVisibility();

  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function initWhyUsReveal() {
  var cards = document.querySelectorAll(".why-card");
  if (!cards.length || typeof IntersectionObserver === "undefined") {
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  }, { threshold: 0.25 });

  cards.forEach(function (card) { observer.observe(card); });
}

function initFloatingWhatsApp() {
  var button = document.querySelector(".wa-float");
  if (!button || button.dataset.bound === "true") {
    return;
  }
  button.dataset.bound = "true";

  var syncVisibility = function () {
    var nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 220;
    button.style.opacity = nearBottom ? "0" : "1";
  };

  window.addEventListener("scroll", syncVisibility);
  window.addEventListener("resize", syncVisibility);
  syncVisibility();
}
function ensureFloatingActionButtons() {
  if (!document.body) {
    return;
  }

  if (!document.querySelector(".wa-float")) {
    var wa = document.createElement("a");
    wa.href = "https://wa.me/919000000000?text=Hello%20I%20want%20to%20order";
    wa.className = "wa-float";
    wa.target = "_blank";
    wa.rel = "noopener noreferrer";
    wa.setAttribute("aria-label", "Chat on WhatsApp");
    wa.innerHTML = '<i class="fa-brands fa-whatsapp"></i>';
    document.body.appendChild(wa);
  }

  if (!document.getElementById("backToTop")) {
    var backTop = document.createElement("button");
    backTop.id = "backToTop";
    backTop.className = "back-top";
    backTop.type = "button";
    backTop.setAttribute("aria-label", "Back to top");
    backTop.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    document.body.appendChild(backTop);
  }
}

function initGlobalFloatingActions() {
  ensureFloatingActionButtons();
  initBackToTop();
  initFloatingWhatsApp();
}

function initSectionReveal() {
  if (typeof IntersectionObserver === "undefined") {
    return;
  }

  var targets = document.querySelectorAll(".prod-cats, .best, .cat-section, .deals, .why-us, .testimonials, .cta-news, .pay-strip");
  if (!targets.length) {
    return;
  }

  targets.forEach(function (el) {
    el.classList.add("reveal");
  });

  var observer = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) {
        return;
      }
      entry.target.classList.add("is-visible");
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

  targets.forEach(function (el) {
    observer.observe(el);
  });
}

function bootHomePage() {
  var runHomeRender = function () {
    renderBestSellers();
    renderRecentlyViewedHome();
    window.__homeInitialHydrated = true;
  };

  if (!window.__homeInitialHydrated) {
    renderProductGridSkeleton(document.getElementById("bestsellersGrid"), 5);
    renderProductGridSkeleton(document.getElementById("recentViewedHomeGrid"), 5);
    setTimeout(runHomeRender, getSkeletonDelayMs());
  } else {
    runHomeRender();
  }

  renderCart();
  renderWishlist();
  initSearchAndFilters();
  initDealTimer();
  initNewsletter();
  initWhyUsReveal();
  initBackToTop();
  initFloatingWhatsApp();
  initSectionReveal();

  if (!window.__bestSellerResizeBound) {
    window.__bestSellerResizeBound = true;
    window.addEventListener("resize", function () {
      renderBestSellers();
    });
  }
}

function requireAuth(redirectRoute) {
  var user = getCurrentUser();
  if (user) {
    return user;
  }
  var next = encodeURIComponent(window.location.pathname + window.location.search);
  var loginUrl = appUrl("auth/login.html?next=" + next);
  if (redirectRoute) {
    loginUrl = appUrl("auth/login.html?next=" + encodeURIComponent(redirectRoute));
  }
  window.location.href = loginUrl;
  return null;
}

window.initHero = initHero;
window.initNavbar = initNavbar;
window.initAccount = initAccount;
window.initDrawers = initDrawers;
window.addToCart = addToCart;
window.toggleWish = toggleWish;
window.showToast = showToast;
window.renderProducts = renderProducts;
window.renderBestSellers = renderBestSellers;
window.saveProducts = saveProducts;
window.renderCart = renderCart;
window.renderWishlist = renderWishlist;
window.appUrl = appUrl;
window.bootHomePage = bootHomePage;
window.getCurrentUser = getCurrentUser;
window.requireAuth = requireAuth;
window.scopedKey = scopedKey;
window.readScopedJson = readScopedJson;
window.writeScopedJson = writeScopedJson;
window.loadSessionCollections = loadSessionCollections;
window.renderRecentlyViewedHome = renderRecentlyViewedHome;
window.updateCartCount = updateCartCount;
window.renderProductGridSkeleton = renderProductGridSkeleton;
window.getSkeletonDelayMs = getSkeletonDelayMs;

initTheme();
updateCartCount();
ensureToast();
initGlobalFloatingActions();

window.applyTheme = applyTheme;
window.initThemeToggle = initThemeToggle;


