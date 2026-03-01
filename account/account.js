"use strict";

function readJson(key, fallback) {
  try {
    var parsed = JSON.parse(localStorage.getItem(key) || "null");
    return parsed === null ? fallback : parsed;
  } catch (_err) {
    return fallback;
  }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function userStorageId(currentUser) {
  if (!currentUser || !currentUser.email) {
    return "guest";
  }
  return normalizeEmail(currentUser.email).replace(/[^a-z0-9]/g, "_");
}

function scopedKey(baseKey, currentUser) {
  if (typeof window.scopedKey === "function" && window.scopedKey !== scopedKey) {
    return window.scopedKey(baseKey, currentUser);
  }
  return String(baseKey) + "::" + userStorageId(currentUser);
}

function normalizeListValue(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === "object" && Array.isArray(value.items)) {
    return value.items;
  }
  return [];
}

function readScopedList(baseKey, currentUser) {
  var seen = {};
  var keysToTry = [];
  var email = normalizeEmail(currentUser && currentUser.email);
  var userId = userStorageId(currentUser);

  function addKey(key) {
    if (!key || seen[key]) {
      return;
    }
    seen[key] = true;
    keysToTry.push(key);
  }

  addKey(scopedKey(baseKey, currentUser));
  addKey(String(baseKey) + "::" + userId);
  if (email) {
    addKey(String(baseKey) + "::" + email);
  }
  addKey(baseKey);
  addKey(String(baseKey) + "::guest");

  // Also inspect all scoped keys for backward-compatibility variants.
  for (var i = 0; i < localStorage.length; i += 1) {
    var key = localStorage.key(i);
    if (!key || key.indexOf(String(baseKey) + "::") !== 0) {
      continue;
    }
    if (!email) {
      addKey(key);
      continue;
    }

    var lowerKey = key.toLowerCase();
    var localPart = email.split("@")[0];
    if (
      lowerKey.indexOf(email) >= 0 ||
      lowerKey.indexOf(userId) >= 0 ||
      (localPart && lowerKey.indexOf(localPart) >= 0)
    ) {
      addKey(key);
    }
  }

  for (var j = 0; j < keysToTry.length; j += 1) {
    var list = normalizeListValue(readJson(keysToTry[j], null));
    if (list.length) {
      localStorage.setItem(scopedKey(baseKey, currentUser), JSON.stringify(list));
      return list;
    }
  }

  // If list exists but empty, return empty instead of fallback noise.
  var firstExisting = normalizeListValue(readJson(scopedKey(baseKey, currentUser), null));
  if (firstExisting.length === 0) {
    return firstExisting;
  }

  // Last fallback: use the largest list from any scoped key so existing data is visible.
  var largest = [];
  for (var k = 0; k < localStorage.length; k += 1) {
    var anyKey = localStorage.key(k);
    if (!anyKey || anyKey.indexOf(String(baseKey) + "::") !== 0) {
      continue;
    }
    var candidate = normalizeListValue(readJson(anyKey, null));
    if (candidate.length > largest.length) {
      largest = candidate;
    }
  }
  if (largest.length) {
    localStorage.setItem(scopedKey(baseKey, currentUser), JSON.stringify(largest));
    return largest;
  }

  if (Array.isArray(firstExisting)) {
    return firstExisting;
  }
  return [];
}

