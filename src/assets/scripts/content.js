function initContent() {
  // ---------- workbench / notes: filter chips built from data-* (data-filter="#list", data-filter-key="status|tags") ----------
  document.querySelectorAll("[data-filter]").forEach(bar => {
    const scope = document.querySelector(bar.dataset.filter);
    const key = bar.dataset.filterKey;
    if (!scope || !key) return;
    const items = [...scope.querySelectorAll(`[data-${key}]`)];
    const valuesOf = el => el.dataset[key].split(/\s+/).filter(Boolean);
    const counts = new Map();
    items.forEach(el => valuesOf(el).forEach(v => counts.set(v, (counts.get(v) || 0) + 1)));
    if (counts.size < 2) return;
    const buttons = [["all", items.length], ...counts].map(([value, n]) => {
      const b = h("button", null, value);
      b.type = "button";
      b.value = value;
      b.append(h("span", null, String(n)));
      bar.append(b);
      return b;
    });
    const apply = value => {
      buttons.forEach(b => b.setAttribute("aria-pressed", String(b.value === value)));
      items.forEach(el => { el.hidden = value !== "all" && !valuesOf(el).includes(value); });
      scope.querySelectorAll("[data-filter-group]").forEach(g => { g.hidden = !g.querySelector(`[data-${key}]:not([hidden])`); });
    };
    buttons.forEach(b => b.addEventListener("click", () => apply(b.value)));
    apply("all");
    bar.hidden = false;
  });

  // ---------- notes: estimate read time from the post body ----------
  const readTime = document.querySelector("[data-read-time]");
  const postBody = document.querySelector(".post-body");
  if (readTime && postBody) {
    const words = postBody.textContent.trim().split(/\s+/).length;
    readTime.textContent = `${Math.max(1, Math.round(words / 225))} min read`;
  }


}
