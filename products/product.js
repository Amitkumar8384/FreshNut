// ================= PRODUCT PAGE JS (USE APP.JS GLOBALS) =================

const params = new URLSearchParams(window.location.search);
const id = Number(params.get("id"));

let productList = Array.isArray(window.products) ? window.products : [];
if (!productList.length) {
  try {
    const stored = JSON.parse(localStorage.getItem("products") || "[]");
    if (Array.isArray(stored)) {
      productList = stored;
      window.products = stored;
    }
  } catch (_err) {
    productList = [];
  }
}
const product = productList.find(function (p) { return Number(p.id) === id; });

if (!product) {
  document.body.innerHTML = "<h2 style='padding:40px;text-align:center'>Product not found</h2>";
  throw new Error("Product not found");
}

let reviews = {};
try {
  reviews = JSON.parse(localStorage.getItem("reviews") || "{}");
} catch (_err) {
  reviews = {};
}


// ================= DOM =================
const pdImg = document.getElementById("pdImg");
const pdThumbs = document.getElementById("pdThumbs");
const pdBadge = document.getElementById("pdBadge");
const pdTitle = document.getElementById("pdTitle");
const pdOld = document.getElementById("pdOld");
const pdNew = document.getElementById("pdNew");
const pdDesc = document.getElementById("pdDesc");
const pdLongDesc = document.getElementById("pdLongDesc");
const pdHighlights = document.getElementById("pdHighlights");
const pdIngredients = document.getElementById("pdIngredients");
const pdSpecs = document.getElementById("pdSpecs");
const pdStockStatus = document.getElementById("pdStockStatus");
const pdAdd = document.getElementById("pdAdd");
const pdWish = document.getElementById("pdWish");
const qtyVal = document.getElementById("qtyVal");
const qtyInc = document.getElementById("qtyInc");
const qtyDec = document.getElementById("qtyDec");
const pdStars = document.getElementById("pdStars");
const pdRatingText = document.getElementById("pdRatingText");
const wishCountEl = document.getElementById("wishCount");

const pdPincode = document.getElementById("pdPincode");
const pdEtaBtn = document.getElementById("pdEtaBtn");
const pdEtaResult = document.getElementById("pdEtaResult");

const pdRelatedTrack = document.getElementById("pdRelatedTrack");
const relPrev = document.getElementById("relPrev");
const relNext = document.getElementById("relNext");

const rateInput = document.getElementById("rateInput");
const revName = document.getElementById("revName");
const revText = document.getElementById("revText");
const revSubmit = document.getElementById("revSubmit");
const reviewList = document.getElementById("reviewList");

// ================= HELPERS =================
function safeText(value) {
  return String(value || "").replace(/[<>&\"]/g, function (ch) {
    if (ch === "<") { return "&lt;"; }
    if (ch === ">") { return "&gt;"; }
    if (ch === "&") { return "&amp;"; }
    return "&quot;";
  });
}

function formatInr(value) {
  return "Rs " + Number(value || 0).toFixed(0);
}

function toast(message) {
  if (typeof window.showToast === "function") {
    window.showToast(message);
  }
}

function resolveCurrentUser() {
  if (typeof window.getCurrentUser === "function") {
    return window.getCurrentUser();
  }
  try {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    return user && typeof user === "object" ? user : null;
  } catch (_err) {
    return null;
  }
}

function resolveScopedKey(baseKey) {
  if (typeof window.scopedKey === "function") {
    return window.scopedKey(baseKey);
  }
  const user = resolveCurrentUser();
  const key = user && user.email
    ? String(user.email).trim().toLowerCase().replace(/[^a-z0-9]/g, "_")
    : "guest";
  return String(baseKey) + "::" + key;
}

