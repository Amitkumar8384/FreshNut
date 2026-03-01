"use strict";

function readJson(key, fallback) {
  try {
    var parsed = JSON.parse(localStorage.getItem(key) || "null");
    return parsed === null ? fallback : parsed;
  } catch (_err) {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function userStorageId(user) {
  if (!user || !user.email) {
    return "guest";
  }
  return String(user.email).trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
}

function scopedKey(baseKey, user) {
  if (typeof window.scopedKey === "function") {
    return window.scopedKey(baseKey, user);
  }
  return String(baseKey) + "::" + userStorageId(user);
}

(function initOrdersPage() {
  var ordersList = document.getElementById("ordersList");
  var orderSearch = document.getElementById("orderSearch");
  var orderStatusFilter = document.getElementById("orderStatusFilter");

  var currentUser = readJson("currentUser", null);
  if (!currentUser) {
    window.location.href = "../auth/login.html?next=" + encodeURIComponent("../orders/orders.html");
    return;
  }

  var allOrders = readJson("orders", []);
  if (!Array.isArray(allOrders)) {
    allOrders = [];
  }

  var orders = allOrders.filter(function (order) {
    return order.customer && order.customer.email === currentUser.email;
  });

  function formatDate(ts) {
    var d = new Date(ts);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  function formatMoney(v) {
    return "Rs " + Number(v || 0).toFixed(0);
  }

  function statusLabel(value) {
    return String(value || "placed").replace(/_/g, " ");
  }

  function addItemsToCart(items) {
    var cart = readJson(scopedKey("cart", currentUser), []);
    if (!Array.isArray(cart)) {
      cart = [];
    }

    (items || []).forEach(function (item) {
      var id = Number(item.id);
      var qty = Math.max(1, Number(item.qty || 1));
      var existing = cart.find(function (c) { return Number(c.id) === id; });

      if (existing) {
        existing.qty = Number(existing.qty || 0) + qty;
      } else {
        cart.push({
          id: id,
          title: item.title,
          price: Number(item.price || 0),
          img: item.img || "",
          qty: qty
        });
      }
    });

    writeJson(scopedKey("cart", currentUser), cart);
    window.cart = cart;
  }

  function downloadInvoice(order) {
    var lines = [];
    lines.push("FreshNut Invoice");
    lines.push("Order ID: " + (order.id || ""));
    lines.push("Date: " + formatDate(order.createdAt));
    lines.push("Customer: " + ((order.customer && order.customer.name) || ""));
    lines.push("Email: " + ((order.customer && order.customer.email) || ""));
    lines.push("Status: " + statusLabel(order.status));
    lines.push("");
    lines.push("Items:");
    (order.items || []).forEach(function (item, idx) {
      var qty = Number(item.qty || 1);
      var price = Number(item.price || 0);
      lines.push((idx + 1) + ". " + (item.title || "Item") + " x " + qty + " = " + formatMoney(qty * price));
    });
    lines.push("");
    lines.push("Subtotal: " + formatMoney(order.subtotal));
    lines.push("Discount: - " + formatMoney(order.discount || 0));
    lines.push("Shipping: " + formatMoney(order.shipping));
    lines.push("Total: " + formatMoney(order.total));

    var blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "invoice-" + String(order.id || "order") + ".txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function applyFilters() {
    var q = String(orderSearch.value || "").toLowerCase().trim();
    var status = String(orderStatusFilter.value || "").toLowerCase();

    var filtered = orders.filter(function (order) {
      var idHit = String(order.id || "").toLowerCase().includes(q);
      var itemHit = Array.isArray(order.items) && order.items.some(function (item) {
        return String(item.title || "").toLowerCase().includes(q);
      });
      var queryOk = !q || idHit || itemHit;
      var statusOk = !status || String(order.status || "").toLowerCase() === status;
      return queryOk && statusOk;
    });

    render(filtered);
  }

  function render(list) {
    ordersList.innerHTML = "";

    if (!list.length) {
      ordersList.innerHTML = '<div class="empty-box">No orders found.</div>';
      return;
    }

    list.forEach(function (order) {
      var card = document.createElement("article");
      card.className = "order-card";

      var itemsHtml = (order.items || []).map(function (item) {
        return [
          '<div class="order-item">',
          '<img src="' + (item.img || "https://via.placeholder.com/48") + '" alt="' + (item.title || "Product") + '">',
          '<div><strong>' + (item.title || "Item") + '</strong><p>Qty: ' + Number(item.qty || 1) + '</p></div>',
          '<b>' + formatMoney((Number(item.price || 0) * Number(item.qty || 1))) + '</b>',
          '</div>'
        ].join("");
      }).join("");

      card.innerHTML = [
        '<div class="order-top">',
        '<div><h3>Order ' + (order.id || "") + '</h3><p>' + formatDate(order.createdAt) + ' | Payment: ' + (order.paymentMethod || "N/A") + '</p></div>',
        '<div><span class="status ' + (order.status || "placed") + '">' + statusLabel(order.status) + '</span><p style="margin-top:6px;text-align:right">Total: <b>' + formatMoney(order.total) + '</b></p></div>',
        '</div>',
        '<div class="order-items">' + itemsHtml + '</div>',
        '<div class="order-actions-row">' +
          '<a class="order-detail-link" href="./order.html?id=' + encodeURIComponent(order.id || "") + '">View Details</a>' +
          '<button class="order-reorder-btn" type="button">Reorder</button>' +
          '<button class="order-buyagain-btn" type="button">Buy Again</button>' +
          '<button class="order-invoice-btn" type="button">Invoice</button>' +
        '</div>'
      ].join("");

      var reorderBtn = card.querySelector(".order-reorder-btn");
      reorderBtn && reorderBtn.addEventListener("click", function () {
        addItemsToCart(order.items || []);
        alert("Items added to cart. You can proceed to checkout.");
      });

      var invoiceBtn = card.querySelector(".order-invoice-btn");
      invoiceBtn && invoiceBtn.addEventListener("click", function () {
        downloadInvoice(order);
      });

      var buyAgainBtn = card.querySelector(".order-buyagain-btn");
      buyAgainBtn && buyAgainBtn.addEventListener("click", function () {
        addItemsToCart(order.items || []);
        window.location.href = "../checkout/checkout.html";
      });

      ordersList.appendChild(card);
    });
  }

  orderSearch.addEventListener("input", applyFilters);
  orderStatusFilter.addEventListener("change", applyFilters);

  applyFilters();
})();
