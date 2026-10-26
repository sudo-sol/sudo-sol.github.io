(() => {
  "use strict";
  const root = document.documentElement;
  const themeButton = document.getElementById("theme-toggle");
  function setTheme(theme) {
    root.dataset.theme = theme;
    themeButton?.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} theme`);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#111510" : "#f2f1e9");
  }
  try {
    const saved = localStorage.getItem("sudo-sol-theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  } catch { /* Browser storage is optional. */ }
  themeButton?.addEventListener("click", () => {
    const theme = root.dataset.theme === "dark" ? "light" : "dark";
    setTheme(theme);
    try { localStorage.setItem("sudo-sol-theme", theme); } catch { /* Optional preference. */ }
  });

  const slider = document.getElementById("traffic-load");
  if (!slider) return;
  const buttons = [...document.querySelectorAll("[data-instance]")];
  function render() {
    const incoming = Number(slider.value);
    const online = buttons.filter(button => button.getAttribute("aria-pressed") === "true").length;
    const capacity = online * 40;
    const served = Math.min(incoming, capacity);
    const dropped = incoming - served;
    document.getElementById("incoming-value").textContent = String(incoming);
    document.getElementById("capacity-value").textContent = String(capacity);
    document.getElementById("served-value").textContent = `${Math.round(served / incoming * 100)}%`;
    document.getElementById("load-output").value = String(incoming);
    const status = document.getElementById("lab-status");
    status.classList.toggle("is-overloaded", dropped > 0);
    status.textContent = `${online} ${online === 1 ? "instance" : "instances"} online. ${dropped ? `${dropped} req/s exceed available capacity.` : "All requests served."}`;
    buttons.forEach(button => {
      const key = button.dataset.instance;
      const enabled = button.getAttribute("aria-pressed") === "true";
      button.querySelector("span").textContent = enabled ? "online" : "offline";
      button.setAttribute("aria-label", `Instance ${key.toUpperCase()}: ${enabled ? "online; take offline" : "offline; bring online"}`);
      document.querySelector(`[data-node="${key}"]`).classList.toggle("offline", !enabled);
      document.querySelector(`[data-route="${key}"]`).classList.toggle("offline", !enabled);
    });
  }
  buttons.forEach(button => button.addEventListener("click", () => {
    button.setAttribute("aria-pressed", String(button.getAttribute("aria-pressed") !== "true"));
    render();
  }));
  slider.addEventListener("input", render);
  render();
})();
