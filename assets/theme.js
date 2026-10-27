/* sudo-sol theme switcher: dark → light → cyber. Load in <head> so the saved theme applies before paint. */
(() => {
  "use strict";
  const KEY = "sudo-sol-theme", THEMES = ["dark", "light", "cyber"];
  const root = document.documentElement;
  const valid = t => THEMES.includes(t);
  const META = { dark: "#111510", light: "#f2f1e9", cyber: "#05060d" };
  const label = t => `Theme: ${t}. Switch to ${THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]}`;

  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch { /* storage blocked: default theme */ }
  if (valid(saved)) root.dataset.theme = saved;

  const set = t => {
    if (!valid(t)) return root.dataset.theme;
    root.dataset.theme = t;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META[t]);
    try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
    document.querySelectorAll("[data-theme-toggle]").forEach(b => { b.setAttribute("aria-label", label(t)); b.title = label(t); });
    return t;
  };
  const cycle = () => set(THEMES[(THEMES.indexOf(root.dataset.theme) + 1) % THEMES.length]);
  window.sudoTheme = { set, cycle, get: () => root.dataset.theme, list: THEMES };

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-theme-toggle]").forEach(b => b.addEventListener("click", cycle));
    set(root.dataset.theme);
  });
})();
