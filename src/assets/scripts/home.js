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
    build?.classList.remove('solar-grow');
    broken?.classList.remove('signal');
  }
  function pulseBuild() {
    if (!build || motion.matches || document.documentElement.dataset.theme !== 'light') return;
    clearEffect();
    // Restart the finite fill on repeated pointer or keyboard entry.
    void build.offsetWidth;
    build.classList.add('solar-grow');
    effectTimer = setTimeout(() => build.classList.remove('solar-grow'), 1250);
  }
  function pulseBreak() {
    if (!broken || motion.matches || document.documentElement.dataset.theme !== 'cyber') return;
    clearEffect();
    broken.classList.add('signal');
    effectTimer = setTimeout(() => broken.classList.remove('signal'), 380);
  }
  function activate(theme, initial = false) {
    clearEffect();
    if (motion.matches) return;
    if (theme === 'light' && build) {
      pulseBuild();
    } else if (theme === 'cyber' && !initial) pulseBreak();
  }
  build?.addEventListener('pointerenter', pulseBuild);
  build?.addEventListener('focus', pulseBuild);
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
