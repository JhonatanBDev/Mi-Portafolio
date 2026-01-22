(() => {
  const container = document.getElementById("sections");
  const sections = Array.from(document.querySelectorAll(".section"));
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const indicator = document.getElementById("scrollIndicator");
  const hint = document.getElementById("scrollHint");
  const year = document.getElementById("year");

  year.textContent = new Date().getFullYear();

  // ---- Scroll snapping control (wheel -> sección siguiente/anterior)
  let currentIndex = 0;
  let isAnimating = false;
  let wheelLock = 0;

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  function scrollToIndex(idx) {
    currentIndex = clamp(idx, 0, sections.length - 1);
    isAnimating = true;
    sections[currentIndex].scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => (isAnimating = false), 420);
    updateUI();
  }

  function getClosestIndex() {
    const top = container.scrollTop;
    let best = 0;
    let bestDist = Infinity;
    sections.forEach((sec, i) => {
      const dist = Math.abs(sec.offsetTop - top);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    return best;
  }

  function updateUI() {
    // Active nav
    navLinks.forEach(a => a.classList.remove("active"));
    const active = navLinks.find(a => a.dataset.target === sections[currentIndex].id);
    if (active) active.classList.add("active");

    // Indicator direction
    const atBottom = currentIndex >= sections.length - 1;
    const atTop = currentIndex <= 0;

    if (atBottom) {
      indicator.classList.add("up");
      indicator.setAttribute("aria-label", "Subir");
      hint.textContent = "SUBIR";
    } else if (atTop) {
      indicator.classList.remove("up");
      indicator.setAttribute("aria-label", "Bajar");
      hint.textContent = "BAJAR";
    } else {
      // En medio: por defecto baja
      indicator.classList.remove("up");
      indicator.setAttribute("aria-label", "Bajar");
      hint.textContent = "BAJAR";
    }
  }

  // Wheel handler con throttle + bloqueo
  container.addEventListener("wheel", (e) => {
    // Evita que trackpads hagan micro-scroll infinito
    const now = Date.now();
    if (isAnimating) { e.preventDefault(); return; }
    if (now - wheelLock < 250) { e.preventDefault(); return; }
    wheelLock = now;

    const delta = e.deltaY;
    const threshold = 12; // sensibilidad
    if (Math.abs(delta) < threshold) return;

    e.preventDefault();
    const dir = delta > 0 ? 1 : -1;
    scrollToIndex(currentIndex + dir);
  }, { passive: false });

  // Detecta sección visible al hacer scroll manual (scrollbar/touch)
  container.addEventListener("scroll", () => {
    if (isAnimating) return;
    const idx = getClosestIndex();
    if (idx !== currentIndex) {
      currentIndex = idx;
      updateUI();
    }
  }, { passive: true });

  // Click en nav
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const id = link.dataset.target;
      const idx = sections.findIndex(s => s.id === id);
      scrollToIndex(idx);
    });
  });

  // Flecha: si está en el final -> sube al inicio, si no -> baja a la siguiente
  indicator.addEventListener("click", () => {
    const atBottom = currentIndex >= sections.length - 1;
    if (atBottom) scrollToIndex(0);
    else scrollToIndex(currentIndex + 1);
  });

  // Soporte teclas
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "PageDown") scrollToIndex(currentIndex + 1);
    if (e.key === "ArrowUp" || e.key === "PageUp") scrollToIndex(currentIndex - 1);
    if (e.key === "Home") scrollToIndex(0);
    if (e.key === "End") scrollToIndex(sections.length - 1);
  });

  // Inicializa en la primera sección visible (por si abren con hash)
  const hash = location.hash?.replace("#", "");
  const hashIdx = sections.findIndex(s => s.id === hash);
  currentIndex = hashIdx >= 0 ? hashIdx : 0;
  updateUI();
  if (hashIdx >= 0) scrollToIndex(hashIdx);
})();
