"use strict";

var filterCat = document.getElementById("filterCat");
var searchInput = document.getElementById("searchInput");
var sortBy = document.getElementById("sortBy");
var pageTitle = document.getElementById("pageTitle");
var pageSubtitle = document.getElementById("pageSubtitle");

var params = new URLSearchParams(window.location.search);
var urlCat = (params.get("cat") || "").trim().toLowerCase();
var urlQuery = (params.get("q") || "").trim();

function getGrid() {
  return document.getElementById("productsGrid");
}

function getProducts() {
  return Array.isArray(window.products) ? window.products : [];
}

function getWishlist() {
  return Array.isArray(window.wishlist) ? window.wishlist : [];
}

function getRecentlyViewedKey() {
  if (typeof window.scopedKey === "function") {
    return window.scopedKey("recentlyViewedProductIds");
  }
  return "recentlyViewedProductIds";
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "").trim();
}

function getSortValue() {
  return normalize(sortBy && sortBy.value) || "featured";
}

function sortProducts(list) {
  var mode = getSortValue();
  var copy = Array.isArray(list) ? list.slice() : [];

  if (mode === "priceasc") {
    return copy.sort(function (a, b) {
      return Number(a.price || 0) - Number(b.price || 0);
    });
  }
  if (mode === "pricedesc") {
    return copy.sort(function (a, b) {
      return Number(b.price || 0) - Number(a.price || 0);
    });
  }
  if (mode === "ratingdesc") {
    return copy.sort(function (a, b) {
      return Number(b.rating || 0) - Number(a.rating || 0);
    });
  }
  if (mode === "nameasc") {
    return copy.sort(function (a, b) {
      return String(a.title || "").localeCompare(String(b.title || ""));
    });
  }
  return copy;
}

function stars(rating) {
  var rounded = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));
  var html = "";
  for (var i = 1; i <= 5; i += 1) {
    html += i <= rounded ? '<span class="star-full">&#9733;</span>' : '<span class="star-empty">&#9734;</span>';
  }
  return '<span class="rating-stars" aria-hidden="true">' + html + "</span>";
}

function productCardHTML(product, isWish) {
  return [
    '<div class="bs-card" data-id="' + product.id + '">',
    '<div class="bs-img">',
    '<img src="' + (product.img || "https://via.placeholder.com/300x300?text=No+Image") + '" alt="' + (product.title || "Product") + '">',
    product.badge ? '<span class="bs-badge">' + product.badge + '</span>' : "",
    '<button class="wish-btn ' + (isWish ? "active" : "") + '" data-id="' + product.id + '">&#9829;</button>',
    "</div>",
    '<div class="bs-info">',
    '<h4>' + (product.title || "Untitled") + '</h4>',
    product.desc ? '<p class="bs-desc">' + product.desc + '</p>' : "",
    '<div class="bs-price">' + (product.old ? '<span class="old">Rs ' + product.old + '</span>' : "") + '<span class="new">Rs ' + (product.price || 0) + '</span></div>',
    '<div class="bs-rating">' + stars(product.rating || 0) + ' ' + Number(product.rating || 0).toFixed(1) + ' | ' + Number(product.reviews || 0) + ' reviews</div>',
    '<div class="bs-actions">',
    '<div class="qty"><button class="dec" type="button">-</button><span class="qty-val">1</span><button class="inc" type="button">+</button></div>',
    '<button class="add-cart" type="button">Add</button>',
    "</div>",
    "</div>",
    "</div>"
  ].join("");
}

function bindCardEvents(root) {
  root.querySelectorAll(".bs-card").forEach(function (card) {
    var id = Number(card.dataset.id);
    var qtyEl = card.querySelector(".qty-val");

    card.querySelector(".inc") && card.querySelector(".inc").addEventListener("click", function (event) {
      event.stopPropagation();
      qtyEl.textContent = String(Number(qtyEl.textContent || "1") + 1);
    });

    card.querySelector(".dec") && card.querySelector(".dec").addEventListener("click", function (event) {
      event.stopPropagation();
      qtyEl.textContent = String(Math.max(1, Number(qtyEl.textContent || "1") - 1));
    });

    card.querySelector(".add-cart") && card.querySelector(".add-cart").addEventListener("click", function (event) {
      event.stopPropagation();
      var qty = Number(qtyEl.textContent || "1");
      window.addToCart && window.addToCart(id, qty);
      window.showToast && window.showToast("Added to cart");
      qtyEl.textContent = "1";
    });

    card.querySelector(".wish-btn") && card.querySelector(".wish-btn").addEventListener("click", function (event) {
      event.stopPropagation();
      window.toggleWish && window.toggleWish(id);
      var active = getWishlist().includes(id);
      event.currentTarget.classList.toggle("active", active);
    });

    card.addEventListener("click", function () {
      if (typeof window.appUrl === "function") {
        window.location.href = window.appUrl("products/product.html?id=" + id);
      } else {
        window.location.href = "../products/product.html?id=" + id;
      }
    });
  });
}

