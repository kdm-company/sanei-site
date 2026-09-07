(() => {
  'use strict';
  const hero = document.querySelector('.pageHero');
  if (!hero) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'barrelMotion';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  hero.prepend(canvas);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = { x: 0, y: 0, active: false };
  let width = 0, height = 0, particles = [], frame = 0, last = 0;
  let visible = true;
  const random = (min, max) => min + Math.random() * (max - min);

  function resize() {
    width = hero.clientWidth;
    height = hero.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles = Array.from({ length: Math.min(100, Math.max(36, Math.round(width * height / 5800))) }, (_, i) => ({
      x: random(0, width), y: random(0, height), vx: 0, vy: 0,
      size: random(5, 12), angle: random(0, Math.PI * 2),
      spin: random(-0.25, 0.25), type: i % 5,
      depth: random(0.45, 1), shine: 0
    }));
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      // Keep the original white headings readable; the flow is stronger on the right.
      ctx.globalAlpha = p.depth * (0.17 + 0.38 * p.x / width);
      const r = p.size;
      const metal = p.type === 0;
      const gradient = ctx.createLinearGradient(-r, -r, r, r);
      gradient.addColorStop(0, metal ? '#ffffff' : '#d1e3f4');
      gradient.addColorStop(0.45, metal ? '#a6c3dd' : '#8aafd0');
      gradient.addColorStop(1, metal ? '#527ba3' : '#527fa8');
      ctx.fillStyle = gradient;
      ctx.strokeStyle = '#d8ebff';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      if (metal) {
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.arc(0, 0, r * 0.48, 0, Math.PI * 2, true);
      } else if (p.type % 2) {
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.88, r * 0.65);
        ctx.quadraticCurveTo(0, r, -r * 0.88, r * 0.65);
        ctx.closePath();
      } else {
        ctx.ellipse(0, 0, r, r * 0.67, 0, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();
      if (p.shine > 0) {
        // A short surface glint at contact, never a spark or flash.
        ctx.globalAlpha = p.shine * 0.42;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, -r * 0.35);
        ctx.lineTo(r * 0.35, -r * 0.6);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function tick(now) {
    frame = 0;
    const dt = Math.min((now - (last || now)) / 1000, 0.04);
    last = now;
    for (const p of particles) {
      const dx = p.x - width * 0.68;
      const dy = p.y - height * 0.5;
      let vx = -dy * 0.07;
      let vy = dx * 0.025;
      if (pointer.active) {
        const px = p.x - pointer.x, py = p.y - pointer.y;
        const distance = Math.hypot(px, py);
        const influence = Math.max(0, 1 - distance / 200);
        vx += (-py * 1.3 - px * 0.28) * influence;
        vy += (px * 1.3 - py * 0.28) * influence;
      }
      const easing = 1 - Math.exp(-dt * 2.8);
      p.vx += (vx - p.vx) * easing;
      p.vy += (vy - p.vy) * easing;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += (p.spin + Math.hypot(p.vx, p.vy) * 0.007) * dt;
      p.shine = Math.max(0, p.shine - dt * 1.8);
      const margin = 20;
      if (p.x < -margin) p.x = width + margin;
      if (p.x > width + margin) p.x = -margin;
      if (p.y < -margin) p.y = height + margin;
      if (p.y > height + margin) p.y = -margin;
    }
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);
        const limit = (a.size + b.size) * 0.8;
        if (distance > 0 && distance < limit) {
          const shift = (limit - distance) * 0.5;
          a.x -= dx / distance * shift;
          a.y -= dy / distance * shift;
          b.x += dx / distance * shift;
          b.y += dy / distance * shift;
          a.shine = b.shine = 0.85;
        }
      }
    }
    draw();
    if (visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
  }

  function updatePlayback() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    if (visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
    else draw();
  }
  hero.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || reduced.matches) return;
    const rect = hero.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer.active = false; });
  hero.addEventListener('pointercancel', () => { pointer.active = false; });
  document.addEventListener('visibilitychange', updatePlayback);
  reduced.addEventListener('change', updatePlayback);
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible) pointer.active = false;
    updatePlayback();
  }).observe(hero);
  resize();
  updatePlayback();
})();
