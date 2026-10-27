/* sudo-sol shared terminal: one script, every page. See README → "The terminal".
   - A tmux-style bar is always pinned to the bottom of the page.
   - The terminal panel opens above that bar. It never blocks the page and never closes on its own.
     On the homepage, the panel is placed inline at [data-term-dock] instead.
   - Pages come from the header nav (one source of truth). Each page can tag its own
     openable things with data-term-item="name" (+ data-term-desc), and optionally set
     data-term-chips on <body>.
   - Output, history, and open/closed state persist across pages for this browser tab.
   - Everything is built with textContent; user input is never parsed as HTML.
   - Progressive enhancement: remove this script and the site still works with normal links. */
(() => {
  "use strict";
  const KEY = { hist: "sudo-sol-term-history", log: "sudo-sol-term-log", open: "sudo-sol-term-open", arrived: "sudo-sol-term-arrived" };
  const MAX_LOG = 150, MAX_HIST = 50;

  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* storage blocked: terminal still works, just forgets */ } },
    del(k) { try { sessionStorage.removeItem(k); } catch { /* ignore */ } },
    json(k) { try { return JSON.parse(this.get(k) || "null"); } catch { return null; } },
  };

  const cwd = (document.body.dataset.termCwd ?? location.pathname.replace(/index\.html$/, ""))
    .replace(/^\/+|\/+$/g, "").toLowerCase();
  const here = cwd ? "~/" + cwd : "~";

  // ---------- content ----------
  const HOME_URL = "/";
  const PAGES = {};
  for (const a of document.querySelectorAll("header nav a")) {
    PAGES[a.textContent.trim().toLowerCase()] = { url: a.dataset.termUrl || a.getAttribute("href"), desc: a.dataset.termDesc || "" };
  }
  const LINKS = {
    resume:   { url: null, label: "résumé (PDF)" }, // set url once the public PDF is in assets/
    contact:  { url: "/about/#contact", label: "contact form" },
    linkedin: { url: "https://www.linkedin.com/in/asriniva/", label: "LinkedIn", ext: true },
    github:   { url: "https://github.com/sudo-sol", label: "GitHub", ext: true },
    source:   { url: "https://github.com/sudo-sol/sudo-sol.github.io", label: "this site's source", ext: true },
  };
  const FILES = {
    "now.txt": [
      [["building  ", "m"], "this site, one project at a time"],
      [["learning  ", "m"], "Mandarin · app development · AI assistants + MCP"],
      [["focus     ", "m"], "SRE · platform · cloud networking · IaC"],
      [["playing   ", "m"], "Cyberpunk 2077 (again)"],
    ],
    "about.txt": [
      ["Engineer at heart. Infrastructure by day, personal projects after hours."],
      ["Makes complicated things simple, and leaves every system better than he found it."],
      [["→ more: ", "m"], ["man addy", "ok"]],
    ],
    "contact.txt": [
      ["Best way to reach me:"],
      [["  open contact   ", "ok"], ["the contact form", "m"]],
      [["  open linkedin  ", "ok"], ["LinkedIn", "m"]],
    ],
  };
  const items = [...document.querySelectorAll("[data-term-item]")].map(el => ({
    name: el.dataset.termItem.toLowerCase(),
    desc: el.dataset.termDesc || "",
    href: el.getAttribute("href") || (el.id ? "#" + el.id : ""),
  }));

  // ---------- DOM ----------
  const h = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const kbd = t => h("kbd", null, t);
  const inlineHost = document.querySelector("[data-term-dock]");

  const panel = h("section", "sterm-panel");
  panel.id = "sterm-panel";
  panel.setAttribute("aria-label", "Site terminal");
  const head = h("div", "sterm-head");
  head.setAttribute("aria-hidden", "true");
  head.append(h("i"), h("i"), h("i"), h("span", "title", "addy@sudo-sol: " + here));
  const screen = h("div", "sterm-screen");
  const log = h("div", "sterm-log");
  log.setAttribute("role", "log");
  log.setAttribute("aria-live", "polite");
  log.setAttribute("aria-label", "Terminal output");
  const form = h("form", "sterm-line");
  form.setAttribute("autocomplete", "off");
  const label = h("label");
  label.htmlFor = "sterm-input";
  label.setAttribute("aria-hidden", "true");
  label.append(h("span", "u", "addy@sudo-sol"), ":", h("span", "cwd", here), "$");
  const input = h("input");
  Object.assign(input, { id: "sterm-input", type: "text", spellcheck: false, autocomplete: "off" });
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("autocorrect", "off");
  input.setAttribute("enterkeyhint", "go");
  input.setAttribute("aria-label", "Terminal command. Type help for a list of commands.");
  form.append(label, input);
  screen.append(log, form);

  const chips = h("div", "sterm-chips");
  chips.setAttribute("aria-label", "Suggested commands");
  const tryLbl = h("span", null, "try:");
  tryLbl.setAttribute("aria-hidden", "true");
  chips.append(tryLbl);
  const pageChips = document.body.dataset.termChips?.split(",").map(c => c.trim()).filter(Boolean);
  const chipCmds = pageChips?.length ? pageChips
    : cwd ? ["ls", "cd ~", "help"]
    : ["help", "ls", "cd experience", "cat now.txt", "man addy", "neofetch"];
  for (const c of chipCmds) {
    const b = h("button", null, c);
    b.type = "button";
    b.addEventListener("click", () => exec(c));
    chips.append(b);
  }
  const hint = h("span", "hint");
  hint.append(kbd("Tab"), " completes · ", kbd("↑"), kbd("↓"), " history");
  if (!inlineHost) hint.append(" · ", kbd("Esc"), " hides");
  chips.append(hint);
  panel.append(head, screen, chips);

  // tmux bar: session, windows (= pages), toggle
  const bar = h("div", "sterm-bar");
  const wins = h("nav", "sterm-wins");
  wins.setAttribute("aria-label", "Pages");
  [["home", HOME_URL, ""], ...Object.entries(PAGES).map(([n, p]) => [n, p.url, n])].forEach(([name, url, path], i) => {
    const a = h("a", "sterm-w", `${i}:${name}`);
    a.href = url;
    if (path === cwd) a.setAttribute("aria-current", "page");
    wins.append(a);
  });
  const toggle = h("button", "sterm-toggle");
  toggle.type = "button";
  const right = h("span", "sterm-right");
  right.append(toggle, h("span", "sterm-up", "all systems nominal"));
  bar.append(h("span", "sterm-sess", "sudo-sol"), wins, right);

  const fixed = h("div", "sterm-fixed");
  if (inlineHost) { inlineHost.append(panel); fixed.append(bar); }
  else { toggle.setAttribute("aria-controls", panel.id); fixed.append(panel, bar); }
  document.body.append(fixed);
  // keep page content clear of the pinned bar/panel
  const pad = () => { document.body.style.paddingBottom = fixed.offsetHeight + "px"; };
  new ResizeObserver(pad).observe(fixed);

  // ---------- output (persisted so the terminal "follows" you) ----------
  const isPart = x => typeof x === "string" || (Array.isArray(x) && typeof x[0] === "string" && typeof x[1] === "string");
  let transcript = store.json(KEY.log);
  transcript = Array.isArray(transcript) ? transcript.filter(l => Array.isArray(l) && l.every(isPart)).slice(-MAX_LOG) : [];
  const render = parts => {
    const p = h("p", "l");
    for (const part of parts) p.append(typeof part === "string" ? part : h("span", part[1], part[0]));
    log.append(p);
  };
  const out = (...parts) => {
    render(parts);
    transcript.push(parts);
    if (transcript.length > MAX_LOG) transcript = transcript.slice(-MAX_LOG);
    store.set(KEY.log, JSON.stringify(transcript));
  };
  const clearLog = () => { log.replaceChildren(); transcript = []; store.del(KEY.log); };
  const echo = text => out(["addy@sudo-sol", "u"], ":", [here, "cwd"], "$ ", [text, "t"]);
  const scrollDown = () => { screen.scrollTop = screen.scrollHeight; };

  // ---------- paths ----------
  const norm = p => (p || "").trim().toLowerCase().replace(/^\.\//, "").replace(/(.)\/+$/, "$1");
  const dir = path => (path ? { kind: "dir", path, page: PAGES[path] || { url: "/" + path + "/" } } : { kind: "home" });
  const resolve = raw => {
    let p = norm(raw);
    if (!p || p === "~" || p === "/") return { kind: "home" };
    if (p === ".") return dir(cwd);
    if (p === "..") return dir(cwd.split("/").slice(0, -1).join("/"));
    const abs = /^~?\//.test(p);
    p = p.replace(/^~?\/+/, "");
    if (!abs) { const item = items.find(i => i.name === p); if (item) return { kind: "item", item }; }
    return PAGES[p] ? dir(p) : null;
  };

  // ---------- navigation ----------
  const go = (label, url, ext) => {
    if (!url) return out([label + " isn't published yet. try ", "m"], ["open linkedin", "ok"]);
    out(["→ ", "ok"], `opening ${label} …`);
    if (ext) return void window.open(url, "_blank", "noopener");
    store.set(KEY.arrived, "1");
    setTimeout(() => location.assign(url), reduce ? 0 : 250);
  };
  const openItem = it => {
    out(["→ ", "ok"], `opening ${it.name} …`);
    if (!it.href.startsWith("#")) return go(it.name, it.href);
    const target = document.getElementById(it.href.slice(1));
    if (target instanceof HTMLDetailsElement) target.open = true;
    target?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", it.href);
  };

  // ---------- commands ----------
  const listPage = (name, desc) => out(["  " + (name + "/").padEnd(16), "d"], ["  " + desc, "m"]);
  const listItem = it => out(["  " + it.name.padEnd(16), "f"], ["  " + it.desc, "m"]);
  const COMMANDS = {
    help: { desc: "show this list", run() {
      out(["available commands:", "m"]);
      for (const [name, c] of Object.entries(COMMANDS)) if (!c.hidden) out(["  " + name.padEnd(10), "ok"], c.desc);
      out(["tip: this terminal follows you to every page. press / anywhere. a few commands are hidden… 👀", "m"]);
    } },
    ls: { desc: "what's here", run(args) {
      const t = args.find(a => !a.startsWith("-"));
      const r = t ? resolve(t) : dir(cwd);
      if (!r) return out(["ls: cannot access '" + t + "': No such file or directory", "e"]);
      if (r.kind === "item") return listItem(r.item);
      if (r.kind === "home") {
        Object.entries(PAGES).forEach(([n, p]) => listPage(n, p.desc));
        return out("  ", ...Object.keys(FILES).flatMap(f => [f, "   "]), LINKS.resume.url ? "resume.pdf" : "");
      }
      if (r.path !== cwd) return out(["  ", "m"], ["cd " + r.path, "ok"], [" to see what's inside", "m"]);
      if (!items.length) return out(["  (nothing to open on this page yet)", "m"]);
      items.forEach(listItem);
      out(["  open one with ", "m"], ["open <name>", "ok"]);
    } },
    cd: { desc: "go to a page (cd about, cd ~)", run([t]) {
      const r = resolve(t);
      if (!r) {
        if (FILES[norm(t)] || norm(t) === "resume.pdf") return out(["cd: not a directory: " + t, "e"]);
        return out(["cd: no such page: " + t, "e"], ["  (try ", "m"], ["ls ~", "ok"], [")", "m"]);
      }
      if (r.kind === "item") return out(["cd: " + t + " is a section on this page. try ", "m"], ["open " + r.item.name, "ok"]);
      if (r.kind === "home") return cwd ? go("~", HOME_URL) : out(["you're already home.", "m"]);
      if (r.path === cwd) return out(["you're already in " + here, "m"]);
      go("~/" + r.path + "/", r.page.url);
    } },
    open: { desc: "open something (open resume)", run([t]) {
      const n = norm(t);
      if (!n) return out(["usage: open <name>   (ls shows what's here)", "m"]);
      const r = resolve(t);
      if (r?.kind === "item") return openItem(r.item);
      if (LINKS[n]) return go(LINKS[n].label, LINKS[n].url, LINKS[n].ext);
      if (n === "resume.pdf") return go(LINKS.resume.label, LINKS.resume.url);
      if (r) return COMMANDS.cd.run([t]);
      out(["open: nothing called '" + t + "' here. try ", "e"], ["ls", "ok"]);
    } },
    cat: { desc: "read a file (cat now.txt)", run([t]) {
      const n = norm(t);
      if (!n) return out(["usage: cat <file>   (try: cat now.txt)", "m"]);
      if (FILES[n]) return FILES[n].forEach(line => out(...line));
      if (n === "resume.pdf" && LINKS.resume.url) return out(["cat: resume.pdf: binary file. try ", "m"], ["open resume", "ok"]);
      const r = resolve(n);
      if (r?.kind === "item") return out(["cat: that's a section. try ", "m"], ["open " + r.item.name, "ok"]);
      if (r) return out(["cat: " + t + ": is a page. try ", "m"], ["cd " + n, "ok"]);
      out(["cat: " + t + ": No such file or directory", "e"]);
    } },
    man: { desc: "the manual (man addy)", run([page]) {
      if (norm(page) !== "addy") return out(["what manual page do you want? try ", "m"], ["man addy", "ok"]);
      if (cwd !== "about") return go("man addy", PAGES.about?.url || "/about/");
      out(["you're reading it. 😉", "m"]);
      scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    } },
    whoami: { desc: "who's this?", run() { out("addy  ", ["reliability · platforms · cloud infrastructure", "m"]); } },
    neofetch: { desc: "system info, but it's me", run() {
      const art = ["  +--------+ ", "  | >_     | ", "  |        | ", "  +--------+ ", "", "", "", ""];
      [
        [["addy", "u"], "@", ["sudo-sol", "u"]],
        ["-------------"],
        [["role     ", "w"], "Staff SRE · platform engineer"],
        [["uptime   ", "w"], "9+ years"],
        [["stack    ", "w"], "AWS · Azure · Terraform · Linux"],
        [["shell    ", "w"], "curiosity"],
        [["theme    ", "w"], root.dataset.theme],
        [["off-duty ", "w"], "archery · boxing · Cyberpunk 2077"],
      ].forEach((parts, i) => out([art[i], "d art"], ...parts));
    } },
    theme: { desc: "theme [dark|light|cyber]", run([to]) {
      const themes = window.sudoTheme?.list || ["dark", "light"];
      if (to && !themes.includes(to)) return out(["theme: pick one of " + themes.join(", "), "e"]);
      const now = to ? window.sudoTheme?.set(to) : window.sudoTheme?.cycle();
      if (!now) root.dataset.theme = to || (root.dataset.theme === "dark" ? "light" : "dark");
      out("theme → ", [root.dataset.theme, "ok"], root.dataset.theme === "cyber" ? ["   wake up, samurai. 🌆", "m"] : "");
    } },
    history: { desc: "what you've typed", run() { hist.forEach((c, i) => out(["  " + String(i + 1).padStart(3) + "  ", "m"], c)); } },
    clear: { desc: "clear the screen", run() { clearLog(); } },
    exit: { desc: "hide the terminal", run() {
      if (inlineHost) return out(["this one lives on the homepage. it stays. 😄", "m"]);
      setOpen(false);
      toggle.focus();
    } },
    pwd: { hidden: true, run() { out(here); } },
    systemctl: { hidden: true, run([action, unit]) {
      if (action !== "status" || unit !== "addy") return out(["usage: systemctl status addy", "m"]);
      out(["● ", "ok"], "addy.service: curious by default");
      out("   Active: ", ["active (running)", "ok"]);
    } },
    echo: { hidden: true, run(args) { out(args.join(" ")); } },
    date: { hidden: true, run() { out(new Date().toString()); } },
    sudo: { hidden: true, run() { out(["addy is not in the sudoers file. This incident will be reported. 👀", "w"]); } },
    rm: { hidden: true, run(args) { out([args.some(a => /^-\w*r/i.test(a)) ? "rm: refusing. this site is load-bearing. 😄" : "rm: permission denied", "w"]); } },
    vim: { hidden: true, run() { out(["you are now trapped in vim. kidding. ", "m"], [":q!", "ok"]); } },
  };

  // ---------- input ----------
  let hist = store.json(KEY.hist);
  hist = Array.isArray(hist) ? hist.filter(x => typeof x === "string").slice(-MAX_HIST) : [];
  let hi = hist.length;

  function exec(raw, record = true) {
    const text = raw.trim();
    echo(text);
    if (text) {
      if (record) { hist = [...hist, text].slice(-MAX_HIST); hi = hist.length; store.set(KEY.hist, JSON.stringify(hist)); }
      const [name, ...args] = text.split(/\s+/);
      const c = Object.hasOwn(COMMANDS, name.toLowerCase()) ? COMMANDS[name.toLowerCase()] : null;
      if (c) c.run(args);
      else out(["command not found: " + name + ". try ", "e"], ["help", "ok"]);
    }
    scrollDown();
  }

  const complete = value => {
    const parts = value.split(/\s+/);
    const prefix = parts.slice(0, -1).join(" ");
    let cur = parts[parts.length - 1].toLowerCase(), pool;
    if (parts.length === 1) pool = Object.keys(COMMANDS).filter(c => !COMMANDS[c].hidden);
    else {
      const c = parts[0].toLowerCase(), pages = Object.keys(PAGES), names = items.map(i => i.name);
      cur = norm(cur);
      pool = c === "cat" ? Object.keys(FILES)
        : c === "man" ? ["addy"]
        : c === "theme" ? (window.sudoTheme?.list || ["dark", "light"])
        : c === "open" ? [...names, ...Object.keys(LINKS), ...pages]
        : c === "ls" ? [...names, ...pages]
        : pages;
    }
    const opts = [...new Set(pool)].filter(o => o.startsWith(cur));
    if (opts.length === 1) input.value = (prefix ? prefix + " " : "") + opts[0] + (parts.length === 1 ? " " : "");
    else if (opts.length > 1) { echo(value); out(["  " + opts.join("   "), "m"]); scrollDown(); }
  };

  form.addEventListener("submit", e => { e.preventDefault(); exec(input.value); input.value = ""; });
  input.addEventListener("keydown", e => {
    if (e.key === "Tab" && input.value.trim()) { e.preventDefault(); complete(input.value); }
    else if (e.key === "ArrowUp" && hist.length) { e.preventDefault(); hi = Math.max(0, hi - 1); input.value = hist[hi]; }
    else if (e.key === "ArrowDown" && hist.length) { e.preventDefault(); hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ""; }
    else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); clearLog(); }
    else if (e.key === "Escape") {
      e.preventDefault();
      if (inlineHost) return input.blur();
      setOpen(false);
      toggle.focus({ preventScroll: true });
    }
  });
  screen.addEventListener("click", () => { if (!getSelection().toString()) input.focus({ preventScroll: true }); });

  // ---------- open / hide ----------
  let isOpen = false;
  function setOpen(v, { focus = false } = {}) {
    if (inlineHost) {
      if (v && focus) { inlineHost.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }); input.focus({ preventScroll: true }); }
      return;
    }
    isOpen = v;
    panel.hidden = !v;
    toggle.setAttribute("aria-expanded", String(v));
    toggle.replaceChildren(...(v ? ["▾ hide", kbd("/")] : [">_ terminal", kbd("/")]));
    store.set(KEY.open, v ? "1" : "0");
    if (v) { scrollDown(); if (focus) input.focus({ preventScroll: true }); }
  }
  if (inlineHost) toggle.replaceChildren(">_ terminal", kbd("/"));
  toggle.addEventListener("click", () => (inlineHost ? setOpen(true, { focus: true }) : setOpen(!isOpen, { focus: !isOpen })));
  document.querySelectorAll("[data-term-open]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); setOpen(true, { focus: true }); }));
  addEventListener("keydown", e => {
    if (e.key === "Escape" && isOpen && !inlineHost && !document.querySelector("dialog[open]")
        && !e.target.closest?.("textarea, select, [contenteditable], input:not(#sterm-input)")) {
      setOpen(false);
      return;
    }
    if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest?.("input, textarea, select, [contenteditable]") || document.querySelector("dialog[open]")) return;
    e.preventDefault();
    // "/" toggles: open + focus when hidden, hide when shown (inline home terminal can't hide, so it just focuses)
    if (isOpen && !inlineHost) setOpen(false);
    else setOpen(true, { focus: true });
  });

  // ---------- boot ----------
  const arrived = store.get(KEY.arrived) === "1";
  store.del(KEY.arrived);
  transcript.forEach(render);
  if (!transcript.length) {
    out(["Welcome to sudo-sol v0.1, a small corner of the internet.", "t"]);
    out(["Last login: " + new Date().toDateString() + " from your browser", "m"]);
    out("");
    exec("systemctl status addy", false);
    exec("cat now.txt", false);
    out(["type ", "m"], ["help", "ok"], [" to look around. I follow you to every page: press ", "m"], ["/", "ok"], [" anywhere.", "m"]);
  } else if (arrived) {
    out(["→ ", "ok"], "arrived at ", [here, "cwd"], ["   (ls to see what's here)", "m"]);
  }
  const pref = store.get(KEY.open);
  setOpen(arrived || pref === "1", { focus: arrived && !inlineHost });
  scrollDown();

  window.sudoTerm = { exec, open: () => setOpen(true, { focus: true }), hide: () => setOpen(false) };
})();
