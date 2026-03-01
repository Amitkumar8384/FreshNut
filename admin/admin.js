"use strict";

(function adminGuard() {
  var user = null;
  try {
    user = JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch (_err) {
    user = null;
  }

  if (!user) {
    alert("Please login to access Admin.");
    window.location.href = "../auth/login.html";
    return;
  }

  if (user.role !== "admin") {
    alert("Access denied: admin only.");
    window.location.href = "../index.html";
    return;
  }
})();

var products = [];
try {
  var parsedProducts = JSON.parse(localStorage.getItem("products") || "[]");
  products = Array.isArray(parsedProducts) ? parsedProducts : [];
} catch (_err) {
  products = [];
}

var state = {
  query: "",
  category: "",
  status: "",
  sort: "new"
};

var adminMetaFilters = {
  userQuery: "",
  userRole: "",
  userSort: "newest",
  userPage: 1,
  userPageSize: 8,
  orderQuery: "",
  orderStatus: "",
  orderSort: "newest",
  orderPage: 1,
  orderPageSize: 10,
  commentQuery: "",
  commentRating: "",
  commentSort: "newest",
  commentPage: 1,
  commentPageSize: 12,
  contactQuery: "",
  contactSubject: "",
  contactStatus: "",
  contactSort: "newest",
  contactPage: 1,
  contactPageSize: 10
};

var defaultCoupons = [
  { id: 1, code: "WELCOME10", type: "percent", value: 10, min: 499, maxDiscount: null, active: true },
  { id: 2, code: "FLAT100", type: "flat", value: 100, min: 899, maxDiscount: null, active: true },
  { id: 3, code: "FESTIVE20", type: "percent", value: 20, min: 1499, maxDiscount: 350, active: true }
];

var coupons = [];
try {
  var parsedCoupons = JSON.parse(localStorage.getItem("coupons") || "[]");
  coupons = Array.isArray(parsedCoupons) ? parsedCoupons : [];
} catch (_err) {
  coupons = [];
}
if (!coupons.length) {
  coupons = defaultCoupons.slice();
  localStorage.setItem("coupons", JSON.stringify(coupons));
}

var users = [];
try {
  var parsedUsers = JSON.parse(localStorage.getItem("users") || "[]");
  users = Array.isArray(parsedUsers) ? parsedUsers : [];
} catch (_err) {
  users = [];
}

var orders = [];
try {
  var parsedOrders = JSON.parse(localStorage.getItem("orders") || "[]");
  orders = Array.isArray(parsedOrders) ? parsedOrders : [];
} catch (_err) {
  orders = [];
}

var reviews = {};
try {
  var parsedReviews = JSON.parse(localStorage.getItem("reviews") || "{}");
  reviews = parsedReviews && typeof parsedReviews === "object" ? parsedReviews : {};
} catch (_err) {
  reviews = {};
}

var contactMessages = [];
try {
  var parsedContactMessages = JSON.parse(localStorage.getItem("contactMessages") || "[]");
  contactMessages = Array.isArray(parsedContactMessages) ? parsedContactMessages : [];
} catch (_err) {
  contactMessages = [];
}

var $ = function (id) { return document.getElementById(id); };

var els = {
  productForm: $("productForm"),
  pId: $("pId"),
  pTitle: $("pTitle"),
  pPrice: $("pPrice"),
  pOld: $("pOld"),
  pDiscount: $("pDiscount"),
  pStock: $("pStock"),
  pStatus: $("pStatus"),
  pCat: $("pCat"),
  pDesc: $("pDesc"),
  pLongDesc: $("pLongDesc"),
  pGallery: $("pGallery"),
  pHighlights: $("pHighlights"),
  pIngredients: $("pIngredients"),
  pWeight: $("pWeight"),
  pOrigin: $("pOrigin"),
  pShelfLife: $("pShelfLife"),
  pPackType: $("pPackType"),
  pImgFile: $("pImgFile"),
  imgPreview: $("imgPreview"),
  formTitle: $("formTitle"),
  cancelEdit: $("cancelEdit"),
  adminList: $("adminList"),
  search: $("search"),
  filterCat: $("filterCat"),
  filterStatus: $("filterStatus"),
  sortBy: $("sortBy"),
  bulkDelete: $("bulkDelete"),
  exportBtn: $("exportBtn"),
  importInput: $("importInput"),
  statsProducts: $("statsProducts"),
  statsValue: $("statsValue"),
  statsLowStock: $("statsLowStock"),
  statsDrafts: $("statsDrafts"),
  couponForm: $("couponForm"),
  cId: $("cId"),
  cCode: $("cCode"),
  cType: $("cType"),
  cValue: $("cValue"),
  cMin: $("cMin"),
  cMax: $("cMax"),
  cActive: $("cActive"),
  couponCancel: $("couponCancel"),
  couponList: $("couponList"),
  userList: $("userList"),
  orderList: $("orderList"),
  commentList: $("commentList"),
  contactList: $("contactList"),
  userPagination: $("userPagination"),
  orderPagination: $("orderPagination"),
  commentPagination: $("commentPagination"),
  contactPagination: $("contactPagination"),
  exportUsersCsv: $("exportUsersCsv"),
  exportOrdersCsv: $("exportOrdersCsv"),
  exportCommentsCsv: $("exportCommentsCsv"),
  exportContactsCsv: $("exportContactsCsv"),
  userSearch: $("userSearch"),
  userSort: $("userSort"),
  userRoleFilter: $("userRoleFilter"),
  orderSearchAdmin: $("orderSearchAdmin"),
  orderSort: $("orderSort"),
  orderStatusAdminFilter: $("orderStatusAdminFilter"),
  commentSearch: $("commentSearch"),
  commentSort: $("commentSort"),
  commentRatingFilter: $("commentRatingFilter"),
  contactSearch: $("contactSearch"),
  contactSubjectFilter: $("contactSubjectFilter"),
  contactStatusFilter: $("contactStatusFilter"),
  contactSort: $("contactSort")
};

function initAdminTabs() {
  var tabs = Array.from(document.querySelectorAll("[data-admin-tab]"));
  var panels = Array.from(document.querySelectorAll("[data-admin-panel]"));
  if (!tabs.length || !panels.length) {
    return;
  }

  function setActive(section) {
    tabs.forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-admin-tab") === section);
    });

    panels.forEach(function (panel) {
      panel.hidden = panel.getAttribute("data-admin-panel") !== section;
    });

    localStorage.setItem("adminActiveSection", section);
  }

  tabs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setActive(btn.getAttribute("data-admin-tab"));
    });
  });

  var saved = String(localStorage.getItem("adminActiveSection") || "overview");
  var valid = tabs.some(function (btn) { return btn.getAttribute("data-admin-tab") === saved; });
  setActive(valid ? saved : "overview");
}