(function initAccountPage() {
  var profileForm = document.getElementById("profileForm");
  var accName = document.getElementById("accName");
  var accEmail = document.getElementById("accEmail");
  var accPhone = document.getElementById("accPhone");
  var accCity = document.getElementById("accCity");
  var accAddress = document.getElementById("accAddress");

  var sumOrders = document.getElementById("sumOrders");
  var sumSpent = document.getElementById("sumSpent");
  var sumWishlist = document.getElementById("sumWishlist");
  var sumCartQty = document.getElementById("sumCartQty");
  var addrLabel = document.getElementById("addrLabel");
  var saveAddressBtn = document.getElementById("saveAddressBtn");
  var savedAddressList = document.getElementById("savedAddressList");

  var currentUser = readJson("currentUser", null);
  if (!currentUser) {
    window.location.href = "../auth/login.html?next=" + encodeURIComponent("../account/account.html");
    return;
  }

  var profiles = readJson("profiles", {});
  var profile = profiles[currentUser.email] || {};
  var addressBook = readJson("savedAddresses", {});
  var myAddresses = Array.isArray(addressBook[currentUser.email]) ? addressBook[currentUser.email] : [];

  accName.value = currentUser.name || "";
  accEmail.value = currentUser.email || "";
  accPhone.value = profile.phone || "";
  accCity.value = profile.city || "";
  accAddress.value = profile.address || "";

  function renderSummary() {
    var currentEmail = normalizeEmail(currentUser.email);
    var allOrders = normalizeListValue(readJson("orders", []));
    var orders = allOrders.filter(function (o) {
      var orderEmail = o && o.customer ? normalizeEmail(o.customer.email) : "";
      return orderEmail && orderEmail === currentEmail;
    });
    var spent = orders.reduce(function (sum, order) {
      return sum + Number(order.total || 0);
    }, 0);
    var wishlist = readScopedList("wishlist", currentUser);
    var cart = readScopedList("cart", currentUser);
    var cartQty = cart.reduce(function (sum, item) {
      var qty = Number(item && item.qty);
      return sum + (qty > 0 ? qty : 1);
    }, 0);

    sumOrders.textContent = String(orders.length);
    sumSpent.textContent = "Rs " + spent.toFixed(0);
    sumWishlist.textContent = String(wishlist.length);
    if (sumCartQty) {
      sumCartQty.textContent = String(cartQty);
    }
  }

  function persistAddresses() {
    addressBook[currentUser.email] = myAddresses;
    localStorage.setItem("savedAddresses", JSON.stringify(addressBook));
  }

  function renderSavedAddresses() {
    if (!savedAddressList) {
      return;
    }
    savedAddressList.innerHTML = "";
    if (!myAddresses.length) {
      savedAddressList.innerHTML = '<p class="muted">No saved addresses yet.</p>';
      return;
    }

    myAddresses.forEach(function (addr, idx) {
      var row = document.createElement("div");
      row.className = "saved-address-item";
      row.innerHTML = [
        "<h4>" + (addr.label || ("Address " + (idx + 1))) + "</h4>",
        "<p>" + (addr.fullName || "") + " | " + (addr.phone || "") + "</p>",
        "<p>" + (addr.line || "") + ", " + (addr.city || "") + ", " + (addr.state || "") + " - " + (addr.pincode || "") + "</p>",
        '<div class="saved-address-actions"><button type="button" class="use">Use in Profile</button><button type="button" class="delete">Delete</button></div>'
      ].join("");

      row.querySelector(".use").addEventListener("click", function () {
        accName.value = addr.fullName || accName.value;
        accPhone.value = addr.phone || "";
        accCity.value = addr.city || "";
        accAddress.value = addr.line || "";
      });

      row.querySelector(".delete").addEventListener("click", function () {
        myAddresses.splice(idx, 1);
        persistAddresses();
        renderSavedAddresses();
      });

      savedAddressList.appendChild(row);
    });
  }

  profileForm.addEventListener("submit", function (event) {
    event.preventDefault();

    currentUser.name = accName.value.trim();
    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    var users = readJson("users", []);
    users = Array.isArray(users) ? users : [];
    var idx = users.findIndex(function (u) { return u.email === currentUser.email; });
    if (idx >= 0) {
      users[idx].name = currentUser.name;
      localStorage.setItem("users", JSON.stringify(users));
    }

    profiles[currentUser.email] = {
      phone: accPhone.value.trim(),
      city: accCity.value.trim(),
      address: accAddress.value.trim()
    };

    localStorage.setItem("profiles", JSON.stringify(profiles));
    alert("Profile updated successfully.");
  });

  saveAddressBtn && saveAddressBtn.addEventListener("click", function () {
    var fullName = String(accName.value || "").trim();
    var phone = String(accPhone.value || "").trim();
    var city = String(accCity.value || "").trim();
    var line = String(accAddress.value || "").trim();
    var label = String((addrLabel && addrLabel.value) || "").trim() || "Address " + (myAddresses.length + 1);

    if (!fullName || !phone || !city || !line) {
      alert("Fill profile name, phone, city and address first.");
      return;
    }

    myAddresses.unshift({
      id: Date.now(),
      label: label,
      fullName: fullName,
      phone: phone,
      line: line,
      city: city,
      state: "",
      pincode: "",
      landmark: ""
    });
    myAddresses = myAddresses.slice(0, 10);
    persistAddresses();
    renderSavedAddresses();
    if (addrLabel) {
      addrLabel.value = "";
    }
    alert("Address saved.");
  });

  renderSummary();
  renderSavedAddresses();

  window.addEventListener("storage", function () {
    renderSummary();
  });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      renderSummary();
    }
  });
})();