function readScopedList(baseKey, fallback) {
  try {
    if (typeof window.readScopedJson === "function") {
      const v = window.readScopedJson(baseKey, fallback);
      return Array.isArray(v) ? v : fallback;
    }
    const raw = localStorage.getItem(resolveScopedKey(baseKey));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (_err) {
    // ignore
  }
  return Array.isArray(fallback) ? fallback : [];
}

function writeScopedList(baseKey, value) {
  if (typeof window.writeScopedJson === "function") {
    window.writeScopedJson(baseKey, value);
    return;
  }
  localStorage.setItem(resolveScopedKey(baseKey), JSON.stringify(value));
}

function syncSessionCollections() {
  if (typeof window.loadSessionCollections === "function") {
    window.loadSessionCollections();
  } else {
    cart = readScopedList("cart", cart);
    wishlist = readScopedList("wishlist", wishlist);
    window.cart = cart;
    window.wishlist = wishlist;
  }
  cart = Array.isArray(window.cart) ? window.cart : cart;
  wishlist = Array.isArray(window.wishlist) ? window.wishlist : wishlist;
}

function trackRecentlyViewed() {
  const key = resolveScopedKey("recentlyViewedProductIds");
  let ids = [];
  try {
    ids = JSON.parse(localStorage.getItem(key) || "[]");
  } catch (_err) {
    ids = [];
  }
  if (!Array.isArray(ids)) {
    ids = [];
  }

  ids = ids.filter(function (pid) { return Number(pid) !== Number(product.id); });
  ids.unshift(Number(product.id));
  ids = ids.slice(0, 12);
  localStorage.setItem(key, JSON.stringify(ids));

  if (typeof window.renderRecentlyViewedHome === "function") {
    window.renderRecentlyViewedHome();
  }
}

function getGalleryImages() {
  let gallery = [];
  if (Array.isArray(product.gallery) && product.gallery.length) {
    gallery = product.gallery.slice();
  } else {
    gallery = [product.img];
    if (product.altImg) {
      gallery.push(product.altImg);
    }
  }

  gallery = gallery.filter(function (url, idx, arr) {
    return url && arr.indexOf(url) === idx;
  });

  return gallery.length ? gallery : ["https://via.placeholder.com/600x600?text=No+Image"];
}

function defaultHighlights() {
  return [
    "Premium quality ingredients",
    "Hygienically packed and sealed",
    "No added artificial colors",
    "Ideal for daily snacking"
  ];
}

function defaultIngredients(category) {
  if (category === "dryfruits") {
    return ["Almonds/Cashews mix", "Natural antioxidants", "No preservatives"];
  }
  if (category === "seeds") {
    return ["Pumpkin seeds", "Sunflower seeds", "Mild seasoning"];
  }
  if (category === "sweets") {
    return ["Milk solids", "Dry fruits", "Natural flavors", "Sugar"];
  }
  if (category === "pickles") {
    return ["Fresh produce", "Mustard oil", "Traditional spices", "Salt"];
  }
  return ["Dry fruits", "Seeds", "Natural flavors"];
}

function defaultSpecs() {
  return {
    Weight: "500g",
    Origin: "India",
    "Shelf Life": "6 months",
    "Pack Type": "Food-grade sealed pouch"
  };
}

function getProductReviews() {
  return Array.isArray(reviews[id]) ? reviews[id] : [];
}

function getRatingSummary() {
  const list = getProductReviews();
  if (!list.length) {
    return {
      avg: Number(product.rating || 0),
      count: Number(product.reviews || 0)
    };
  }
  const total = list.reduce(function (sum, r) {
    return sum + Math.max(1, Math.min(5, Number(r.rate || 0)));
  }, 0);
  return {
    avg: total / list.length,
    count: list.length
  };
}

function syncProductRating(summary) {
  product.rating = Number(summary.avg || 0);
  product.reviews = Number(summary.count || 0);

  const list = Array.isArray(window.products) ? window.products : [];
  const idx = list.findIndex(function (p) { return Number(p.id) === Number(product.id); });
  if (idx >= 0) {
    list[idx] = product;
    window.products = list;
    localStorage.setItem("products", JSON.stringify(list));
  }
}

// ================= RENDER =================
function renderBasic() {
  if (pdImg) {
    pdImg.src = product.img || "https://via.placeholder.com/400x400?text=No+Image";
    pdImg.onerror = function () {
      pdImg.src = "https://via.placeholder.com/400x400?text=No+Image";
    };
  }
  if (pdTitle) { pdTitle.textContent = product.title || ""; }
  if (pdDesc) { pdDesc.textContent = product.desc || ""; }
  if (pdOld) { pdOld.textContent = product.old ? formatInr(product.old) : ""; }
  if (pdNew) { pdNew.textContent = formatInr(product.price); }
  if (pdBadge) {
    pdBadge.textContent = product.badge || "";
    pdBadge.style.display = product.badge ? "inline-block" : "none";
  }
}

function renderGallery() {
  const images = getGalleryImages();
  if (pdImg) {
    pdImg.src = images[0];
  }
  if (!pdThumbs) {
    return;
  }
  pdThumbs.innerHTML = "";
  images.forEach(function (src, i) {
    const thumb = document.createElement("img");
    thumb.className = "pd-thumb" + (i === 0 ? " active" : "");
    thumb.src = src;
    thumb.alt = product.title || "image";
    thumb.addEventListener("click", function () {
      if (pdImg) {
        pdImg.src = src;
      }
      pdThumbs.querySelectorAll(".pd-thumb").forEach(function (el) {
        el.classList.remove("active");
      });
      thumb.classList.add("active");
    });
    pdThumbs.appendChild(thumb);
  });
}

function renderExtraDetails() {
  if (pdLongDesc) {
    pdLongDesc.textContent = product.longDesc || product.desc || "Premium product with quality assurance and freshness guarantee.";
  }

  const highlights = Array.isArray(product.highlights) && product.highlights.length ? product.highlights : defaultHighlights();
  if (pdHighlights) {
    pdHighlights.innerHTML = highlights.map(function (h) { return "<li>" + safeText(h) + "</li>"; }).join("");
  }

  const ingredients = Array.isArray(product.ingredients) && product.ingredients.length ? product.ingredients : defaultIngredients(product.category);
  if (pdIngredients) {
    pdIngredients.innerHTML = ingredients.map(function (h) { return "<li>" + safeText(h) + "</li>"; }).join("");
  }

  const specs = product.specs && typeof product.specs === "object" ? product.specs : defaultSpecs();
  if (pdSpecs) {
    pdSpecs.innerHTML = Object.keys(specs).map(function (k) {
      return '<div class="pd-spec-row"><span>' + safeText(k) + '</span><b>' + safeText(specs[k]) + "</b></div>";
    }).join("");
  }
}

function renderStockStatus() {
  if (!pdStockStatus) {
    return;
  }
  const stock = Math.max(0, Number(product.stock || 0));
  pdStockStatus.classList.remove("in", "low", "out");

  if (stock <= 0) {
    pdStockStatus.textContent = "Out of stock";
    pdStockStatus.classList.add("out");
    if (pdAdd) {
      pdAdd.disabled = true;
      pdAdd.textContent = "Out of Stock";
    }
    return;
  }

  if (stock <= 5) {
    pdStockStatus.textContent = "Only " + stock + " left in stock";
    pdStockStatus.classList.add("low");
  } else {
    pdStockStatus.textContent = "In stock";
    pdStockStatus.classList.add("in");
  }
  if (pdAdd) {
    pdAdd.disabled = false;
    pdAdd.textContent = "Add to Cart";
  }
}

function renderStars(avg, count) {
  if (!pdStars) {
    return;
  }
  pdStars.innerHTML = "";
  const full = Math.round(Number(avg || 0));
  for (let i = 1; i <= 5; i += 1) {
    const star = document.createElement("span");
    star.innerHTML = i <= full ? "&#9733;" : "&#9734;";
    if (i <= full) {
      star.classList.add("active");
    }
    pdStars.appendChild(star);
  }
  if (pdRatingText) {
    pdRatingText.textContent = Number(avg || 0).toFixed(1) + " | " + Number(count || 0) + " reviews";
  }
}

function renderRelatedProducts() {
  if (!pdRelatedTrack) {
    return;
  }
  const related = productList
    .filter(function (p) {
      return Number(p.id) !== Number(product.id) && p.category === product.category;
    })
    .sort(function (a, b) {
      return Number(b.rating || 0) - Number(a.rating || 0);
    })
    .slice(0, 10);

  if (!related.length) {
    pdRelatedTrack.innerHTML = "<p style='padding:10px 2px;color:#6b3b2a'>No related products available.</p>";
    return;
  }

  pdRelatedTrack.innerHTML = related.map(function (item) {
    return [
      '<article class="pd-rel-card" data-id="' + Number(item.id) + '">',
      '<img src="' + safeText(item.img || "https://via.placeholder.com/300x300?text=No+Image") + '" alt="' + safeText(item.title || "Product") + '">',
      "<h4>" + safeText(item.title || "Untitled") + "</h4>",
      "<p>" + formatInr(item.price || 0) + "</p>",
      "</article>"
    ].join("");
  }).join("");

  pdRelatedTrack.querySelectorAll(".pd-rel-card").forEach(function (card) {
    card.addEventListener("click", function () {
      const nextId = card.getAttribute("data-id");
      const target = "products/product.html?id=" + nextId;
      window.location.href = typeof window.appUrl === "function" ? window.appUrl(target) : "product.html?id=" + nextId;
    });
  });
}

function initRelatedNav() {
  if (!pdRelatedTrack) {
    return;
  }
  function scrollRelated(dir) {
    const firstCard = pdRelatedTrack.querySelector(".pd-rel-card");
    const amount = firstCard ? firstCard.getBoundingClientRect().width + 12 : 260;
    pdRelatedTrack.scrollBy({ left: dir * amount, behavior: "smooth" });
  }
  if (relPrev) {
    relPrev.addEventListener("click", function () { scrollRelated(-1); });
  }
  if (relNext) {
    relNext.addEventListener("click", function () { scrollRelated(1); });
  }
}

function initEtaChecker() {
  if (!pdEtaBtn || !pdPincode || !pdEtaResult) {
    return;
  }
  pdEtaBtn.addEventListener("click", function () {
    const pin = String(pdPincode.value || "").trim();
    if (!/^\d{6}$/.test(pin)) {
      pdEtaResult.textContent = "Enter a valid 6-digit pincode.";
      pdEtaResult.style.color = "#b91c1c";
      return;
    }
    const baseDays = pin[0] === "1" || pin[0] === "2" || pin[0] === "3" ? 2 : 4;
    const extra = Number(pin[5]) % 2;
    const etaDays = baseDays + extra;
    const eta = new Date();
    eta.setDate(eta.getDate() + etaDays);
    pdEtaResult.textContent = "Estimated delivery by " + eta.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" }) + ".";
    pdEtaResult.style.color = "#047857";
  });
}

function updateHeaderCounts() {
  syncSessionCollections();
  if (typeof window.updateCartCount === "function") {
    window.updateCartCount();
  } else if (typeof cartCountEl !== "undefined" && cartCountEl) {
    const uniqueIds = {};
    cart.forEach(function (i) {
      if (i && i.id !== undefined && i.id !== null) {
        uniqueIds[String(i.id)] = true;
      }
    });
    cartCountEl.textContent = String(Object.keys(uniqueIds).length);
  }
  if (wishCountEl) {
    wishCountEl.textContent = String(wishlist.length);
  }
}

function updateWishUI() {
  if (!pdWish) {
    return;
  }
  const active = wishlist.includes(Number(product.id));
  pdWish.innerHTML = active
    ? '<i class="fa-solid fa-heart"></i> Wishlisted'
    : '<i class="fa-regular fa-heart"></i> Wishlist';
  pdWish.classList.toggle("active", active);
}

// ================= QTY =================
if (qtyInc) {
  qtyInc.addEventListener("click", function () {
    qtyVal.textContent = String(Number(qtyVal.textContent || "1") + 1);
  });
}

if (qtyDec) {
  qtyDec.addEventListener("click", function () {
    qtyVal.textContent = String(Math.max(1, Number(qtyVal.textContent || "1") - 1));
  });
}

// ================= ADD TO CART =================
if (pdAdd) {
  pdAdd.addEventListener("click", function () {
    if (!resolveCurrentUser()) {
      if (typeof window.requireAuth === "function") {
        window.requireAuth();
      }
      return;
    }
    if (pdAdd.disabled) {
      return;
    }

    syncSessionCollections();
    const qty = Number(qtyVal.textContent || "1");

    if (typeof window.addToCart === "function") {
      window.addToCart(product.id, qty);
      syncSessionCollections();
    } else {
      const found = cart.find(function (i) { return Number(i.id) === Number(product.id); });
      if (found) {
        found.qty += qty;
      } else {
        cart.push({
          id: product.id,
          title: product.title,
          price: product.price,
          img: product.img,
          qty: qty
        });
      }
      writeScopedList("cart", cart);
      window.cart = cart;
    }

    if (typeof window.renderCart === "function") {
      window.renderCart();
    }
    updateHeaderCounts();
    toast("Added " + qty + " item(s)");
    qtyVal.textContent = "1";
  });
}

// ================= WISHLIST =================
if (pdWish) {
  pdWish.addEventListener("click", function () {
    if (!resolveCurrentUser()) {
      if (typeof window.requireAuth === "function") {
        window.requireAuth();
      }
      return;
    }

    syncSessionCollections();
    if (typeof window.toggleWish === "function") {
      window.toggleWish(product.id);
      syncSessionCollections();
    } else if (wishlist.includes(Number(product.id))) {
      wishlist = wishlist.filter(function (w) { return Number(w) !== Number(product.id); });
      writeScopedList("wishlist", wishlist);
      window.wishlist = wishlist;
    } else {
      wishlist.push(Number(product.id));
      writeScopedList("wishlist", wishlist);
      window.wishlist = wishlist;
    }

    if (typeof window.renderWishlist === "function") {
      window.renderWishlist();
    }
    updateHeaderCounts();
    updateWishUI();
  });
}

// ================= REVIEWS =================
let selectedRate = 5;

function renderRateInput() {
  if (!rateInput) {
    return;
  }
  rateInput.innerHTML = "";
  for (let i = 1; i <= 5; i += 1) {
    const star = document.createElement("span");
    star.innerHTML = i <= selectedRate ? "&#9733;" : "&#9734;";
    if (i <= selectedRate) {
      star.classList.add("active");
    }
    (function (value) {
      star.addEventListener("click", function () {
        selectedRate = value;
        renderRateInput();
      });
    })(i);
    rateInput.appendChild(star);
  }
}

function renderReviews() {
  if (!reviewList) {
    return;
  }
  const list = getProductReviews();
  reviewList.innerHTML = "";
  if (!list.length) {
    reviewList.innerHTML = '<li class="review-item"><p>No reviews yet. Be the first to review this product.</p></li>';
    return;
  }

  list.forEach(function (review) {
    const li = document.createElement("li");
    li.className = "review-item";
    li.innerHTML = [
      '<div class="r-head"><strong>' + safeText(review.name || "Customer") + '</strong><span class="r-stars">' + "&#9733;".repeat(Math.max(1, Math.min(5, Number(review.rate || 5)))) + "</span></div>",
      "<p>" + safeText(review.text || "") + "</p>"
    ].join("");
    reviewList.appendChild(li);
  });
}

function initReviewIdentity() {
  if (!revName) {
    return;
  }
  const user = resolveCurrentUser();
  if (user && user.name) {
    revName.value = String(user.name);
    revName.readOnly = true;
    revName.title = "Using logged-in account name";
  } else {
    revName.readOnly = false;
    revName.title = "";
  }
}

if (revSubmit) {
  revSubmit.addEventListener("click", function () {
    const name = String(revName.value || "").trim();
    const text = String(revText.value || "").trim();

    if (!name || !text) {
      toast("Fill name & review");
      return;
    }

    if (!reviews[id]) {
      reviews[id] = [];
    }
    reviews[id].unshift({
      name: name,
      text: text,
      rate: selectedRate,
      ts: Date.now()
    });

    localStorage.setItem("reviews", JSON.stringify(reviews));
    if (revName && !revName.readOnly) {
      revName.value = "";
    }
    if (revText) {
      revText.value = "";
    }
    selectedRate = 5;

    const summary = getRatingSummary();
    syncProductRating(summary);
    renderStars(summary.avg, summary.count);
    renderRateInput();
    renderReviews();
    toast("Review added");
  });
}

// ================= INIT =================
try {
  syncSessionCollections();
  trackRecentlyViewed();
  renderBasic();
  renderGallery();
  renderExtraDetails();
  renderStockStatus();
  renderRelatedProducts();
  initRelatedNav();
  initEtaChecker();

  const initialSummary = getRatingSummary();
  syncProductRating(initialSummary);
  renderStars(initialSummary.avg, initialSummary.count);
  updateHeaderCounts();
  updateWishUI();
  initReviewIdentity();
  renderRateInput();
  renderReviews();
} catch (err) {
  console.error("product.js init failed:", err);
  document.body.innerHTML = "<h2 style='padding:40px;text-align:center'>Product page failed to load</h2><p style='text-align:center;color:#7a1f1f'>Please refresh once.</p>";
}
