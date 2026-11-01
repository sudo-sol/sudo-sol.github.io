/* Two visible choices: light/Solarpunk and cyber/Cyberpunk. Applied before paint. */
(() => {
  'use strict';
  const KEY = 'sudo-sol-theme';
  const THEMES = ['light', 'cyber'];
  const root = document.documentElement;
  const aliases = new Map([['light', 'light'], ['solar', 'light'], ['solarpunk', 'light'], ['cyber', 'cyber'], ['cyberpunk', 'cyber']]);
  const resolve = value => aliases.get(String(value || '').toLowerCase());
  const META = {light: '#f2f1e9', cyber: '#05060d'};
  let saved;
  try { saved = localStorage.getItem(KEY); } catch {}
  // An old Dark preference intentionally migrates to Solarpunk.
  const requested = new URLSearchParams(location.search).get('theme');
  root.dataset.theme = resolve(requested) || resolve(saved) || 'light';
  const sync = (theme, animate) => {
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      const selected = button.dataset.themeChoice === theme;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.remove('is-switching');
      if (selected && animate) {
        button.classList.add('is-switching');
        setTimeout(() => button.classList.remove('is-switching'), 650);
      }
    });
  };
  const set = (value, {animate = true} = {}) => {
    const theme = resolve(value);
    if (!theme) return root.dataset.theme;
    const previous = root.dataset.theme;
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META[theme]);
    try { localStorage.setItem(KEY, theme); } catch {}
    const url = new URL(location.href);
    if (url.searchParams.has('theme')) {
      url.searchParams.set('theme', theme);
      history.replaceState(null, '', url);
    }
    sync(theme, animate && previous !== theme);
    if (previous !== theme) document.dispatchEvent(new CustomEvent('sudo:themechange', {detail: {theme, previous}}));
    return theme;
  };
  const cycle = () => set(root.dataset.theme === 'light' ? 'cyber' : 'light');
  window.sudoTheme = {set, cycle, resolve, get: () => root.dataset.theme, list: THEMES};
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.addEventListener('click', () => set(button.dataset.themeChoice));
      button.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const choices = [...button.closest('.theme-picker').querySelectorAll('[data-theme-choice]')];
        const next = event.key === 'Home' ? choices[0]
          : event.key === 'End' ? choices[1]
          : choices[(choices.indexOf(button) + 1) % choices.length];
        next.focus();
        set(next.dataset.themeChoice);
      });
    });
    set(root.dataset.theme, {animate: false});
  });
})();