function save() {
  localStorage.setItem("products", JSON.stringify(products));
  window.products = products;
}

function saveCoupons() {
  localStorage.setItem("coupons", JSON.stringify(coupons));
}

function saveUsers() {
  localStorage.setItem("users", JSON.stringify(users));
}

function saveOrders() {
  localStorage.setItem("orders", JSON.stringify(orders));
}

function saveReviews() {
  localStorage.setItem("reviews", JSON.stringify(reviews));
}

function saveContactMessages() {
  localStorage.setItem("contactMessages", JSON.stringify(contactMessages));
}

function uid() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function toNum(value, fallback) {
  var n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeText(value) {
  return String(value || "").replace(/[<>&"]/g, function (ch) {
    if (ch === "<") { return "&lt;"; }
    if (ch === ">") { return "&gt;"; }
    if (ch === "&") { return "&amp;"; }
    return "&quot;";
  });
}

function updateStats() {
  var activeProducts = products.filter(function (p) { return p.status !== "draft"; });
  var inventoryValue = products.reduce(function (sum, p) {
    return sum + toNum(p.price, 0) * toNum(p.stock, 0);
  }, 0);
  var lowStock = products.filter(function (p) { return toNum(p.stock, 0) <= 5; });
  var drafts = products.filter(function (p) { return p.status === "draft"; });

  if (els.statsProducts) { els.statsProducts.textContent = String(activeProducts.length); }
  if (els.statsValue) { els.statsValue.textContent = "Rs " + inventoryValue.toFixed(0); }
  if (els.statsLowStock) { els.statsLowStock.textContent = String(lowStock.length); }
  if (els.statsDrafts) { els.statsDrafts.textContent = String(drafts.length); }
}

function applyFilters() {
  var list = products.slice();

  if (state.query) {
    list = list.filter(function (p) {
      return String(p.title || "").toLowerCase().includes(state.query);
    });
  }

  if (state.category) {
    list = list.filter(function (p) {
      return p.category === state.category;
    });
  }

  if (state.status) {
    list = list.filter(function (p) {
      return p.status === state.status;
    });
  }

  if (state.sort === "price") {
    list.sort(function (a, b) { return toNum(a.price, 0) - toNum(b.price, 0); });
  } else if (state.sort === "discount") {
    list.sort(function (a, b) { return toNum(b.discount, 0) - toNum(a.discount, 0); });
  } else {
    list.sort(function (a, b) { return toNum(b.id, 0) - toNum(a.id, 0); });
  }

  return list;
}

function render() {
  if (!els.adminList) {
    return;
  }

  var list = applyFilters();
  els.adminList.innerHTML = "";

  if (!list.length) {
    els.adminList.innerHTML = '<div class="admin-item"><div></div><div></div><div><b>No products found.</b></div><div></div></div>';
    updateStats();
    return;
  }

  list.forEach(function (p) {
    var row = document.createElement("div");
    row.className = "admin-item";
    row.innerHTML = [
      '<input type="checkbox" data-id="' + p.id + '">',
      '<img src="' + safeText(p.img) + '" alt="' + safeText(p.title) + '">',
      "<div>",
      '<b>' + safeText(p.title) + '</b>',
      '<div>Rs ' + toNum(p.price, 0) + ' | ' + safeText(p.category) + ' | ' + safeText(p.status) + (toNum(p.discount, 0) > 0 ? ' <span class="badge">' + toNum(p.discount, 0) + '% OFF</span>' : "") + '</div>',
      '<small class="' + (toNum(p.stock, 0) <= 5 ? "low" : "") + '">Stock: ' + toNum(p.stock, 0) + '</small>',
      "</div>",
      '<div class="ai-actions"><button class="edit" type="button">Edit</button><button class="del" type="button">Delete</button></div>'
    ].join("");

    row.querySelector(".edit").addEventListener("click", function () {
      fillForm(p);
    });

    row.querySelector(".del").addEventListener("click", function () {
      var ok = window.confirm("Delete this product?");
      if (!ok) {
        return;
      }
      products = products.filter(function (x) { return x.id !== p.id; });
      save();
      render();
    });

    els.adminList.appendChild(row);
  });

  updateStats();
}

function fillForm(p) {
  els.pId.value = p.id;
  els.pTitle.value = p.title || "";
  els.pPrice.value = toNum(p.price, 0);
  els.pOld.value = p.old || "";
  els.pDiscount.value = p.discount || "";
  els.pStock.value = toNum(p.stock, 0);
  els.pStatus.value = p.status || "active";
  els.pCat.value = p.category || "dryfruits";
  els.pDesc.value = p.desc || "";
  els.pLongDesc.value = p.longDesc || "";
  els.pGallery.value = Array.isArray(p.gallery) ? p.gallery.join(", ") : "";
  els.pHighlights.value = Array.isArray(p.highlights) ? p.highlights.join(", ") : "";
  els.pIngredients.value = Array.isArray(p.ingredients) ? p.ingredients.join(", ") : "";
  els.pWeight.value = (p.specs && p.specs.Weight) ? p.specs.Weight : "";
  els.pOrigin.value = (p.specs && p.specs.Origin) ? p.specs.Origin : "";
  els.pShelfLife.value = (p.specs && p.specs["Shelf Life"]) ? p.specs["Shelf Life"] : "";
  els.pPackType.value = (p.specs && p.specs["Pack Type"]) ? p.specs["Pack Type"] : "";
  els.imgPreview.src = p.img || "";
  els.imgPreview.style.display = p.img ? "block" : "none";
  els.formTitle.textContent = "Edit Product";
  els.cancelEdit.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  els.productForm.reset();
  els.pId.value = "";
  els.imgPreview.removeAttribute("src");
  els.imgPreview.style.display = "none";
  els.formTitle.textContent = "Add Product";
  els.cancelEdit.hidden = true;
}

function computePrice(oldValue, discountValue, explicitPrice) {
  var old = toNum(oldValue, 0);
  var discount = toNum(discountValue, 0);
  var enteredPrice = toNum(explicitPrice, 0);
  if (old > 0 && discount > 0) {
    return Math.round(old - (old * discount) / 100);
  }
  return enteredPrice;
}

function parseCsvList(value) {
  return String(value || "").split(",").map(function (v) { return v.trim(); }).filter(Boolean);
}

function uniqList(list) {
  return list.filter(function (item, idx, arr) {
    return item && arr.indexOf(item) === idx;
  });
}

function readFilesAsDataUrls(fileList) {
  var files = Array.from(fileList || []);
  return Promise.all(files.map(function (file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || "")); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }));
}

