"use strict";

var categoryGrids = {
  dryfruits: document.getElementById("grid-dryfruits"),
  seeds: document.getElementById("grid-seeds"),
  sweets: document.getElementById("grid-sweets"),
  pickles: document.getElementById("grid-pickles"),
  combos: document.getElementById("grid-combos")
};

function localSkeletonCardHTML() {
  return [
    '<div class="bs-card sk-card" aria-hidden="true">',
    '<div class="sk-media skeleton"></div>',
    '<div class="sk-body">',
    '<div class="sk-line w-90 skeleton"></div>',
    '<div class="sk-line w-70 skeleton"></div>',
    '<div class="sk-price-row"><span class="sk-chip skeleton"></span><span class="sk-chip skeleton"></span></div>',
    '<div class="sk-actions"><span class="sk-qty skeleton"></span><span class="sk-btn skeleton"></span></div>',
    "</div>",
    "</div>"
  ].join("");
}

function renderLocalCategorySkeleton(grid, count) {
  if (!grid) {
    return;
  }
  var total = Math.max(1, Number(count) || 5);
  var html = "";
  for (var i = 0; i < total; i += 1) {
    html += localSkeletonCardHTML();
  }
  grid.innerHTML = html;
}

function showCategorySkeletons() {
  var isMobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
  var limit = isMobile ? 6 : 5;
  Object.keys(categoryGrids).forEach(function (key) {
    var grid = categoryGrids[key];
    if (!grid) {
      return;
    }
    if (typeof window.renderProductGridSkeleton === "function") {
      window.renderProductGridSkeleton(grid, limit);
    } else {
      renderLocalCategorySkeleton(grid, limit);
    }
  });
}

function stars(rating) {
  var rounded = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));
  var html = "";
  for (var i = 1; i <= 5; i += 1) {
    html += i <= rounded ? '<span class="star-full">&#9733;</span>' : '<span class="star-empty">&#9734;</span>';
  }
  return '<span class="rating-stars" aria-hidden="true">' + html + "</span>";
}

function catCardHTML(product) {
  var isWish = (window.wishlist || []).includes(Number(product.id));
  return [
    '<div class="bs-card" data-id="' + product.id + '">',
    '<div class="bs-img">',
    '<img src="' + product.img + '" alt="' + product.title + '">',
    product.badge ? '<span class="bs-badge">' + product.badge + '</span>' : "",
    '<button class="wish-btn ' + (isWish ? "active" : "") + '" data-id="' + product.id + '">&#9829;</button>',
    "</div>",
    '<div class="bs-info">',
    '<h4>' + product.title + '</h4>',
    '<p class="bs-desc">' + (product.desc || "") + '</p>',
    '<div class="bs-price">' + (product.old ? '<span class="old">Rs ' + product.old + '</span>' : "") + '<span class="new">Rs ' + product.price + '</span></div>',
    '<div class="bs-rating">' + stars(product.rating || 4.5) + ' ' + Number(product.rating || 4.5).toFixed(1) + ' | ' + Number(product.reviews || 0) + ' reviews</div>',
    '<div class="bs-actions">',
    '<div class="qty"><button class="dec" type="button">-</button><span class="qty-val">1</span><button class="inc" type="button">+</button></div>',
    '<button class="add-cart" type="button">Add</button>',
    "</div>",
    "</div>",
    "</div>"
  ].join("");
}

function bindCardActions(container) {
  container.querySelectorAll(".bs-card").forEach(function (card) {
    var id = Number(card.dataset.id);
    var qtyEl = card.querySelector(".qty-val");
    var wishBtn = card.querySelector(".wish-btn");

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
      window.addToCart && window.addToCart(id, Number(qtyEl.textContent || "1"));
      window.showToast && window.showToast("Added to cart");
      qtyEl.textContent = "1";
    });

    wishBtn && wishBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      window.toggleWish && window.toggleWish(id);
      var latest = window.wishlist || [];
      wishBtn.classList.toggle("active", latest.includes(id));
    });

    card.addEventListener("click", function () {
      if (typeof window.appUrl === "function") {
        window.location.href = window.appUrl("products/product.html?id=" + id);
      } else {
        window.location.href = "products/product.html?id=" + id;
      }
    });
  });
}

function renderCategorySections() {
  var list = window.products;
  if (!Array.isArray(list) || list.length === 0) {
    return false;
  }
  var isMobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
  var limit = isMobile ? 6 : 5;

  Object.keys(categoryGrids).forEach(function (key) {
    var grid = categoryGrids[key];
    if (grid) {
      grid.innerHTML = "";
    }
  });

  list.forEach(function (product) {
    var grid = categoryGrids[product.category];
    if (grid && grid.children.length < limit) {
      grid.insertAdjacentHTML("beforeend", catCardHTML(product));
    }
  });

  Object.keys(categoryGrids).forEach(function (key) {
    var grid = categoryGrids[key];
    if (grid) {
      bindCardActions(grid);
    }
  });

  return true;
}

showCategorySkeletons();

(function waitForProducts(tries) {
  if (tries <= 0) {
    return;
  }
  if (renderCategorySections()) {
    return;
  }
  setTimeout(function () {
    waitForProducts(tries - 1);
  }, 150);
})(40);

window.renderCategorySections = renderCategorySections;

if (!window.__catSectionResizeBound) {
  window.__catSectionResizeBound = true;
  window.addEventListener("resize", function () {
    renderCategorySections();
  });
}
