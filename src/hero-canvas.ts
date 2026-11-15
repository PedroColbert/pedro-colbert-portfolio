// Fundo do hero: grade de pontos que ondula devagar e reage ao cursor (afasta e acende).
// Canvas 2D simples: leve, sem WebGL, e pausa quando o hero sai da tela.
export function heroCanvas(canvas: HTMLCanvasElement, reduced: boolean) {
  const ctx = canvas.getContext('2d')!;
  const mouse = { x: -9999, y: -9999 };
  let w = 0, h = 0, dpr = 1, visible = true, raf = 0;
  let ink = '#f3efe8', accent = '#ff5a36';
  const GAP = 30;

  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    ink = cs.getPropertyValue('--ink').trim() || ink;
    accent = cs.getPropertyValue('--accent').trim() || accent;
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio, 2);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(performance.now());
  }

  function draw(now: number) {
    const t = now / 1000;
    ctx.clearRect(0, 0, w, h);
    const R = 190; // raio de influência do cursor
    for (let y = GAP / 2; y < h; y += GAP) {
      for (let x = GAP / 2; x < w; x += GAP) {
        const wave = reduced ? 0 : Math.sin(x * 0.012 + t * 0.9) * Math.cos(y * 0.014 - t * 0.7);
        let px = x, py = y + wave * 3, size = 1.1 + wave * 0.45, near = 0;
        const dx = x - mouse.x, dy = y - mouse.y, d = Math.hypot(dx, dy);
        if (d < R) {
          near = 1 - d / R;
          const push = near * near * 22;
          px += (dx / (d || 1)) * push; py += (dy / (d || 1)) * push;
          size += near * 2.6;
        }
        ctx.globalAlpha = 0.16 + near * 0.84;
        ctx.fillStyle = near > 0.05 ? accent : ink;
        ctx.beginPath(); ctx.arc(px, py, Math.max(0.4, size), 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function loop(now: number) {
    raf = requestAnimationFrame(loop);
    if (visible && !document.hidden) draw(now);
  }

  addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    if (reduced) draw(performance.now());
  });
  addEventListener('resize', resize);
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);
  new MutationObserver(() => { readColors(); draw(performance.now()); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  readColors();
  resize();
  if (!reduced) raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}
