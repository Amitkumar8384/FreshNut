"use strict";

(function initOrderDetail() {
  var root = document.getElementById("orderPage");
  var params = new URLSearchParams(window.location.search);
  var orderId = params.get("id");

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

  function userStorageId(currentUser) {
    if (!currentUser || !currentUser.email) {
      return "guest";
    }
    return String(currentUser.email).trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
  }

  function scopedKey(baseKey, currentUser) {
    if (typeof window.scopedKey === "function") {
      return window.scopedKey(baseKey, currentUser);
    }
    return String(baseKey) + "::" + userStorageId(currentUser);
  }

  function formatMoney(v) {
    return "Rs " + Number(v || 0).toFixed(0);
  }

  function formatDate(ts) {
    if (!ts) {
      return "N/A";
    }
    var d = new Date(ts);
    return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function getTimeline(status) {
    var steps = ["placed", "processing", "shipped", "delivered"];
    var idx = steps.indexOf(status);
    if (idx < 0) {
      idx = 0;
    }
    return steps.map(function (step, i) {
      return '<div class="step ' + (i <= idx ? "active" : "") + '">' + step + "</div>";
    }).join("");
  }

  function statusLabel(value) {
    return String(value || "placed").replace(/_/g, " ");
  }

  function addItemsToCart(items) {
    var cart = readJson(scopedKey("cart", user), []);
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

    writeJson(scopedKey("cart", user), cart);
    window.cart = cart;
  }

  function downloadInvoice(currentOrder) {
    var lines = [];
    lines.push("FreshNut Invoice");
    lines.push("Order ID: " + (currentOrder.id || ""));
    lines.push("Date: " + formatDate(currentOrder.createdAt));
    lines.push("Customer: " + ((currentOrder.customer && currentOrder.customer.name) || ""));
    lines.push("Email: " + ((currentOrder.customer && currentOrder.customer.email) || ""));
    lines.push("Status: " + statusLabel(currentOrder.status));
    lines.push("");
    lines.push("Items:");
    (currentOrder.items || []).forEach(function (item, idx) {
      var qty = Number(item.qty || 1);
      var price = Number(item.price || 0);
      lines.push((idx + 1) + ". " + (item.title || "Item") + " x " + qty + " = " + formatMoney(qty * price));
    });
    lines.push("");
    lines.push("Subtotal: " + formatMoney(currentOrder.subtotal));
    lines.push("Discount: - " + formatMoney(currentOrder.discount || 0));
    lines.push("Shipping: " + formatMoney(currentOrder.shipping));
    lines.push("Total: " + formatMoney(currentOrder.total));

    var blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "invoice-" + String(currentOrder.id || "order") + ".txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  var user = readJson("currentUser", null);
  if (!user) {
    window.location.href = "../auth/login.html?next=" + encodeURIComponent("../orders/order.html?id=" + encodeURIComponent(orderId || ""));
    return;
  }

  var orders = readJson("orders", []);
  if (!Array.isArray(orders)) {
    orders = [];
  }

  var order = orders.find(function (o) {
    return String(o.id) === String(orderId) && o.customer && o.customer.email === user.email;
  });

  if (!order) {
    root.innerHTML = '<article class="order-card"><h1>Order not found</h1><p class="muted">No order matched this ID for your account.</p><a class="back-link" href="./orders.html">Back to Orders</a></article>';
    return;
  }

  function persistOrder(nextOrder) {
    var all = readJson("orders", []);
    if (!Array.isArray(all)) {
      all = [];
    }
    var idx = all.findIndex(function (x) { return String(x.id) === String(nextOrder.id); });
    if (idx >= 0) {
      all[idx] = nextOrder;
      writeJson("orders", all);
    }
  }

  function render() {
    var itemsHtml = (order.items || []).map(function (item) {
      return [
        '<div class="order-item">',
        '<img src="' + (item.img || "https://via.placeholder.com/56") + '" alt="' + (item.title || "Product") + '">',
        '<div><strong>' + (item.title || "Item") + '</strong><p class="muted">Qty: ' + Number(item.qty || 1) + '</p></div>',
        '<b>' + formatMoney((Number(item.price || 0) * Number(item.qty || 1))) + '</b>',
        '</div>'
      ].join("");
    }).join("");

    var paymentDetails = "";
    if (order.paymentDetails) {
      if (order.paymentDetails.upiId) {
        paymentDetails = "UPI ID: " + order.paymentDetails.upiId;
      } else if (order.paymentDetails.cardLast4) {
        paymentDetails = "Card: xxxx xxxx xxxx " + order.paymentDetails.cardLast4;
      } else if (order.paymentDetails.cod) {
        paymentDetails = "Pay on Delivery";
      }
    }

    var cancelAllowed = ["placed", "processing"].indexOf(order.status) >= 0;
    var returnAllowed = order.status === "delivered";

    var timelineBlock = "";
    if (order.status !== "cancelled" && order.status !== "return_requested") {
      timelineBlock = '<section class="box" style="margin-top:12px"><h4>Order Timeline</h4><div class="timeline">' + getTimeline(order.status || "placed") + "</div></section>";
    }

    var actionsHtml = '<div class="order-actions">';
    if (cancelAllowed) {
      actionsHtml += '<button type="button" id="cancelOrderBtn" class="cancel-btn">Cancel Order</button>';
    }
    if (returnAllowed) {
      actionsHtml += '<button type="button" id="returnOrderBtn" class="return-btn">Request Return</button>';
    }
    actionsHtml += '<button type="button" id="reorderBtn" class="reorder-btn">Reorder</button>';
    actionsHtml += '<button type="button" id="invoiceBtn" class="invoice-btn">Download Invoice</button>';
    actionsHtml += "</div>";

    root.innerHTML = [
      '<article class="order-card">',
      '<div class="order-head">',
      '<div><h1>Order ' + order.id + '</h1><p class="muted">Placed on ' + formatDate(order.createdAt) + '</p></div>',
      '<div><span class="status ' + (order.status || "placed") + '">' + statusLabel(order.status) + '</span><p class="muted" style="margin-top:6px">ETA: ' + (order.eta ? formatDate(order.eta) : "TBD") + '</p></div>',
      '</div>',
      '<div class="detail-grid">',
      '<section class="box"><h4>Delivery Address</h4><p>' + (order.customer.name || "") + '</p><p>' + (order.address.line || "") + '</p><p>' + (order.address.city || "") + ', ' + (order.address.state || "") + ' - ' + (order.address.pincode || "") + '</p><p>' + (order.customer.phone || "") + '</p></section>',
      '<section class="box"><h4>Payment</h4><p>Method: ' + (order.paymentMethod || "N/A") + '</p><p>' + paymentDetails + '</p><p>Coupon: ' + (order.couponCode || "None") + '</p></section>',
      '</div>',
      timelineBlock,
      '<section class="box" style="margin-top:12px"><h4>Items</h4><div class="order-items">' + itemsHtml + '</div></section>',
      '<section class="box amounts" style="margin-top:12px"><h4>Amount Summary</h4><div><span>Subtotal</span><b>' + formatMoney(order.subtotal) + '</b></div><div><span>Discount</span><b>- ' + formatMoney(order.discount || 0) + '</b></div><div><span>Shipping</span><b>' + formatMoney(order.shipping) + '</b></div><div class="grand"><span>Total</span><b>' + formatMoney(order.total) + '</b></div></section>',
      '<div style="margin-top:12px">' + actionsHtml + '</div>',
      '<div style="margin-top:12px"><a class="back-link" href="./orders.html">Back to Orders</a></div>',
      '</article>'
    ].join("");

    var cancelBtn = document.getElementById("cancelOrderBtn");
    cancelBtn && cancelBtn.addEventListener("click", function () {
      var ok = window.confirm("Cancel this order?");
      if (!ok) {
        return;
      }
      order.status = "cancelled";
      order.cancelledAt = new Date().toISOString();
      persistOrder(order);
      render();
    });

    var returnBtn = document.getElementById("returnOrderBtn");
    returnBtn && returnBtn.addEventListener("click", function () {
      var ok = window.confirm("Request return for this order?");
      if (!ok) {
        return;
      }
      order.status = "return_requested";
      order.returnRequestedAt = new Date().toISOString();
      persistOrder(order);
      render();
    });

    var reorderBtn = document.getElementById("reorderBtn");
    reorderBtn && reorderBtn.addEventListener("click", function () {
      addItemsToCart(order.items || []);
      alert("Items added to cart.");
    });

    var invoiceBtn = document.getElementById("invoiceBtn");
    invoiceBtn && invoiceBtn.addEventListener("click", function () {
      downloadInvoice(order);
    });
  }

  render();
})();
