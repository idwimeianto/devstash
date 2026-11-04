"use strict";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// ───────── Navbar: more opaque once the page scrolls ─────────

function initNav() {
  const nav = document.getElementById("nav");
  const update = () => nav.classList.toggle("is-scrolled", window.scrollY > 16);
  update();
  window.addEventListener("scroll", update, { passive: true });
}

// ───────── Scroll reveal ─────────

function initReveal() {
  const elements = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    elements.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
  );
  elements.forEach((el) => observer.observe(el));
}

// ───────── Pricing: monthly / yearly toggle ─────────

const PRO_PRICES = {
  monthly: { price: "$8", period: "/month", note: "Billed monthly. Cancel anytime." },
  yearly: { price: "$72", period: "/year", note: "Billed yearly. That's $6/month, 25% off." },
};

function initPricing() {
  const toggle = document.getElementById("billing-switch");
  const price = document.getElementById("pro-price");
  const period = document.getElementById("pro-period");
  const note = document.getElementById("pro-note");
  const labels = document.querySelectorAll("[data-billing-label]");

  function render(yearly) {
    const billing = yearly ? "yearly" : "monthly";
    const plan = PRO_PRICES[billing];
    toggle.setAttribute("aria-checked", String(yearly));
    price.textContent = plan.price;
    period.textContent = plan.period;
    note.textContent = plan.note;
    labels.forEach((label) =>
      label.classList.toggle("is-active", label.dataset.billingLabel === billing),
    );
  }

  toggle.addEventListener("click", () => render(toggle.getAttribute("aria-checked") !== "true"));
  // Clicking a label picks that option.
  labels.forEach((label) =>
    label.addEventListener("click", () => render(label.dataset.billingLabel === "yearly")),
  );
}

// ───────── Hero: floating "chaos" icons ─────────

const ICON_SIZE = 56;
const SPEED = 0.6; // px per frame at 60fps
const MAX_SPEED = 5;
const REPEL_RADIUS = 120;
const REPEL_FORCE = 1.2;

function initChaos() {
  const box = document.getElementById("chaos");
  const icons = [...box.querySelectorAll(".chaos-icon")];
  let width = box.clientWidth;
  let height = box.clientHeight;
  let mouse = null;
  let frame = 0;
  let running = false;
  let lastTime = 0;

  // Start spread over two rows of four so icons don't overlap at first.
  const columns = 4;
  const bodies = icons.map((el, i) => {
    const angle = Math.random() * Math.PI * 2;
    return {
      el,
      x: ((i % columns) * (width - ICON_SIZE)) / (columns - 1),
      y: i < columns ? 20 : height - ICON_SIZE - 20,
      vx: Math.cos(angle) * SPEED,
      vy: Math.sin(angle) * SPEED,
      rotation: Math.random() * 30 - 15,
      spin: (Math.random() - 0.5) * 0.3,
      phase: Math.random() * Math.PI * 2,
    };
  });

  function draw(body, time) {
    const scale = 1 + Math.sin(time / 900 + body.phase) * 0.06;
    const tilt = body.rotation + Math.sin(time / 1300 + body.phase) * 6;
    body.el.style.transform = `translate(${body.x}px, ${body.y}px) rotate(${tilt}deg) scale(${scale})`;
  }

  function step(time) {
    // Frame-rate independent: 1 = one 60fps frame, capped after tab switches.
    const dt = Math.min((time - lastTime) / 16.67 || 1, 3);
    lastTime = time;

    for (const body of bodies) {
      if (mouse) {
        const dx = body.x + ICON_SIZE / 2 - mouse.x;
        const dy = body.y + ICON_SIZE / 2 - mouse.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance < REPEL_RADIUS) {
          const push = (1 - distance / REPEL_RADIUS) * REPEL_FORCE * dt;
          body.vx += (dx / distance) * push;
          body.vy += (dy / distance) * push;
        }
      }

      // Ease back toward the cruising speed after being pushed.
      const speed = Math.hypot(body.vx, body.vy) || 1;
      const target = Math.min(Math.max(speed * 0.97, SPEED), MAX_SPEED);
      body.vx = (body.vx / speed) * target;
      body.vy = (body.vy / speed) * target;

      body.x += body.vx * dt;
      body.y += body.vy * dt;
      body.rotation += body.spin * dt;

      // Bounce off the walls.
      const maxX = width - ICON_SIZE;
      const maxY = height - ICON_SIZE;
      if (body.x < 0 || body.x > maxX) {
        body.x = Math.min(Math.max(body.x, 0), maxX);
        body.vx *= -1;
      }
      if (body.y < 0 || body.y > maxY) {
        body.y = Math.min(Math.max(body.y, 0), maxY);
        body.vy *= -1;
      }

      draw(body, time);
    }
    frame = requestAnimationFrame(step);
  }

  function start() {
    if (running || reducedMotion.matches) return;
    running = true;
    lastTime = performance.now();
    frame = requestAnimationFrame(step);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frame);
  }

  // Reduced motion keeps the static CSS layout.
  function applyMotionPreference() {
    if (reducedMotion.matches) {
      stop();
      bodies.forEach((body) => body.el.style.removeProperty("transform"));
    } else {
      start();
    }
  }

  box.addEventListener("pointermove", (event) => {
    const rect = box.getBoundingClientRect();
    mouse = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  });
  box.addEventListener("pointerleave", () => {
    mouse = null;
  });

  new ResizeObserver(() => {
    width = box.clientWidth;
    height = box.clientHeight;
  }).observe(box);

  // Only animate while the box is on screen.
  new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(box);
  reducedMotion.addEventListener("change", applyMotionPreference);
  applyMotionPreference();
}

// ───────── Footer year ─────────

function initYear() {
  document.getElementById("year").textContent = String(new Date().getFullYear());
}

initNav();
initReveal();
initPricing();
initChaos();
initYear();
