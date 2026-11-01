function initNavigation() {
  // ---------- keyboard shortcuts (never while typing in a field) ----------
  const destinations = [...document.querySelectorAll('[data-nav-key]')];
  const GO = Object.fromEntries(destinations.map(link => [link.dataset.navKey, link.getAttribute('href')]));
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
  destinations.forEach(link => row(['g', link.dataset.navKey], link.dataset.navLabel || link.textContent.trim()));
  row(["t"], "switch theme (solarpunk · cyberpunk)");
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


}
