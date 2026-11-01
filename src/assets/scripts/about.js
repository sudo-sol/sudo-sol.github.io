function initAbout() {
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


}
