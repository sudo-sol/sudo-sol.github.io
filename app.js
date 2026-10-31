(() => {
  "use strict";
  // Theme lives in /assets/theme.js and the terminal in /assets/term.js. This file holds page behaviour.
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
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

  // ---------- keyboard shortcuts (never while typing in a field) ----------
  // labs is hidden for now; restore `l: "/labs/"` and its row below to bring it back.
  const GO = { h: "/", e: "/experience/", w: "/workbench/", n: "/notes/", a: "/about/" };
  const dialog = h("dialog", "shortcuts");
  dialog.setAttribute("aria-label", "Keyboard shortcuts");
  dialog.append(h("h2", null, "KEYBOARD SHORTCUTS"));
  const row = (keys, label) => {
    const r = h("div", "row"), k = h("span");
    keys.forEach(key => k.append(h("kbd", null, key)));
    r.append(k, h("span", null, label));
    dialog.append(r);
  };
  row(["/"], "show / hide terminal");
  row(["g", "h"], "home");
  row(["g", "e"], "experience");
  row(["g", "w"], "workbench");
  // row(["g", "l"], "labs");
  row(["g", "n"], "notes");
  row(["g", "a"], "about");
  row(["t"], "switch theme (dark · light · cyber)");
  row(["?"], "this panel");
  const closeForm = h("form");
  closeForm.method = "dialog";
  closeForm.append(h("button", null, "esc"));
  dialog.append(closeForm);
  document.body.append(dialog);

  let buf = "", pendingG = false;
  addEventListener("keydown", e => {
    if (e.metaKey || e.ctrlKey || e.altKey || dialog.open || typing(e.target)) return;
    const k = e.key.toLowerCase();
    if (k.length !== 1) return;
    buf = (buf + k).slice(-4);
    if (buf === "sudo") { buf = ""; pendingG = false; return toast("addy is not in the sudoers file. This incident will be reported. 👀"); }
    if (e.key === "?") return dialog.showModal();
    if (pendingG) { pendingG = false; if (GO[k]) location.assign(GO[k]); return; }
    if (k === "g") { pendingG = true; return; }
    if (k === "t") window.sudoTheme?.cycle();
  });

  // ---------- home: typed whoami + one-time glitch ----------
  const typed = document.getElementById("typed");
  if (typed) {
    const glitch = document.querySelector(".glitch");
    if (reduce) typed.textContent = "whoami";
    else {
      let i = 0;
      setTimeout(function type() {
        typed.textContent = "whoami".slice(0, ++i);
        if (i < 6) return setTimeout(type, 90 + Math.random() * 70);
        setTimeout(() => {
          glitch?.classList.add("once");
          setTimeout(() => glitch?.classList.remove("once"), 450);
        }, 280);
      }, 500);
    }
  }

  // ---------- about: highlight the section being read ----------
  const tocLinks = [...document.querySelectorAll(".toc a")];
  if (tocLinks.length) {
    const secs = tocLinks.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
    const sync = () => {
      const line = Math.min(innerHeight * .3, 220);
      let cur = secs[0];
      for (const s of secs) if (s.getBoundingClientRect().top <= line) cur = s;
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = secs[secs.length - 1];
      tocLinks.forEach(a => a.classList.toggle("on", a.hash === "#" + cur.id));
    };
    addEventListener("scroll", sync, { passive: true });
    sync();
  }

  // ---------- contact form (Formspree once data-endpoint is set) ----------
  const form = document.getElementById("contact-form");
  if (form) {
    const status = document.getElementById("form-status");
    const send = form.querySelector("button[type=submit]");
    const need = { name: "your name", email: "a valid email", message: "a message" };
    const say = (msg, ok = false) => { status.textContent = msg; status.classList.toggle("ok", ok); };
    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (form.elements._gotcha.value) return;
      const bad = [...form.querySelectorAll("[required]")].find(f => !f.value.trim() || !f.checkValidity());
      if (bad) { bad.focus(); return say(`Please add ${need[bad.name]}.`); }
      const endpoint = form.dataset.endpoint;
      if (!endpoint) return say("The form isn't connected yet. Please reach me on LinkedIn for now.");
      send.disabled = true;
      say("Sending…", true);
      try {
        const res = await fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        say("Thanks! I'll get back to you soon.", true);
      } catch {
        say("That didn't go through. Please try again, or reach me on LinkedIn.");
      } finally {
        send.disabled = false;
      }
    });
  }

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

  // ---------- labs/traffic: capacity simulation ----------
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