function renderFlatProducts(list) {
  var grid = getGrid();
  if (!grid) {
    return;
  }

  grid.innerHTML = '<div class="bs-grid"></div>';
  var wrap = grid.querySelector(".bs-grid");

  if (!Array.isArray(list) || !list.length) {
    wrap.innerHTML = '<p style="padding:20px">No products found.</p>';
    return;
  }

  wrap.innerHTML = list.map(function (p) {
    return productCardHTML(p, getWishlist().includes(Number(p.id)));
  }).join("");

  bindCardEvents(wrap);
}

function renderGroupedProducts(list) {
  var grid = getGrid();
  if (!grid) {
    return;
  }

  if (!Array.isArray(list) || !list.length) {
    grid.innerHTML = '<p style="padding:20px">No products found.</p>';
    return;
  }

  var groups = {};
  list.forEach(function (p) {
    var key = p.category || "others";
    groups[key] = groups[key] || [];
    groups[key].push(p);
  });

  var order = ["dryfruits", "seeds", "sweets", "pickles", "combos"];
  var keys = order.filter(function (k) { return groups[k] && groups[k].length; })
    .concat(Object.keys(groups).filter(function (k) { return order.indexOf(k) < 0; }));

  grid.innerHTML = keys.map(function (key) {
    var title = key.charAt(0).toUpperCase() + key.slice(1);
    var cards = groups[key].map(function (p) {
      return productCardHTML(p, getWishlist().includes(Number(p.id)));
    }).join("");

    return [
      '<section class="cat-group">',
      '<h3 class="cat-group-title">' + title + '</h3>',
      '<div class="bs-grid">' + cards + '</div>',
      '</section>'
    ].join("");
  }).join("");

  grid.querySelectorAll(".cat-group .bs-grid").forEach(function (wrap) {
    bindCardEvents(wrap);
  });
}

function renderRecentlyViewed() {
  var block = document.getElementById("recentViewedBlock");
  var recentGrid = document.getElementById("recentViewedGrid");
  if (!block || !recentGrid) {
    return;
  }

  var ids = [];
  try {
    ids = JSON.parse(localStorage.getItem(getRecentlyViewedKey()) || "[]");
  } catch (_err) {
    ids = [];
  }

  if (!Array.isArray(ids) || !ids.length) {
    block.style.display = "none";
    return;
  }

  var products = getProducts();
  var isMobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
  var recentLimit = isMobile ? 6 : 5;
  var list = ids
    .map(function (rid) {
      return products.find(function (p) { return Number(p.id) === Number(rid); });
    })
    .filter(Boolean)
    .slice(0, recentLimit);

  if (!list.length) {
    block.style.display = "none";
    return;
  }

  block.style.display = "";
  recentGrid.innerHTML = list.map(function (p) {
    return productCardHTML(p, getWishlist().includes(Number(p.id)));
  }).join("");
  bindCardEvents(recentGrid);
}

function showViewSkeletons() {
  if (typeof window.renderProductGridSkeleton !== "function") {
    return;
  }
  window.renderProductGridSkeleton(getGrid(), 8);
  window.renderProductGridSkeleton(document.getElementById("recentViewedGrid"), 5);
}

function getSkeletonDelay() {
  if (typeof window.getSkeletonDelayMs === "function") {
    return window.getSkeletonDelayMs();
  }
  return 220;
}

function applyFilters() {
  var q = normalize(searchInput && searchInput.value);
  var selectedCat = normalize(filterCat && filterCat.value);

  var list = getProducts();
  if (urlCat) {
    list = list.filter(function (p) {
      return normalize(p.category) === normalize(urlCat);
    });
  }

  if (selectedCat) {
    list = list.filter(function (p) {
      return normalize(p.category) === selectedCat;
    });
  }

  if (q) {
    list = list.filter(function (p) {
      return normalize(p.title).includes(q) || normalize(p.desc).includes(q);
    });
  }

  list = sortProducts(list);

  var groupedMode = !q && !selectedCat && !urlCat && getSortValue() === "featured";
  if (groupedMode) {
    renderGroupedProducts(list);
  } else {
    renderFlatProducts(list);
  }
}

function initViewPage() {
  if (urlCat && filterCat) {
    filterCat.value = urlCat;
    if (pageTitle) {
      pageTitle.textContent = "Category: " + urlCat;
    }
    if (pageSubtitle) {
      pageSubtitle.textContent = "Showing curated products from the " + urlCat + " category.";
    }
  } else if (pageTitle) {
    pageTitle.textContent = "All Products by Category";
    if (pageSubtitle) {
      pageSubtitle.textContent = "Discover premium picks across dry fruits, seeds, sweets, pickles and combos.";
    }
  }

  if (searchInput && urlQuery) {
    searchInput.value = urlQuery;
    if (pageSubtitle) {
      pageSubtitle.textContent = 'Search results for "' + urlQuery + '".';
    }
  }

  if (!window.__viewPageHydrated) {
    showViewSkeletons();
    setTimeout(function () {
      applyFilters();
      renderRecentlyViewed();
      window.__viewPageHydrated = true;
    }, getSkeletonDelay());
  } else {
    applyFilters();
    renderRecentlyViewed();
  }

  filterCat && filterCat.addEventListener("change", applyFilters);
  searchInput && searchInput.addEventListener("input", applyFilters);
  sortBy && sortBy.addEventListener("change", applyFilters);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initViewPage);
} else {
  initViewPage();
}
