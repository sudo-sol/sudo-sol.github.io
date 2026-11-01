const h = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const typing = target => target?.closest?.("input, textarea, select, [contenteditable]");

  // ---------- toast ----------
  const toastEl = h("div", "toast");
  toastEl.setAttribute("role", "status");
  toastEl.setAttribute("aria-live", "polite");
  document.body.append(toastEl);
  let toastTimer = 0;
  const toast = msg => {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3600);
  };
