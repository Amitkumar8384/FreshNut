"use strict";

var nameInp = document.getElementById("name");
var emailInp = document.getElementById("email");
var passInp = document.getElementById("password");
var btn = document.getElementById("submitBtn");
var toggle = document.getElementById("toggleMode");
var title = document.getElementById("title");

var isLogin = true;
var params = new URLSearchParams(window.location.search);
var nextRoute = params.get("next");
if (nextRoute) {
  try {
    nextRoute = decodeURIComponent(nextRoute);
  } catch (_err) {
    nextRoute = null;
  }
}

function getUsers() {
  try {
    var parsed = JSON.parse(localStorage.getItem("users") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function userStorageId(user) {
  var email = user && user.email ? user.email : "";
  return normalizeEmail(email).replace(/[^a-z0-9]/g, "_") || "guest";
}

function scopedKey(baseKey, user) {
  return String(baseKey) + "::" + userStorageId(user);
}

function readList(key) {
  try {
    var parsed = JSON.parse(localStorage.getItem(key) || "null");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

function mergeGuestCollections(user) {
  ["cart", "wishlist"].forEach(function (baseKey) {
    var guestKey = scopedKey(baseKey, null);
    var userKey = scopedKey(baseKey, user);
    var guestList = readList(guestKey);
    if (!guestList.length) {
      return;
    }

    var userList = readList(userKey);
    if (baseKey === "cart") {
      guestList.forEach(function (gItem) {
        var gid = Number(gItem && gItem.id);
        var found = userList.find(function (uItem) {
          return Number(uItem && uItem.id) === gid;
        });
        if (found) {
          var currentQty = Number(found.qty) || 1;
          var guestQty = Number(gItem && gItem.qty) || 1;
          found.qty = currentQty + guestQty;
        } else {
          userList.push(gItem);
        }
      });
    } else {
      guestList.forEach(function (gItem) {
        var gid = Number(gItem && gItem.id);
        var exists = userList.some(function (uItem) {
          return Number(uItem && uItem.id) === gid;
        });
        if (!exists) {
          userList.push(gItem);
        }
      });
    }

    localStorage.setItem(userKey, JSON.stringify(userList));
    localStorage.removeItem(guestKey);
  });
}

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function isStrongPassword(password) {
  return String(password || "").length >= 6;
}

function redirectAfterLogin(user) {
  if (nextRoute) {
    window.location.href = nextRoute;
    return;
  }
  if (!user) {
    return;
  }
  if (user.role === "admin") {
    window.location.href = "../admin/admin.html";
    return;
  }
  window.location.href = "../index.html";
}

function setMode(nextLoginMode) {
  isLogin = nextLoginMode;
  title.textContent = isLogin ? "Login" : "Create Account";
  btn.textContent = isLogin ? "Login" : "Sign Up";
  nameInp.classList.toggle("hide", isLogin);
  toggle.textContent = isLogin ? "Create account" : "Back to login";
}

toggle && toggle.addEventListener("click", function () {
  setMode(!isLogin);
});

btn && btn.addEventListener("click", function () {
  var users = getUsers();
  var email = normalizeEmail(emailInp.value);
  var pass = String(passInp.value || "").trim();
  var name = String(nameInp.value || "").trim();

  if (!email || !pass || (!isLogin && !name)) {
    alert("Please fill all required fields.");
    return;
  }

  if (!isValidEmail(email)) {
    alert("Please enter a valid email address.");
    return;
  }

  if (!isStrongPassword(pass)) {
    alert("Password must be at least 6 characters.");
    return;
  }

  if (isLogin) {
    var user = users.find(function (u) {
      return normalizeEmail(u.email) === email && u.pass === pass;
    });

    if (!user) {
      alert("Invalid credentials.");
      return;
    }

    mergeGuestCollections(user);
    localStorage.setItem("currentUser", JSON.stringify(user));
    redirectAfterLogin(user);
    return;
  }

  var exists = users.some(function (u) {
    return normalizeEmail(u.email) === email;
  });

  if (exists) {
    alert("User already exists with this email.");
    return;
  }

  var hasAdminAccount = users.some(function (u) { return u && u.role === "admin"; });
  var role = hasAdminAccount ? "user" : "admin";
  var newUser = {
    id: Date.now(),
    name: name,
    email: email,
    pass: pass,
    role: role,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  alert("Account created successfully. Please login.");
  setMode(true);
  nameInp.value = "";
  passInp.value = "";
});

setMode(true);
