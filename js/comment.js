"use strict";

function esc(value) {
  return String(value || "").replace(/[<>&"]/g, function (ch) {
    if (ch === "<") { return "&lt;"; }
    if (ch === ">") { return "&gt;"; }
    if (ch === "&") { return "&amp;"; }
    return "&quot;";
  });
}

function safeNum(value, min, max, fallback) {
  var n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, n));
}

function starLine(rating) {
  var r = safeNum(rating, 1, 5, 5);
  return "★".repeat(r) + "☆".repeat(5 - r);
}

function shortTime(ts) {
  var time = Number(ts || 0);
  if (!time) {
    return "recently";
  }
  var diff = Math.max(0, Date.now() - time);
  var days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days <= 0) { return "today"; }
  if (days === 1) { return "1 day ago"; }
  if (days < 30) { return days + " days ago"; }
  var months = Math.floor(days / 30);
  if (months === 1) { return "1 month ago"; }
  if (months < 12) { return months + " months ago"; }
  var years = Math.floor(months / 12);
  return years === 1 ? "1 year ago" : years + " years ago";
}

function normalizeReview(review) {
  if (!review || typeof review !== "object") {
    return null;
  }
  var text = String(review.text || "").trim();
  if (!text) {
    return null;
  }
  return {
    text: text,
    name: String(review.name || "Verified Buyer").trim() || "Verified Buyer",
    city: String(review.city || "").trim(),
    rate: safeNum(review.rate || review.rating, 1, 5, 5),
    ts: Number(review.ts || Date.now())
  };
}

function initTestimonialSlider() {
  var cards = document.querySelectorAll(".ts-card");
  var prev = document.getElementById("tsPrev");
  var next = document.getElementById("tsNext");
  var wrap = document.querySelector(".ts-wrap");

  if (!cards.length || !wrap) {
    return;
  }

  if (wrap.dataset.sliderReady === "1") {
    return;
  }
  wrap.dataset.sliderReady = "1";

  var index = 0;
  var timer = null;

  function show(i) {
    cards.forEach(function (card, idx) {
      card.classList.toggle("active", idx === i);
    });
  }

  function startAuto() {
    if (timer) {
      clearInterval(timer);
    }
    timer = setInterval(function () {
      index = (index + 1) % cards.length;
      show(index);
    }, 4000);
  }

  function stopAuto() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  next && next.addEventListener("click", function () {
    index = (index + 1) % cards.length;
    show(index);
    startAuto();
  });

  prev && prev.addEventListener("click", function () {
    index = (index - 1 + cards.length) % cards.length;
    show(index);
    startAuto();
  });

  wrap.addEventListener("mouseenter", stopAuto);
  wrap.addEventListener("mouseleave", startAuto);

  show(0);
  startAuto();
}

function initTestimonials() {
  var track = document.getElementById("tsTrack");
  if (!track) {
    return;
  }

  var sample = [
    { text: "Almonds were fresh and crunchy. Packaging was neat too.", name: "Ritika", city: "Delhi", rate: 5, ts: Date.now() - 4 * 24 * 60 * 60 * 1000 },
    { text: "Mango pickle tastes close to homemade. Will order again.", name: "Amit", city: "Jaipur", rate: 4, ts: Date.now() - 10 * 24 * 60 * 60 * 1000 },
    { text: "Delivery was on time and sweets arrived in good condition.", name: "Neha", city: "Pune", rate: 5, ts: Date.now() - 22 * 24 * 60 * 60 * 1000 },
    { text: "Good quality for the price. Combo packs are useful for gifting.", name: "Saurabh", city: "Lucknow", rate: 4, ts: Date.now() - 35 * 24 * 60 * 60 * 1000 }
  ];

  var reviews = {};
  try {
    reviews = JSON.parse(localStorage.getItem("reviews") || "{}");
  } catch (_err) {
    reviews = {};
  }

  var all = Object.values(reviews).flat().map(normalizeReview).filter(Boolean);
  var list = (all.length ? all : sample).slice(-6).reverse();

  track.innerHTML = list.map(function (review, idx) {
    var user = review.city ? esc(review.name) + " • " + esc(review.city) : esc(review.name);
    return [
      '<div class="ts-card ' + (idx === 0 ? "active" : "") + '">',
      "<p>" + esc(review.text) + "</p>",
      '<div class="ts-user">' + user + "</div>",
      '<div class="ts-meta"><span class="ts-stars">' + starLine(review.rate) + '</span><span class="ts-time">' + shortTime(review.ts) + "</span></div>",
      "</div>"
    ].join("");
  }).join("");

  initTestimonialSlider();
}

window.initTestimonials = initTestimonials;