function getEditingProduct() {
  var id = Number(els.pId.value || 0);
  if (!id) {
    return null;
  }
  return products.find(function (p) { return Number(p.id) === id; }) || null;
}

function buildProduct(imgUrl, galleryFromFiles) {
  var old = toNum(els.pOld.value, 0);
  var discount = toNum(els.pDiscount.value, 0);
  var editing = getEditingProduct();
  var manualGallery = parseCsvList(els.pGallery.value);
  var gallery = uniqList([imgUrl].concat(galleryFromFiles || []).concat(manualGallery).concat(editing && Array.isArray(editing.gallery) ? editing.gallery : []));
  var highlights = parseCsvList(els.pHighlights.value);
  var ingredients = parseCsvList(els.pIngredients.value);
  var specs = {
    Weight: String(els.pWeight.value || "").trim() || "500g",
    Origin: String(els.pOrigin.value || "").trim() || "India",
    "Shelf Life": String(els.pShelfLife.value || "").trim() || "6 months",
    "Pack Type": String(els.pPackType.value || "").trim() || "Sealed pouch"
  };
  return {
    id: els.pId.value ? Number(els.pId.value) : uid(),
    title: String(els.pTitle.value || "").trim(),
    img: imgUrl,
    old: old > 0 ? old : null,
    discount: discount,
    price: computePrice(old, discount, els.pPrice.value),
    stock: Math.max(0, toNum(els.pStock.value, 0)),
    status: els.pStatus.value || "active",
    category: els.pCat.value || "dryfruits",
    desc: String(els.pDesc.value || "").trim(),
    longDesc: String(els.pLongDesc.value || "").trim(),
    gallery: gallery.length ? gallery : [imgUrl],
    highlights: highlights,
    ingredients: ingredients,
    specs: specs,
    rating: editing ? toNum(editing.rating, 4.5) : 4.5,
    reviews: editing ? toNum(editing.reviews, 0) : 0
  };
}

function upsertProduct(product) {
  var idx = products.findIndex(function (p) { return p.id === product.id; });
  if (idx >= 0) {
    products[idx] = product;
  } else {
    products.unshift(product);
  }
  save();
  render();
  resetForm();
}

function onImageSelected() {
  var file = els.pImgFile.files && els.pImgFile.files[0];
  if (!file) {
    return;
  }

  var reader = new FileReader();
  reader.onload = function () {
    els.imgPreview.src = String(reader.result || "");
    els.imgPreview.style.display = "block";
    els.imgPreview.title = (els.pImgFile.files ? els.pImgFile.files.length : 1) + " image(s) selected";
  };
  reader.readAsDataURL(file);
}

function onFormSubmit(event) {
  event.preventDefault();

  var hasTitle = String(els.pTitle.value || "").trim().length > 2;
  if (!hasTitle) {
    alert("Please enter a product title.");
    return;
  }

  var editing = getEditingProduct();
  var fileList = Array.from(els.pImgFile.files || []);
  var manualGallery = parseCsvList(els.pGallery.value);
  var existingGallery = editing && Array.isArray(editing.gallery) ? editing.gallery.slice() : [];
  var previewImg = String(els.imgPreview.getAttribute("src") || "");

  if (!fileList.length) {
    var mergedNoFile = uniqList([previewImg].concat(manualGallery).concat(existingGallery));
    if (mergedNoFile.length < 3) {
      alert("Minimum 3 images required. Upload multiple images or add gallery URLs.");
      return;
    }
    var fallbackImg = mergedNoFile[0] || "https://via.placeholder.com/160x160?text=No+Image";
    upsertProduct(buildProduct(fallbackImg, mergedNoFile));
    return;
  }

  readFilesAsDataUrls(fileList).then(function (uploadedGallery) {
    var merged = uniqList(uploadedGallery.concat(manualGallery).concat(existingGallery));
    if (merged.length < 3) {
      alert("Minimum 3 images required. Please select at least 3 images.");
      return;
    }
    upsertProduct(buildProduct(merged[0], merged));
  }).catch(function () {
    alert("Image upload failed. Please try again.");
  });
}

function onBulkDelete() {
  var ids = Array.from(document.querySelectorAll(".admin-item input[type='checkbox']:checked"))
    .map(function (box) { return Number(box.dataset.id); });

  if (!ids.length) {
    alert("Select at least one product.");
    return;
  }

  var ok = window.confirm("Delete " + ids.length + " selected products?");
  if (!ok) {
    return;
  }

  products = products.filter(function (p) {
    return !ids.includes(Number(p.id));
  });

  save();
  render();
}

