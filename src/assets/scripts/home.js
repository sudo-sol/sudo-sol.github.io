/* One owner for typing, the two theme-specific word effects and the source peek. */
function initHome() {
  const typed = document.getElementById('typed');
  const build = document.querySelector('.home-page .build-word');
  const broken = document.querySelector('.home-page .glitch');
  const source = document.querySelector('.source-peek');
  if (!typed && !build && !broken && !source) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let effectTimer;
  function clearEffect() {
    clearTimeout(effectTimer);
    broken?.classList.remove('signal');
  }
  const bloom = build ? initBuildBloom(build, motion) : null;
  function pulseBreak() {
    if (!broken || motion.matches || document.documentElement.dataset.theme !== 'cyber') return;
    clearEffect();
    broken.classList.add('signal');
    effectTimer = setTimeout(() => broken.classList.remove('signal'), 380);
  }
  function activate(theme, initial = false) {
    clearEffect();
    bloom?.refresh();
    if (!motion.matches && theme === 'cyber' && !initial) pulseBreak();
  }
  broken?.addEventListener('pointerenter', pulseBreak);
  broken?.addEventListener('focus', pulseBreak);
  document.addEventListener('sudo:themechange', event => activate(event.detail.theme));
  motion.addEventListener('change', () => activate(document.documentElement.dataset.theme, true));
  activate(document.documentElement.dataset.theme, true);
  if (typed) {
    if (motion.matches) typed.textContent = 'whoami';
    else {
      let i = 0;
      setTimeout(function type() {
        if (motion.matches) { typed.textContent = 'whoami'; return; }
        typed.textContent = 'whoami'.slice(0, ++i);
        if (i < 6) return setTimeout(type, 90 + Math.random() * 70);
        setTimeout(pulseBreak, 280);
      }, 500);
    }
  }
  source?.addEventListener('keydown', event => {
    if (event.key === 'Escape' && source.open) {
      source.open = false;
      source.querySelector('summary').focus();
      event.stopPropagation();
    }
  });
}


/* Adapted from the user's bloom reference: springy letters and proximity-grown leaves. */
function initBuildBloom(link, motion) {
  const text = link.textContent;
  const leaf = '<svg class="bloom-leaf" viewBox="0 0 24 26" aria-hidden="true"><path d="M12 25V15" stroke="#3b8f3a" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M12 16C6 15 2 10 3 3c6 1 10 6 9 13Z" fill="#5fb83c"/><path d="M12 16c6-1 10-6 9-13-6 1-10 6-9 13Z" fill="#8fcf3f"/></svg>';
  const letters = Array.from(text, character => {
    const ch = document.createElement('span');
    ch.className = 'bloom-char';
    ch.setAttribute('aria-hidden', 'true');
    ch.innerHTML = '<span class="bloom-glyph"></span>' + leaf;
    ch.firstChild.textContent = character;
    // The punctuation rests with the word but does not sprout.
    if (!/[a-z]/i.test(character)) ch.lastChild.remove();
    return { ch, glyph: ch.firstChild, leaf: ch.querySelector('svg'), p: 0, v: 0 };
  });
  link.replaceChildren(...letters.map(letter => letter.ch));
  let frameId = 0, mx = -9999, my = -9999, pointer = false, visible = true;
  let lastTime = 0;
  const enabled = () => document.documentElement.dataset.theme === 'light' && !motion.matches && !document.hidden && visible;
  function reset() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    lastTime = 0;
    letters.forEach(o => {
      o.p = o.v = 0;
      o.glyph.removeAttribute('style');
      o.leaf?.removeAttribute('style');
    });
  }
  function color(p) {
    p = Math.max(0, Math.min(1, p));
    const a = p < .5 ? [47,125,58] : [143,207,63];
    const b = p < .5 ? [143,207,63] : [245,184,28];
    const t = p < .5 ? p * 2 : (p - .5) * 2;
    return 'rgb(' + a.map((x, i) => Math.round(x + (b[i] - x) * t)).join(',') + ')';
  }
  function frame(time) {
    if (!enabled()) { reset(); return; }
    const step = Math.min(2, (time - (lastTime || time - 16.67)) / 16.67);
    lastTime = time;
    const fontSize = parseFloat(getComputedStyle(link).fontSize);
    const focused = document.activeElement === link;
    // Read stable character boxes before writing transforms on their inner glyphs.
    const boxes = letters.map(o => o.ch.getBoundingClientRect());
    letters.forEach((o, i) => {
      const r = boxes[i];
      const distance = Math.hypot(mx - r.left - r.width / 2, my - r.top - r.height / 2);
      let target = focused ? 1 : pointer ? Math.max(0, 1 - distance / 150) : 0;
      target = target * target * (3 - 2 * target);
      o.v += (target - o.p) * .15 * step;
      o.v *= Math.pow(.82, step);
      o.p += o.v * step;
      const p = o.p, calm = 1 - Math.min(1, Math.max(0, p));
      const lift = -.1 * fontSize * .88 * p;
      const idleY = Math.sin(time * .002 + i * .7) * 1.6 * calm;
      const rotation = Math.sin(time * .0017 + i) * 1.2 * calm;
      o.glyph.style.transform = `translateY(${lift + idleY}px) rotate(${rotation}deg) scale(${1 + .16 * .88 * p})`;
      o.glyph.style.color = color(p);
      if (o.leaf) {
        const scale = Math.min(1.25, .1 + .95 * Math.max(0, p));
        const sway = Math.sin(time * .003 + i) * 6 * (.3 + Math.min(1, Math.max(0, p)));
        o.leaf.style.transform = `translate(-50%, -72%) rotate(${sway}deg) scale(${scale})`;
      }
    });
    frameId = requestAnimationFrame(frame);
  }
  function refresh() {
    if (!enabled()) reset();
    else if (!frameId) frameId = requestAnimationFrame(frame);
  }
  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    mx = event.clientX; my = event.clientY; pointer = true;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer = false; });
  window.addEventListener('blur', () => { pointer = false; });
  document.addEventListener('visibilitychange', refresh);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; refresh(); }).observe(link);
  }
  return { refresh };
}
