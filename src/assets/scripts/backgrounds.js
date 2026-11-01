/* One optional canvas for the shared Cyberpunk background; CSS owns its settings. */
function initBackgrounds() {
  const root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const contrast = matchMedia('(forced-colors: active)');
  let canvas, context, frameId = 0, previous = 0, width = 0, height = 0;
  let grid, speed, tail, opacity, rgb, trails = [];
  const allowed = () => root.dataset.theme === 'cyber' && !motion.matches && !contrast.matches && !document.hidden;
  const random = count => Math.floor(Math.random() * count);
  function spawn() {
    // Start throughout the viewport so paths can cross both the centre and edges.
    const columns = Math.max(1, Math.floor(width / grid));
    const rows = Math.max(1, Math.floor(height / grid));
    const x = random(columns + 1) * grid;
    const y = random(rows + 1) * grid;
    const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][random(4)];
    return { x, y, dx, dy, remaining: grid, distance: 0, exitDistance: null, points: [{ x, y, distance: 0 }] };
  }
  function resize() {
    const style = getComputedStyle(root);
    const number = name => parseFloat(style.getPropertyValue(name));
    grid = Math.max(16, number('--cyber-grid-size'));
    speed = Math.max(1, number('--cyber-trail-speed'));
    tail = Math.max(grid, number('--cyber-trail-tail'));
    opacity = Math.max(0, Math.min(1, number('--cyber-trail-opacity')));
    rgb = style.getPropertyValue('--cyber-trail-rgb').trim();
    width = root.clientWidth;
    height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.lineWidth = 1.6;
    trails = Array.from({ length: Math.min(8, Math.max(1, number('--cyber-trail-count'))) }, spawn);
    previous = 0;
  }
  function advance(trail, amount) {
    while (amount > 0) {
      const step = Math.min(trail.remaining, amount);
      trail.x += trail.dx * step;
      trail.y += trail.dy * step;
      trail.distance += step;
      trail.remaining -= step;
      amount -= step;
      if (trail.remaining < .001) {
        // Turns happen only at grid intersections, never midway along a cell.
        if (trail.exitDistance === null && (trail.x < 0 || trail.x > width || trail.y < 0 || trail.y > height)) {
          trail.exitDistance = trail.distance;
        }
        // Let the visible tail finish fading after its head leaves the viewport.
        if (trail.exitDistance !== null && trail.distance - trail.exitDistance >= tail) {
          Object.assign(trail, spawn());
          return;
        }
        trail.points.push({ x: trail.x, y: trail.y, distance: trail.distance });
        if (trail.exitDistance === null && Math.random() < .28) {
          const sign = Math.random() < .5 ? 1 : -1;
          [trail.dx, trail.dy] = [-trail.dy * sign, trail.dx * sign];
        }
        trail.remaining = grid;
      }
    }
  }
  function draw(trail) {
    const firstDistance = trail.distance - tail;
    while (trail.points.length > 1 && trail.points[1].distance < firstDistance) trail.points.shift();
    const points = [...trail.points, { x: trail.x, y: trail.y, distance: trail.distance }];
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      const length = b.distance - a.distance;
      if (length <= 0) continue;
      const trim = Math.max(0, (firstDistance - a.distance) / length);
      if (trim >= 1) continue;
      const x = a.x + (b.x - a.x) * trim, y = a.y + (b.y - a.y) * trim;
      const fade = Math.max(0, Math.min(1, (b.distance - firstDistance) / tail));
      const alpha = opacity * fade;
      context.strokeStyle = `rgba(${rgb},${alpha})`;
      context.beginPath(); context.moveTo(x, y); context.lineTo(b.x, b.y); context.stroke();
    }
    context.fillStyle = `rgba(${rgb},${opacity})`;
    context.shadowColor = `rgba(${rgb},.7)`;
    context.shadowBlur = 8;
    context.beginPath(); context.arc(trail.x, trail.y, 1.8, 0, Math.PI * 2); context.fill();
    context.shadowBlur = 0;
  }
  function frame(time) {
    if (!allowed()) { refresh(); return; }
    // Render at most 30fps; motion uses elapsed seconds on high-refresh screens too.
    if (!previous || time - previous >= 1000 / 30) {
      const dt = previous ? Math.min((time - previous) / 1000, .1) : 0;
      previous = time;
      context.clearRect(0, 0, width, height);
      trails.forEach(trail => { advance(trail, speed * dt); draw(trail); });
    }
    frameId = requestAnimationFrame(frame);
  }
  function refresh() {
    if (!allowed()) {
      cancelAnimationFrame(frameId);
      frameId = 0;
      trails = [];
      if (canvas) { canvas.width = canvas.height = 0; }
      return;
    }
    if (frameId) return;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'theme-trails';
      canvas.setAttribute('aria-hidden', 'true');
      context = canvas.getContext('2d');
      if (!context) { canvas = null; return; }
      document.body.prepend(canvas);
    }
    resize();
    frameId = requestAnimationFrame(frame);
  }
  document.addEventListener('sudo:themechange', refresh);
  document.addEventListener('visibilitychange', refresh);
  motion.addEventListener('change', refresh);
  contrast.addEventListener('change', refresh);
  window.addEventListener('resize', () => { if (allowed() && canvas) resize(); }, { passive: true });
  refresh();
}
