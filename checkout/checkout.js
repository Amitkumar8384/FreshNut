"use strict";

document.addEventListener("DOMContentLoaded", function () {
  var ckItems = document.getElementById("ckItems");
  var ckSub = document.getElementById("ckSub");
  var ckDiscount = document.getElementById("ckDiscount");
  var ckShip = document.getElementById("ckShip");
  var ckTotal = document.getElementById("ckTotal");
  var form = document.getElementById("checkoutForm");
  var savedAddressSelect = document.getElementById("savedAddressSelect");
  var saveCurrentAddressBtn = document.getElementById("saveCurrentAddress");
  var deleteSavedAddressBtn = document.getElementById("deleteSavedAddress");

  var couponCode = document.getElementById("couponCode");
  var applyCouponBtn = document.getElementById("applyCoupon");
  var couponHints = document.getElementById("couponHints");
  var couponMsg = document.getElementById("couponMsg");

  var upiFields = document.getElementById("upiFields");
  var cardFields = document.getElementById("cardFields");
  var upiId = document.getElementById("upiId");
  var cardNumber = document.getElementById("cardNumber");
  var cardName = document.getElementById("cardName");
  var cardExpiry = document.getElementById("cardExpiry");
  var cardCvv = document.getElementById("cardCvv");

  var fields = {
    fullName: document.getElementById("fullName"),
    phone: document.getElementById("phone"),
    email: document.getElementById("email"),
    address: document.getElementById("address"),
    city: document.getElementById("city"),
    state: document.getElementById("state"),
    pincode: document.getElementById("pincode"),
    landmark: document.getElementById("landmark")
  };

  var fallbackCoupons = [
    { code: "WELCOME10", type: "percent", value: 10, min: 499, maxDiscount: null, active: true },
    { code: "FLAT100", type: "flat", value: 100, min: 899, maxDiscount: null, active: true },
    { code: "FESTIVE20", type: "percent", value: 20, min: 1499, maxDiscount: 350, active: true }
  ];

  var appliedCoupon = null;

  function readJson(key, fallback) {
    try {
      var parsed = JSON.parse(localStorage.getItem(key) || "null");
      return parsed === null ? fallback : parsed;
    } catch (_err) {
      return fallback;
    }
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

  var currentUser = readJson("currentUser", null);
  if (!currentUser) {
    window.location.href = "../auth/login.html?next=" + encodeURIComponent("../checkout/checkout.html");
    return;
  }

  var cart = readJson(scopedKey("cart", currentUser), []);
  if (!Array.isArray(cart)) {
    cart = [];
  }

  var profiles = readJson("profiles", {});
  var profile = profiles[currentUser.email] || {};
  var savedAddressBook = readJson("savedAddresses", {});
  var savedAddresses = Array.isArray(savedAddressBook[currentUser.email]) ? savedAddressBook[currentUser.email] : [];
  var couponRows = readJson("coupons", fallbackCoupons);
  if (!Array.isArray(couponRows) || !couponRows.length) {
    couponRows = fallbackCoupons;
  }

  var COUPONS = {};
  couponRows.forEach(function (row) {
    if (!row || !row.code || row.active === false) {
      return;
    }
    COUPONS[String(row.code).toUpperCase()] = {
      type: row.type === "flat" ? "flat" : "percent",
      value: Number(row.value || 0),
      min: Number(row.min || 0),
      maxDiscount: row.maxDiscount ? Number(row.maxDiscount) : null
    };
  });

  fields.fullName.value = currentUser.name || "";
  fields.email.value = currentUser.email || "";
  fields.email.readOnly = true;
  fields.phone.value = profile.phone || "";
  fields.city.value = profile.city || "";
  fields.address.value = profile.address || "";

  fields.email.addEventListener("input", function () {
    fields.email.value = currentUser.email || "";
  });

  function persistSavedAddresses() {
    savedAddressBook[currentUser.email] = savedAddresses;
    localStorage.setItem("savedAddresses", JSON.stringify(savedAddressBook));
  }

  function fillAddressForm(addr) {
    if (!addr) {
      return;
    }
    fields.fullName.value = addr.fullName || fields.fullName.value;
    fields.phone.value = addr.phone || "";
    fields.address.value = addr.line || "";
    fields.city.value = addr.city || "";
    fields.state.value = addr.state || "";
    fields.pincode.value = addr.pincode || "";
    fields.landmark.value = addr.landmark || "";
  }

  function currentAddressPayload() {
    return {
      id: Date.now(),
      label: "Address " + (savedAddresses.length + 1),
      fullName: String(fields.fullName.value || "").trim(),
      phone: String(fields.phone.value || "").trim(),
      line: String(fields.address.value || "").trim(),
      city: String(fields.city.value || "").trim(),
      state: String(fields.state.value || "").trim(),
      pincode: String(fields.pincode.value || "").trim(),
      landmark: String(fields.landmark.value || "").trim()
    };
  }

  function renderSavedAddressOptions() {
    if (!savedAddressSelect) {
      return;
    }
    savedAddressSelect.innerHTML = '<option value="">Use Saved Address</option>';
    savedAddresses.forEach(function (addr, idx) {
      var opt = document.createElement("option");
      opt.value = String(addr.id || idx);
      opt.textContent = (addr.label || ("Address " + (idx + 1))) + " | " + (addr.city || "");
      savedAddressSelect.appendChild(opt);
    });
  }

  function formatInr(value) {
    return "Rs " + Number(value || 0).toFixed(0);
  }

  function computeSubtotal() {
    return cart.reduce(function (sum, item) {
      return sum + (Number(item.price) || 0) * (Number(item.qty) || 1);
    }, 0);
  }

  function shippingCharge(subtotalAfterDiscount) {
    return subtotalAfterDiscount >= 999 ? 0 : 79;
  }

  function getDiscount(subtotal) {
    if (!appliedCoupon) {
      return 0;
    }
    var rule = COUPONS[appliedCoupon];
    if (!rule || subtotal < rule.min) {
      return 0;
    }

    var discount = 0;
    if (rule.type === "flat") {
      discount = rule.value;
    } else {
      discount = Math.round((subtotal * rule.value) / 100);
      if (rule.maxDiscount) {
        discount = Math.min(discount, rule.maxDiscount);
      }
    }
    return Math.min(discount, subtotal);
  }

  function couponLabel(code, rule, subtotal) {
    var detail = rule.type === "flat" ? ("Flat Rs " + rule.value) : (rule.value + "% OFF");
    var minPart = "Min " + formatInr(rule.min);
    var eligible = subtotal >= rule.min;
    return (eligible ? "[Eligible] " : "[Locked] ") + code + " - " + detail + " | " + minPart;
  }

  function renderCouponHints(subtotal) {
    if (!couponHints) {
      return;
    }
    var entries = Object.keys(COUPONS).map(function (code) {
      return { code: code, rule: COUPONS[code] };
    });

    if (!entries.length) {
      couponHints.innerHTML = "";
      return;
    }

    entries.sort(function (a, b) {
      var aEligible = subtotal >= a.rule.min ? 1 : 0;
      var bEligible = subtotal >= b.rule.min ? 1 : 0;
      if (aEligible !== bEligible) {
        return bEligible - aEligible;
      }
      return a.rule.min - b.rule.min;
    });

    couponHints.innerHTML = entries.map(function (entry) {
      return '<button type="button" class="coupon-chip" data-code="' + entry.code + '">' +
        couponLabel(entry.code, entry.rule, subtotal) + "</button>";
    }).join("");
  }

  function paymentMethod() {
    return (form.querySelector('input[name="pay"]:checked') || {}).value || "UPI";
  }

  function togglePaymentFields() {
    var method = paymentMethod();
    if (method === "UPI") {
      upiFields.style.display = "block";
      cardFields.style.display = "none";
    } else if (method === "Card") {
      upiFields.style.display = "none";
      cardFields.style.display = "block";
    } else {
      upiFields.style.display = "none";
      cardFields.style.display = "none";
    }
  }

  function renderCheckout() {
    if (!ckItems || !ckSub || !ckTotal) {
      return;
    }

    ckItems.innerHTML = "";

    if (!cart.length) {
      ckItems.innerHTML = '<li class="empty">Your cart is empty</li>';
      ckSub.textContent = formatInr(0);
      ckDiscount.textContent = formatInr(0);
      ckShip.textContent = formatInr(0);
      ckTotal.textContent = formatInr(0);
      return;
    }

    cart.forEach(function (item) {
      var price = Number(item.price) || 0;
      var qty = Number(item.qty) || 1;
      var lineTotal = price * qty;

      var li = document.createElement("li");
      li.className = "ck-item";
      li.innerHTML = [
        '<img src="' + (item.img || "https://via.placeholder.com/80") + '" alt="' + (item.title || "Item") + '">',
        '<div class="ck-info"><h5>' + (item.title || "Untitled") + '</h5><small>Qty: ' + qty + '</small></div>',
        '<div class="price">' + formatInr(lineTotal) + '</div>'
      ].join("");

      ckItems.appendChild(li);
    });

    var subtotal = computeSubtotal();
    var discount = getDiscount(subtotal);
    var discountedSubtotal = subtotal - discount;
    var ship = shippingCharge(discountedSubtotal);
    var total = discountedSubtotal + ship;

    ckSub.textContent = formatInr(subtotal);
    ckDiscount.textContent = "- " + formatInr(discount);
    ckShip.textContent = formatInr(ship);
    ckTotal.textContent = formatInr(total);
    renderCouponHints(subtotal);
  }

  function validateAddress() {
    var phoneOk = /^\d{10}$/.test(String(fields.phone.value || "").trim());
    var pinOk = /^\d{6}$/.test(String(fields.pincode.value || "").trim());

    if (!phoneOk) {
      alert("Enter valid 10-digit phone number.");
      return false;
    }
    if (!pinOk) {
      alert("Enter valid 6-digit pincode.");
      return false;
    }
    return true;
  }

  function validatePayment() {
    var method = paymentMethod();

    if (method === "UPI") {
      var upiOk = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(String(upiId.value || "").trim());
      if (!upiOk) {
        alert("Enter valid UPI ID (example@upi)");
        return false;
      }
    }

    if (method === "Card") {
      var cardNum = String(cardNumber.value || "").replace(/\s+/g, "");
      var cardNumOk = /^\d{16}$/.test(cardNum);
      var nameOk = String(cardName.value || "").trim().length >= 3;
      var expOk = /^(0[1-9]|1[0-2])\/(\d{2})$/.test(String(cardExpiry.value || "").trim());
      var cvvOk = /^\d{3}$/.test(String(cardCvv.value || "").trim());

      if (!cardNumOk) {
        alert("Enter valid 16-digit card number.");
        return false;
      }
      if (!nameOk) {
        alert("Enter valid card holder name.");
        return false;
      }
      if (!expOk) {
        alert("Enter valid expiry in MM/YY format.");
        return false;
      }
      if (!cvvOk) {
        alert("Enter valid 3-digit CVV.");
        return false;
      }
    }

    return true;
  }

  function applyCoupon() {
    var code = String(couponCode.value || "").trim().toUpperCase();
    if (!code) {
      couponMsg.textContent = "Enter a coupon code.";
      appliedCoupon = null;
      renderCheckout();
      return;
    }

    var rule = COUPONS[code];
    if (!rule) {
      couponMsg.textContent = "Invalid coupon code.";
      appliedCoupon = null;
      renderCheckout();
      return;
    }

    var subtotal = computeSubtotal();
    if (subtotal < rule.min) {
      couponMsg.textContent = "Minimum order for " + code + " is " + formatInr(rule.min) + ".";
      appliedCoupon = null;
      renderCheckout();
      return;
    }

    appliedCoupon = code;
    couponMsg.textContent = "Coupon applied: " + code;
    renderCheckout();
  }

  function maskedPaymentDetails() {
    var method = paymentMethod();
    if (method === "UPI") {
      return { upiId: String(upiId.value || "").trim() };
    }
    if (method === "Card") {
      var digits = String(cardNumber.value || "").replace(/\D+/g, "");
      return {
        cardLast4: digits.slice(-4),
        cardName: String(cardName.value || "").trim(),
        cardExpiry: String(cardExpiry.value || "").trim()
      };
    }
    return { cod: true };
  }

  function nextStatus() {
    return "placed";
  }

  function saveOrder() {
    var subtotal = computeSubtotal();
    var discount = getDiscount(subtotal);
    var discountedSubtotal = subtotal - discount;
    var ship = shippingCharge(discountedSubtotal);
    var total = discountedSubtotal + ship;
    var selectedPaymentMethod = paymentMethod();

    var order = {
      id: "ORD-" + Date.now(),
      items: cart,
      subtotal: subtotal,
      discount: discount,
      couponCode: appliedCoupon,
      shipping: ship,
      total: total,
      status: nextStatus(),
      paymentMethod: selectedPaymentMethod,
      paymentDetails: maskedPaymentDetails(),
      customer: {
        name: fields.fullName.value.trim(),
        email: currentUser.email,
        phone: fields.phone.value.trim()
      },
      address: {
        line: fields.address.value.trim(),
        city: fields.city.value.trim(),
        state: fields.state.value.trim(),
        pincode: fields.pincode.value.trim(),
        landmark: fields.landmark.value.trim()
      },
      createdAt: new Date().toISOString(),
      eta: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    };

    var orders = readJson("orders", []);
    orders = Array.isArray(orders) ? orders : [];
    orders.unshift(order);
    localStorage.setItem("orders", JSON.stringify(orders));

    var allProfiles = readJson("profiles", {});
    allProfiles[currentUser.email] = {
      phone: fields.phone.value.trim(),
      city: fields.city.value.trim(),
      address: fields.address.value.trim()
    };
    localStorage.setItem("profiles", JSON.stringify(allProfiles));

    return order.id;
  }

  document.querySelectorAll('input[name="pay"]').forEach(function (radio) {
    radio.addEventListener("change", togglePaymentFields);
  });

  cardNumber && cardNumber.addEventListener("input", function () {
    var digits = String(cardNumber.value || "").replace(/\D+/g, "").slice(0, 16);
    cardNumber.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  });

  cardExpiry && cardExpiry.addEventListener("input", function () {
    var digits = String(cardExpiry.value || "").replace(/\D+/g, "").slice(0, 4);
    if (digits.length >= 3) {
      cardExpiry.value = digits.slice(0, 2) + "/" + digits.slice(2);
    } else {
      cardExpiry.value = digits;
    }
  });

  applyCouponBtn && applyCouponBtn.addEventListener("click", applyCoupon);
  couponHints && couponHints.addEventListener("click", function (event) {
    var chip = event.target.closest(".coupon-chip");
    if (!chip) {
      return;
    }
    couponCode.value = chip.getAttribute("data-code") || "";
    applyCoupon();
  });

  savedAddressSelect && savedAddressSelect.addEventListener("change", function () {
    var selectedId = String(savedAddressSelect.value || "");
    if (!selectedId) {
      return;
    }
    var addr = savedAddresses.find(function (a, idx) {
      return String(a.id || idx) === selectedId;
    });
    fillAddressForm(addr);
  });

  saveCurrentAddressBtn && saveCurrentAddressBtn.addEventListener("click", function () {
    var next = currentAddressPayload();
    var selectedSavedId = String(next.id);
    if (!next.fullName || !next.phone || !next.line || !next.city || !next.state || !next.pincode) {
      alert("Fill complete delivery address before saving.");
      return;
    }
    if (!/^\d{10}$/.test(next.phone) || !/^\d{6}$/.test(next.pincode)) {
      alert("Enter valid phone and pincode before saving address.");
      return;
    }

    var existingIdx = savedAddresses.findIndex(function (a) {
      return a.line === next.line && a.city === next.city && a.pincode === next.pincode;
    });
    if (existingIdx >= 0) {
      savedAddresses[existingIdx] = Object.assign({}, savedAddresses[existingIdx], next, { id: savedAddresses[existingIdx].id });
      selectedSavedId = String(savedAddresses[existingIdx].id);
    } else {
      savedAddresses.unshift(next);
    }
    savedAddresses = savedAddresses.slice(0, 10);
    persistSavedAddresses();
    renderSavedAddressOptions();
    savedAddressSelect.value = selectedSavedId;
    alert("Address saved.");
  });

  deleteSavedAddressBtn && deleteSavedAddressBtn.addEventListener("click", function () {
    if (!savedAddressSelect || !savedAddressSelect.value) {
      alert("Select a saved address to delete.");
      return;
    }
    var selectedId = String(savedAddressSelect.value);
    savedAddresses = savedAddresses.filter(function (a, idx) {
      return String(a.id || idx) !== selectedId;
    });
    persistSavedAddresses();
    renderSavedAddressOptions();
    alert("Address deleted.");
  });

  renderCheckout();
  renderSavedAddressOptions();
  togglePaymentFields();

  form && form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!cart.length) {
      alert("Your cart is empty.");
      return;
    }
    if (String(fields.email.value || "").trim().toLowerCase() !== String(currentUser.email || "").trim().toLowerCase()) {
      fields.email.value = currentUser.email || "";
      alert("Checkout email must match your logged-in account.");
      return;
    }
    if (!validateAddress() || !validatePayment()) {
      return;
    }

    var orderId = saveOrder();
    localStorage.removeItem(scopedKey("cart", currentUser));
    alert("Order placed successfully: " + orderId);
    window.location.href = "../orders/orders.html";
  });
});