function onExport() {
  var data = JSON.stringify(products, null, 2);
  var blob = new Blob([data], { type: "application/json" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "freshnut-products.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

function onImport(event) {
  var file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }

  var reader = new FileReader();
  reader.onload = function () {
    try {
      var imported = JSON.parse(String(reader.result || "[]"));
      if (!Array.isArray(imported)) {
        throw new Error("Invalid file format");
      }
      products = imported;
      save();
      render();
      alert("Products imported successfully.");
    } catch (_err) {
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
}

function resetCouponForm() {
  if (!els.couponForm) {
    return;
  }
  els.couponForm.reset();
  els.cId.value = "";
  els.cActive.checked = true;
  els.couponCancel.hidden = true;
}

function renderCoupons() {
  if (!els.couponList) {
    return;
  }
  els.couponList.innerHTML = "";

  if (!coupons.length) {
    els.couponList.innerHTML = "<p>No coupons configured.</p>";
    return;
  }

  coupons.slice().sort(function (a, b) { return Number(b.id) - Number(a.id); }).forEach(function (coupon) {
    var item = document.createElement("div");
    item.className = "coupon-item";
    item.innerHTML = [
      "<div>",
      "<h4>" + safeText(coupon.code) + " (" + safeText(coupon.type) + ")</h4>",
      "<p>Value: " + toNum(coupon.value, 0) + " | Min: Rs " + toNum(coupon.min, 0) + " | Max: " + (coupon.maxDiscount ? ("Rs " + toNum(coupon.maxDiscount, 0)) : "NA") + " | " + (coupon.active ? "Active" : "Inactive") + "</p>",
      "</div>",
      '<div class="actions">' +
      '<button type="button" class="toggle">' + (coupon.active ? "Disable" : "Enable") + "</button>" +
      '<button type="button" class="edit">Edit</button>' +
      '<button type="button" class="delete">Delete</button>' +
      "</div>"
    ].join("");

    item.querySelector(".toggle").addEventListener("click", function () {
      coupon.active = !coupon.active;
      saveCoupons();
      renderCoupons();
    });

    item.querySelector(".edit").addEventListener("click", function () {
      els.cId.value = String(coupon.id);
      els.cCode.value = coupon.code;
      els.cType.value = coupon.type;
      els.cValue.value = String(coupon.value);
      els.cMin.value = String(coupon.min);
      els.cMax.value = coupon.maxDiscount || "";
      els.cActive.checked = !!coupon.active;
      els.couponCancel.hidden = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    item.querySelector(".delete").addEventListener("click", function () {
      var ok = window.confirm("Delete coupon " + coupon.code + "?");
      if (!ok) {
        return;
      }
      coupons = coupons.filter(function (c) { return Number(c.id) !== Number(coupon.id); });
      saveCoupons();
      renderCoupons();
    });

    els.couponList.appendChild(item);
  });
}

function onCouponSubmit(event) {
  event.preventDefault();
  var code = String(els.cCode.value || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{4,20}$/.test(code)) {
    alert("Coupon code must be 4-20 chars (A-Z, 0-9).");
    return;
  }

  var id = els.cId.value ? Number(els.cId.value) : uid();
  var data = {
    id: id,
    code: code,
    type: els.cType.value === "flat" ? "flat" : "percent",
    value: Math.max(1, toNum(els.cValue.value, 0)),
    min: Math.max(0, toNum(els.cMin.value, 0)),
    maxDiscount: els.cMax.value ? Math.max(0, toNum(els.cMax.value, 0)) : null,
    active: !!els.cActive.checked
  };

  if (!els.cId.value && coupons.some(function (c) { return String(c.code) === code; })) {
    alert("Coupon code already exists.");
    return;
  }

  var idx = coupons.findIndex(function (c) { return Number(c.id) === id; });
  if (idx >= 0) {
    coupons[idx] = data;
  } else {
    coupons.unshift(data);
  }
  saveCoupons();
  renderCoupons();
  resetCouponForm();
}

function productTitleById(id) {
  var p = products.find(function (x) { return Number(x.id) === Number(id); });
  return p ? p.title : ("Product " + id);
}

function csvEscape(value) {
  var s = String(value == null ? "" : value);
  if (s.indexOf(",") >= 0 || s.indexOf("\"") >= 0 || s.indexOf("\n") >= 0) {
    return "\"" + s.replace(/"/g, "\"\"") + "\"";
  }
  return s;
}

function downloadCsv(filename, headers, rows) {
  try {
    var lines = [headers.map(csvEscape).join(",")].concat(rows.map(function (row) {
      return row.map(csvEscape).join(",");
    }));
    var csv = lines.join("\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var a = document.createElement("a");
    var href = "";
    if (window.URL && URL.createObjectURL) {
      href = URL.createObjectURL(blob);
    } else {
      href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    }
    a.href = href;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    if (typeof a.download === "undefined") {
      window.location.href = href;
    } else {
      a.click();
    }
    setTimeout(function () {
      if (href.indexOf("blob:") === 0 && window.URL && URL.revokeObjectURL) {
        URL.revokeObjectURL(href);
      }
      if (a.parentNode) {
        a.parentNode.removeChild(a);
      }
    }, 250);
    alert(filename + " exported (" + rows.length + " rows).");
  } catch (_err) {
    alert("CSV export failed.");
  }
}

function getFilteredUsers() {
  var filtered = users
    .filter(function (u) {
      var q = adminMetaFilters.userQuery;
      var role = adminMetaFilters.userRole;
      var hay = (String(u.name || "") + " " + String(u.email || "")).toLowerCase();
      var qOk = !q || hay.indexOf(q) >= 0;
      var roleOk = !role || String(u.role || "user") === role;
      return qOk && roleOk;
    });

  if (adminMetaFilters.userSort === "name_asc") {
    filtered.sort(function (a, b) { return String(a.name || "").localeCompare(String(b.name || "")); });
  } else if (adminMetaFilters.userSort === "name_desc") {
    filtered.sort(function (a, b) { return String(b.name || "").localeCompare(String(a.name || "")); });
  } else if (adminMetaFilters.userSort === "email_asc") {
    filtered.sort(function (a, b) { return String(a.email || "").localeCompare(String(b.email || "")); });
  } else if (adminMetaFilters.userSort === "role") {
    filtered.sort(function (a, b) { return String(a.role || "user").localeCompare(String(b.role || "user")); });
  } else {
    filtered.sort(function (a, b) { return Number(b.id) - Number(a.id); });
  }

  return filtered;
}

function getFilteredOrders() {
  var filtered = orders
    .filter(function (o) {
      var q = adminMetaFilters.orderQuery;
      var status = adminMetaFilters.orderStatus;
      var hay = (String(o.id || "") + " " + String((o.customer && o.customer.name) || "") + " " + String((o.customer && o.customer.email) || "")).toLowerCase();
      var qOk = !q || hay.indexOf(q) >= 0;
      var sOk = !status || String(o.status || "") === status;
      return qOk && sOk;
    });

  if (adminMetaFilters.orderSort === "oldest") {
    filtered.sort(function (a, b) { return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(); });
  } else if (adminMetaFilters.orderSort === "total_desc") {
    filtered.sort(function (a, b) { return toNum(b.total, 0) - toNum(a.total, 0); });
  } else if (adminMetaFilters.orderSort === "total_asc") {
    filtered.sort(function (a, b) { return toNum(a.total, 0) - toNum(b.total, 0); });
  } else if (adminMetaFilters.orderSort === "customer") {
    filtered.sort(function (a, b) {
      return String((a.customer && a.customer.name) || "").localeCompare(String((b.customer && b.customer.name) || ""));
    });
  } else {
    filtered.sort(function (a, b) { return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(); });
  }

  return filtered;
}

function getFilteredComments() {
  var flat = flattenReviews()
    .filter(function (row) {
      var q = adminMetaFilters.commentQuery;
      var rating = adminMetaFilters.commentRating;
      var r = row.review || {};
      var hay = (productTitleById(row.productId) + " " + String(r.name || "") + " " + String(r.text || "")).toLowerCase();
      var qOk = !q || hay.indexOf(q) >= 0;
      var rOk = !rating || String(toNum(r.rate, 0)) === rating;
      return qOk && rOk;
    });

  if (adminMetaFilters.commentSort === "oldest") {
    flat.sort(function (a, b) { return Number((a.review && a.review.ts) || 0) - Number((b.review && b.review.ts) || 0); });
  } else if (adminMetaFilters.commentSort === "rating_desc") {
    flat.sort(function (a, b) { return toNum((b.review && b.review.rate), 0) - toNum((a.review && a.review.rate), 0); });
  } else if (adminMetaFilters.commentSort === "rating_asc") {
    flat.sort(function (a, b) { return toNum((a.review && a.review.rate), 0) - toNum((b.review && b.review.rate), 0); });
  } else if (adminMetaFilters.commentSort === "product") {
    flat.sort(function (a, b) { return productTitleById(a.productId).localeCompare(productTitleById(b.productId)); });
  } else {
    flat.sort(function (a, b) { return Number((b.review && b.review.ts) || 0) - Number((a.review && a.review.ts) || 0); });
  }

  return flat;
}

function getFilteredContacts() {
  var filtered = contactMessages
    .filter(function (m) {
      var q = adminMetaFilters.contactQuery;
      var subject = adminMetaFilters.contactSubject;
      var status = adminMetaFilters.contactStatus;
      var hay = (String(m.id || "") + " " + String(m.name || "") + " " + String(m.email || "") + " " + String(m.phone || "") + " " + String(m.message || "")).toLowerCase();
      var qOk = !q || hay.indexOf(q) >= 0;
      var subjectOk = !subject || String(m.subject || "") === subject;
      var statusOk = !status || String(m.status || "new") === status;
      return qOk && subjectOk && statusOk;
    });

  if (adminMetaFilters.contactSort === "oldest") {
    filtered.sort(function (a, b) { return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(); });
  } else if (adminMetaFilters.contactSort === "name") {
    filtered.sort(function (a, b) { return String(a.name || "").localeCompare(String(b.name || "")); });
  } else if (adminMetaFilters.contactSort === "subject") {
    filtered.sort(function (a, b) { return String(a.subject || "").localeCompare(String(b.subject || "")); });
  } else {
    filtered.sort(function (a, b) { return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(); });
  }

  return filtered;
}

function exportUsersCsv() {
  var rows = getFilteredUsers().map(function (u) {
    return [
      u.id || "",
      u.name || "",
      u.email || "",
      u.role || "user",
      u.createdAt || ""
    ];
  });
  downloadCsv("users.csv", ["id", "name", "email", "role", "created_at"], rows);
}

function exportOrdersCsv() {
  var rows = getFilteredOrders().map(function (o) {
    return [
      o.id || "",
      (o.customer && o.customer.name) || "",
      (o.customer && o.customer.email) || "",
      o.status || "",
      o.paymentMethod || "",
      toNum(o.subtotal, 0),
      toNum(o.discount, 0),
      toNum(o.shipping, 0),
      toNum(o.total, 0),
      o.createdAt || ""
    ];
  });
  downloadCsv("orders.csv", ["id", "customer_name", "customer_email", "status", "payment_method", "subtotal", "discount", "shipping", "total", "created_at"], rows);
}

function exportCommentsCsv() {
  var rows = getFilteredComments().map(function (row) {
    var r = row.review || {};
    return [
      row.productId,
      productTitleById(row.productId),
      r.name || "",
      toNum(r.rate, 0),
      r.text || "",
      r.ts || ""
    ];
  });
  downloadCsv("comments.csv", ["product_id", "product_title", "reviewer_name", "rating", "comment", "timestamp"], rows);
}

function exportContactsCsv() {
  var rows = getFilteredContacts().map(function (m) {
    return [
      m.id || "",
      m.name || "",
      m.email || "",
      m.phone || "",
      m.subject || "",
      m.message || "",
      m.status || "new",
      m.createdAt || ""
    ];
  });
  downloadCsv("contact-messages.csv", ["id", "name", "email", "phone", "subject", "message", "status", "created_at"], rows);
}

function renderUsers() {
  if (!els.userList) {
    return;
  }
  els.userList.innerHTML = "";

  if (!users.length) {
    els.userList.innerHTML = "<p>No users found.</p>";
    return;
  }

  var filtered = users
    .filter(function (u) {
      var q = adminMetaFilters.userQuery;
      var role = adminMetaFilters.userRole;
      var hay = (String(u.name || "") + " " + String(u.email || "")).toLowerCase();
      var qOk = !q || hay.indexOf(q) >= 0;
      var roleOk = !role || String(u.role || "user") === role;
      return qOk && roleOk;
    });

  if (adminMetaFilters.userSort === "name_asc") {
    filtered.sort(function (a, b) { return String(a.name || "").localeCompare(String(b.name || "")); });
  } else if (adminMetaFilters.userSort === "name_desc") {
    filtered.sort(function (a, b) { return String(b.name || "").localeCompare(String(a.name || "")); });
  } else if (adminMetaFilters.userSort === "email_asc") {
    filtered.sort(function (a, b) { return String(a.email || "").localeCompare(String(b.email || "")); });
  } else if (adminMetaFilters.userSort === "role") {
    filtered.sort(function (a, b) { return String(a.role || "user").localeCompare(String(b.role || "user")); });
  } else {
    filtered.sort(function (a, b) { return Number(b.id) - Number(a.id); });
  }

  var totalPages = Math.max(1, Math.ceil(filtered.length / adminMetaFilters.userPageSize));
  adminMetaFilters.userPage = Math.max(1, Math.min(adminMetaFilters.userPage, totalPages));
  var start = (adminMetaFilters.userPage - 1) * adminMetaFilters.userPageSize;
  var paged = filtered.slice(start, start + adminMetaFilters.userPageSize);

  paged.forEach(function (u) {
    var item = document.createElement("div");
    item.className = "meta-item";
    item.innerHTML = [
      "<div>",
      "<h4>" + safeText(u.name || "User") + "</h4>",
      "<p>Email: " + safeText(u.email || "") + " | Role: " + safeText(u.role || "user") + "</p>",
      "</div>",
      '<div class="meta-actions">' +
      '<select><option value="user">user</option><option value="admin">admin</option></select>' +
      '<button type="button">Update</button>' +
      "</div>"
    ].join("");

    var select = item.querySelector("select");
    select.value = u.role || "user";

    item.querySelector("button").addEventListener("click", function () {
      u.role = select.value;
      saveUsers();
      renderUsers();
      alert("User updated.");
    });

      els.userList.appendChild(item);
  });

  if (!els.userList.children.length) {
    els.userList.innerHTML = "<p>No users matched your filter.</p>";
  }
  renderMetaPagination(els.userPagination, adminMetaFilters.userPage, totalPages, adminMetaFilters.userPageSize, function (next) {
    adminMetaFilters.userPage = next;
    renderUsers();
  }, function (size) {
    adminMetaFilters.userPageSize = size;
    adminMetaFilters.userPage = 1;
    renderUsers();
  });
}

function renderOrdersAdmin() {
  if (!els.orderList) {
    return;
  }
  els.orderList.innerHTML = "";

  if (!orders.length) {
    els.orderList.innerHTML = "<p>No orders found.</p>";
    return;
  }

  var filtered = orders
    .filter(function (o) {
      var q = adminMetaFilters.orderQuery;
      var status = adminMetaFilters.orderStatus;
      var hay = (String(o.id || "") + " " + String((o.customer && o.customer.name) || "") + " " + String((o.customer && o.customer.email) || "")).toLowerCase();
      var qOk = !q || hay.indexOf(q) >= 0;
      var sOk = !status || String(o.status || "") === status;
      return qOk && sOk;
    });

  if (adminMetaFilters.orderSort === "oldest") {
    filtered.sort(function (a, b) { return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(); });
  } else if (adminMetaFilters.orderSort === "total_desc") {
    filtered.sort(function (a, b) { return toNum(b.total, 0) - toNum(a.total, 0); });
  } else if (adminMetaFilters.orderSort === "total_asc") {
    filtered.sort(function (a, b) { return toNum(a.total, 0) - toNum(b.total, 0); });
  } else if (adminMetaFilters.orderSort === "customer") {
    filtered.sort(function (a, b) {
      return String((a.customer && a.customer.name) || "").localeCompare(String((b.customer && b.customer.name) || ""));
    });
  } else {
    filtered.sort(function (a, b) { return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(); });
  }

  var totalPages = Math.max(1, Math.ceil(filtered.length / adminMetaFilters.orderPageSize));
  adminMetaFilters.orderPage = Math.max(1, Math.min(adminMetaFilters.orderPage, totalPages));
  var start = (adminMetaFilters.orderPage - 1) * adminMetaFilters.orderPageSize;
  var paged = filtered.slice(start, start + adminMetaFilters.orderPageSize);

  paged.forEach(function (o) {
    var item = document.createElement("div");
    item.className = "meta-item";
    item.innerHTML = [
      "<div>",
      "<h4>" + safeText(o.id || "Order") + "</h4>",
      "<p>" + safeText((o.customer && o.customer.name) || "Customer") + " | " + safeText((o.customer && o.customer.email) || "") + " | Total: Rs " + toNum(o.total, 0) + "</p>",
      "</div>",
      '<div class="meta-actions">' +
      '<select><option value="placed">placed</option><option value="processing">processing</option><option value="shipped">shipped</option><option value="delivered">delivered</option><option value="cancelled">cancelled</option><option value="return_requested">return_requested</option></select>' +
      '<button type="button">Update</button>' +
      "</div>"
    ].join("");

    var select = item.querySelector("select");
    select.value = o.status || "placed";

    item.querySelector("button").addEventListener("click", function () {
      o.status = select.value;
      saveOrders();
      renderOrdersAdmin();
      alert("Order status updated.");
    });

      els.orderList.appendChild(item);
  });

  if (!els.orderList.children.length) {
    els.orderList.innerHTML = "<p>No orders matched your filter.</p>";
  }
  renderMetaPagination(els.orderPagination, adminMetaFilters.orderPage, totalPages, adminMetaFilters.orderPageSize, function (next) {
    adminMetaFilters.orderPage = next;
    renderOrdersAdmin();
  }, function (size) {
    adminMetaFilters.orderPageSize = size;
    adminMetaFilters.orderPage = 1;
    renderOrdersAdmin();
  });
}

function flattenReviews() {
  return Object.keys(reviews).flatMap(function (pid) {
    var arr = Array.isArray(reviews[pid]) ? reviews[pid] : [];
    return arr.map(function (entry, idx) {
      return { productId: Number(pid), index: idx, review: entry };
    });
  });
}

function renderCommentsAdmin() {
  if (!els.commentList) {
    return;
  }
  els.commentList.innerHTML = "";

  var flat = flattenReviews()
    .filter(function (row) {
      var q = adminMetaFilters.commentQuery;
      var rating = adminMetaFilters.commentRating;
      var r = row.review || {};
      var hay = (productTitleById(row.productId) + " " + String(r.name || "") + " " + String(r.text || "")).toLowerCase();
      var qOk = !q || hay.indexOf(q) >= 0;
      var rOk = !rating || String(toNum(r.rate, 0)) === rating;
      return qOk && rOk;
    });

  if (adminMetaFilters.commentSort === "oldest") {
    flat.sort(function (a, b) { return Number((a.review && a.review.ts) || 0) - Number((b.review && b.review.ts) || 0); });
  } else if (adminMetaFilters.commentSort === "rating_desc") {
    flat.sort(function (a, b) { return toNum((b.review && b.review.rate), 0) - toNum((a.review && a.review.rate), 0); });
  } else if (adminMetaFilters.commentSort === "rating_asc") {
    flat.sort(function (a, b) { return toNum((a.review && a.review.rate), 0) - toNum((b.review && b.review.rate), 0); });
  } else if (adminMetaFilters.commentSort === "product") {
    flat.sort(function (a, b) { return productTitleById(a.productId).localeCompare(productTitleById(b.productId)); });
  } else {
    flat.sort(function (a, b) { return Number((b.review && b.review.ts) || 0) - Number((a.review && a.review.ts) || 0); });
  }

  if (!flat.length) {
    els.commentList.innerHTML = "<p>No comments found.</p>";
    return;
  }

  var totalPages = Math.max(1, Math.ceil(flat.length / adminMetaFilters.commentPageSize));
  adminMetaFilters.commentPage = Math.max(1, Math.min(adminMetaFilters.commentPage, totalPages));
  var start = (adminMetaFilters.commentPage - 1) * adminMetaFilters.commentPageSize;
  var paged = flat.slice(start, start + adminMetaFilters.commentPageSize);

  paged.forEach(function (row) {
    var r = row.review || {};
    var item = document.createElement("div");
    item.className = "meta-item";
    item.innerHTML = [
      "<div>",
      "<h4>" + safeText(productTitleById(row.productId)) + " | " + safeText(r.name || "Customer") + "</h4>",
      "<p>Rating: " + toNum(r.rate, 5) + "/5 | " + safeText(r.text || "") + "</p>",
      "</div>",
      '<div class="meta-actions">' +
      '<button type="button" class="edit">Edit</button>' +
      '<button type="button" class="del">Delete</button>' +
      "</div>"
    ].join("");

    item.querySelector(".edit").addEventListener("click", function () {
      var nextText = window.prompt("Update comment text:", String(r.text || ""));
      if (nextText === null) {
        return;
      }
      var nextRate = window.prompt("Update rating (1-5):", String(toNum(r.rate, 5)));
      if (nextRate === null) {
        return;
      }
      r.text = String(nextText).trim();
      r.rate = Math.max(1, Math.min(5, toNum(nextRate, 5)));
      r.ts = Date.now();
      saveReviews();
      renderCommentsAdmin();
    });

    item.querySelector(".del").addEventListener("click", function () {
      var ok = window.confirm("Delete this comment?");
      if (!ok) {
        return;
      }
      var arr = Array.isArray(reviews[row.productId]) ? reviews[row.productId] : [];
      arr.splice(row.index, 1);
      reviews[row.productId] = arr;
      saveReviews();
      renderCommentsAdmin();
    });

    els.commentList.appendChild(item);
  });

  if (!els.commentList.children.length) {
    els.commentList.innerHTML = "<p>No comments matched your filter.</p>";
  }
  renderMetaPagination(els.commentPagination, adminMetaFilters.commentPage, totalPages, adminMetaFilters.commentPageSize, function (next) {
    adminMetaFilters.commentPage = next;
    renderCommentsAdmin();
  }, function (size) {
    adminMetaFilters.commentPageSize = size;
    adminMetaFilters.commentPage = 1;
    renderCommentsAdmin();
  });
}

function renderContactsAdmin() {
  if (!els.contactList) {
    return;
  }
  els.contactList.innerHTML = "";

  if (!contactMessages.length) {
    els.contactList.innerHTML = "<p>No contact messages found.</p>";
    return;
  }

  var filtered = getFilteredContacts();
  if (!filtered.length) {
    els.contactList.innerHTML = "<p>No contact messages matched your filter.</p>";
    return;
  }

  var totalPages = Math.max(1, Math.ceil(filtered.length / adminMetaFilters.contactPageSize));
  adminMetaFilters.contactPage = Math.max(1, Math.min(adminMetaFilters.contactPage, totalPages));
  var start = (adminMetaFilters.contactPage - 1) * adminMetaFilters.contactPageSize;
  var paged = filtered.slice(start, start + adminMetaFilters.contactPageSize);

  paged.forEach(function (m) {
    var item = document.createElement("div");
    item.className = "meta-item";
    item.innerHTML = [
      "<div>",
      "<h4>" + safeText(m.name || "Visitor") + " | " + safeText(m.subject || "General") + "</h4>",
      "<p>Contact ID: " + safeText(String(m.id || "")) + "</p>",
      "<p>Email: " + safeText(m.email || "") + " | Phone: " + safeText(m.phone || "") + "</p>",
      "<p>Message: " + safeText(m.message || "") + "</p>",
      "</div>",
      '<div class="meta-actions">' +
      '<select><option value="new">new</option><option value="in_progress">in_progress</option><option value="resolved">resolved</option></select>' +
      '<button type="button" class="update">Update</button>' +
      '<button type="button" class="del">Delete</button>' +
      "</div>"
    ].join("");

    var select = item.querySelector("select");
    select.value = String(m.status || "new");

    item.querySelector(".update").addEventListener("click", function () {
      m.status = String(select.value || "new");
      saveContactMessages();
      renderContactsAdmin();
      alert("Contact message updated.");
    });

    item.querySelector(".del").addEventListener("click", function () {
      var ok = window.confirm("Delete this contact message?");
      if (!ok) {
        return;
      }
      contactMessages = contactMessages.filter(function (x) { return String(x.id || "") !== String(m.id || ""); });
      saveContactMessages();
      renderContactsAdmin();
    });

    els.contactList.appendChild(item);
  });

  renderMetaPagination(els.contactPagination, adminMetaFilters.contactPage, totalPages, adminMetaFilters.contactPageSize, function (next) {
    adminMetaFilters.contactPage = next;
    renderContactsAdmin();
  }, function (size) {
    adminMetaFilters.contactPageSize = size;
    adminMetaFilters.contactPage = 1;
    renderContactsAdmin();
  });
}

function renderMetaPagination(container, currentPage, totalPages, currentPageSize, onPageChange, onPageSizeChange) {
  if (!container) {
    return;
  }
  container.innerHTML = "";

  var prev = document.createElement("button");
  prev.type = "button";
  prev.textContent = "Prev";
  prev.disabled = currentPage <= 1;
  prev.addEventListener("click", function () {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  });

  var info = document.createElement("span");
  info.textContent = "Page " + currentPage + " of " + totalPages;

  var next = document.createElement("button");
  next.type = "button";
  next.textContent = "Next";
  next.disabled = currentPage >= totalPages;
  next.addEventListener("click", function () {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  });

  var size = document.createElement("select");
  [5, 10, 25, 50].forEach(function (s) {
    var opt = document.createElement("option");
    opt.value = String(s);
    opt.textContent = String(s) + "/page";
    if (Number(currentPageSize) === s) {
      opt.selected = true;
    }
    size.appendChild(opt);
  });
  size.addEventListener("change", function () {
    onPageSizeChange(Number(size.value));
  });

  var jump = document.createElement("input");
  jump.type = "number";
  jump.min = "1";
  jump.max = String(totalPages);
  jump.placeholder = "Page";

  var go = document.createElement("button");
  go.type = "button";
  go.textContent = "Go";
  go.addEventListener("click", function () {
    var target = Math.max(1, Math.min(totalPages, toNum(jump.value, currentPage)));
    onPageChange(target);
  });

  container.appendChild(size);
  container.appendChild(prev);
  container.appendChild(info);
  container.appendChild(next);
  container.appendChild(jump);
  container.appendChild(go);
}

function bindEvents() {
  els.pImgFile && els.pImgFile.addEventListener("change", onImageSelected);
  els.productForm && els.productForm.addEventListener("submit", onFormSubmit);
  els.cancelEdit && els.cancelEdit.addEventListener("click", resetForm);

  els.search && els.search.addEventListener("input", function () {
    state.query = String(els.search.value || "").toLowerCase().trim();
    render();
  });

  els.filterCat && els.filterCat.addEventListener("change", function () {
    state.category = els.filterCat.value;
    render();
  });

  els.filterStatus && els.filterStatus.addEventListener("change", function () {
    state.status = els.filterStatus.value;
    render();
  });

  els.sortBy && els.sortBy.addEventListener("change", function () {
    state.sort = els.sortBy.value;
    render();
  });

  els.bulkDelete && els.bulkDelete.addEventListener("click", onBulkDelete);
  els.exportBtn && els.exportBtn.addEventListener("click", onExport);
  els.importInput && els.importInput.addEventListener("change", onImport);
  els.couponForm && els.couponForm.addEventListener("submit", onCouponSubmit);
  els.couponCancel && els.couponCancel.addEventListener("click", resetCouponForm);
  els.exportUsersCsv && els.exportUsersCsv.addEventListener("click", exportUsersCsv);
  els.exportOrdersCsv && els.exportOrdersCsv.addEventListener("click", exportOrdersCsv);
  els.exportCommentsCsv && els.exportCommentsCsv.addEventListener("click", exportCommentsCsv);
  els.exportContactsCsv && els.exportContactsCsv.addEventListener("click", exportContactsCsv);

  els.userSearch && els.userSearch.addEventListener("input", function () {
    adminMetaFilters.userQuery = String(els.userSearch.value || "").toLowerCase().trim();
    adminMetaFilters.userPage = 1;
    renderUsers();
  });
  els.userRoleFilter && els.userRoleFilter.addEventListener("change", function () {
    adminMetaFilters.userRole = String(els.userRoleFilter.value || "");
    adminMetaFilters.userPage = 1;
    renderUsers();
  });
  els.userSort && els.userSort.addEventListener("change", function () {
    adminMetaFilters.userSort = String(els.userSort.value || "newest");
    adminMetaFilters.userPage = 1;
    renderUsers();
  });

  els.orderSearchAdmin && els.orderSearchAdmin.addEventListener("input", function () {
    adminMetaFilters.orderQuery = String(els.orderSearchAdmin.value || "").toLowerCase().trim();
    adminMetaFilters.orderPage = 1;
    renderOrdersAdmin();
  });
  els.orderStatusAdminFilter && els.orderStatusAdminFilter.addEventListener("change", function () {
    adminMetaFilters.orderStatus = String(els.orderStatusAdminFilter.value || "");
    adminMetaFilters.orderPage = 1;
    renderOrdersAdmin();
  });
  els.orderSort && els.orderSort.addEventListener("change", function () {
    adminMetaFilters.orderSort = String(els.orderSort.value || "newest");
    adminMetaFilters.orderPage = 1;
    renderOrdersAdmin();
  });

  els.commentSearch && els.commentSearch.addEventListener("input", function () {
    adminMetaFilters.commentQuery = String(els.commentSearch.value || "").toLowerCase().trim();
    adminMetaFilters.commentPage = 1;
    renderCommentsAdmin();
  });
  els.commentRatingFilter && els.commentRatingFilter.addEventListener("change", function () {
    adminMetaFilters.commentRating = String(els.commentRatingFilter.value || "");
    adminMetaFilters.commentPage = 1;
    renderCommentsAdmin();
  });
  els.commentSort && els.commentSort.addEventListener("change", function () {
    adminMetaFilters.commentSort = String(els.commentSort.value || "newest");
    adminMetaFilters.commentPage = 1;
    renderCommentsAdmin();
  });

  els.contactSearch && els.contactSearch.addEventListener("input", function () {
    adminMetaFilters.contactQuery = String(els.contactSearch.value || "").toLowerCase().trim();
    adminMetaFilters.contactPage = 1;
    renderContactsAdmin();
  });
  els.contactSubjectFilter && els.contactSubjectFilter.addEventListener("change", function () {
    adminMetaFilters.contactSubject = String(els.contactSubjectFilter.value || "");
    adminMetaFilters.contactPage = 1;
    renderContactsAdmin();
  });
  els.contactStatusFilter && els.contactStatusFilter.addEventListener("change", function () {
    adminMetaFilters.contactStatus = String(els.contactStatusFilter.value || "");
    adminMetaFilters.contactPage = 1;
    renderContactsAdmin();
  });
  els.contactSort && els.contactSort.addEventListener("change", function () {
    adminMetaFilters.contactSort = String(els.contactSort.value || "newest");
    adminMetaFilters.contactPage = 1;
    renderContactsAdmin();
  });
}

bindEvents();
initAdminTabs();
render();
renderCoupons();
renderUsers();
renderOrdersAdmin();
renderCommentsAdmin();
renderContactsAdmin();

