import '@fontsource-variable/bricolage-grotesque/wdth.css';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import Lenis from 'lenis';
import { heroCanvas } from './hero-canvas';
import { listenTo } from './beat';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

const $ = <T extends Element>(s: string, root: ParentNode = document) => root.querySelector<T>(s)!;
const $$ = <T extends Element>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const ease = 'expo.out';

// Só em desenvolvimento: acesso para testes automatizados
if (import.meta.env.DEV) Object.assign(window, { __gsap: gsap, __ST: ScrollTrigger });

// ---------- Rolagem suave (Lenis) sincronizada com o GSAP ----------
let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.11, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// ---------- Tema ----------
const themeBtn = $<HTMLButtonElement>('.theme');
function paintTheme() {
  const light = document.documentElement.dataset.theme === 'light';
  themeBtn.textContent = light ? 'Tema escuro' : 'Tema claro';
  themeBtn.setAttribute('aria-pressed', String(light));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#f3efe8' : '#0d0d0e');
}
themeBtn.addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  root.classList.add('no-transitions'); // a cor troca de uma vez, sem borrão
  root.dataset.theme = next;
  void root.offsetWidth;
  requestAnimationFrame(() => root.classList.remove('no-transitions'));
  try { localStorage.setItem('tema', next); } catch { /* sem armazenamento: vale só nesta visita */ }
  paintTheme();
});
paintTheme();

// ---------- Menu do celular ----------
const menuBtn = $<HTMLButtonElement>('.menu-btn');
const menu = $<HTMLElement>('#menu');
const menuOpen = () => !menu.hasAttribute('hidden');
function setMenu(open: boolean) {
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.textContent = open ? 'Fechar' : 'Menu';
  menu.toggleAttribute('hidden', !open);
  if (open) {
    lenis?.stop();
    if (!reduced) gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
    $<HTMLAnchorElement>('a', menu).focus();
  } else lenis?.start();
}
menuBtn.addEventListener('click', () => setMenu(!menuOpen()));
menu.addEventListener('click', (e) => { if ((e.target as Element).closest('a')) setMenu(false); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen()) { setMenu(false); menuBtn.focus(); } });
matchMedia('(min-width: 1001px)').addEventListener('change', (e) => { if (e.matches && menuOpen()) setMenu(false); });

// ---------- Hora de São Paulo ----------
const clock = $<HTMLElement>('[data-clock]');
const fmt = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
const tick = () => (clock.textContent = fmt.format(new Date()));
tick(); setInterval(tick, 15000);

// ---------- Fundo interativo do hero e efeitos do React Bits ----------
// Com WebGL 2 e movimento liberado, os efeitos do React Bits entram (carregados à parte,
// depois do primeiro desenho). Sem isso, fica a grade simples em canvas 2D.
const webgl2 = !!document.createElement('canvas').getContext('webgl2');
if (webgl2 && !reduced) {
  document.documentElement.classList.add('has-bits');
  import('./islands').then((m) => m.mountIslands());
} else {
  heroCanvas($<HTMLCanvasElement>('.hero__canvas'), reduced);
}

// ---------- Copiar e-mail ----------
const toast = $<HTMLElement>('.toast');
let toastTimer = 0;
function say(msg: string) {
  toast.textContent = msg; toast.classList.add('is-on');
  clearTimeout(toastTimer); toastTimer = window.setTimeout(() => toast.classList.remove('is-on'), 2200);
}
$$<HTMLButtonElement>('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy!); say('E-mail copiado'); }
  catch { say(b.dataset.copy!); }
}));

// ---------- Música de fundo ----------
// "Chill Day", de LAKEY INSPIRED (Creative Commons BY-SA; crédito no rodapé).
// A música já nasce ligada: o site tenta tocá-la assim que abre. Quando o navegador barra som
// automático (o padrão numa primeira visita), ela fica "armada" e começa no primeiro gesto da
// pessoa: clique, toque ou tecla. Entra baixinha e suave. O botão "Som" desliga e religa,
// e a escolha fica guardada para a próxima visita.
// O arquivo é WebM só de áudio (Opus); a extensão .weba faz o servidor entregá-lo como áudio.
const MUSIC = './audio/chill-day.weba';
const canPlayMusic = document.createElement('audio').canPlayType('audio/webm; codecs="opus"') !== '';
const VOLUME = 0.3;
const soundBtn = $<HTMLButtonElement>('.sound');
let music: HTMLAudioElement | null = null;
let soundWanted = true;   // o que a pessoa quer (ligada por padrão)
let soundPlaying = false; // o que o navegador já deixou acontecer
let soundAnnounced = false;
try { soundWanted = localStorage.getItem('som') !== 'off'; } catch { /* sem armazenamento: fica ligada */ }
function paintSound() {
  soundBtn.classList.toggle('is-on', soundWanted);
  soundBtn.classList.toggle('is-playing', soundPlaying);
  soundBtn.setAttribute('aria-pressed', String(soundWanted));
  soundBtn.setAttribute('aria-label', soundWanted ? 'Desligar a música de fundo' : 'Ligar a música de fundo');
}
async function startMusic() {
  if (soundPlaying || !soundWanted) return;
  if (!music) { music = new Audio(MUSIC); music.loop = true; music.volume = 0; }
  try { await music.play(); } catch { return; } // som automático barrado: continua armada, à espera de um gesto
  if (!soundWanted) { music.pause(); return; } // desligaram enquanto carregava
  soundPlaying = true;
  listenTo(music, VOLUME); // a esfera do hero passa a pulsar com a batida (mapa pré-calculado)
  gsap.to(music, { volume: VOLUME, duration: 1.6, ease: 'power1.out', overwrite: true });
  paintSound();
  if (!soundAnnounced) {
    soundAnnounced = true;
    say(matchMedia('(max-width: 700px)').matches ? 'Música ligada. O botão fica no alto.' : 'Música ligada. Para desligar, clique em “Som”.');
  }
}
function stopMusic() {
  soundPlaying = false;
  const m = music;
  if (m) gsap.to(m, { volume: 0, duration: 0.5, ease: 'power1.in', overwrite: true, onComplete: () => m.pause() });
  paintSound();
}
// Só mostra o botão (e o crédito) se o arquivo da música existir no site
// e se o navegador souber tocar esse formato (iPhones antigos não sabem: lá o site fica em silêncio)
fetch(MUSIC, { method: 'HEAD' }).then((r) => {
  if (!canPlayMusic || !r.ok || !(r.headers.get('content-type') ?? '').startsWith('audio')) return;
  soundBtn.hidden = false;
  $<HTMLElement>('.footer__music').hidden = false;
  paintSound();
  soundBtn.addEventListener('click', () => {
    // Armada mas ainda muda (o navegador barrou): o clique no botão é o gesto que faltava
    if (soundWanted && !soundPlaying) { startMusic(); return; }
    soundWanted = !soundWanted;
    try { localStorage.setItem('som', soundWanted ? 'on' : 'off'); } catch { /* vale só nesta visita */ }
    paintSound();
    if (soundWanted) startMusic(); else stopMusic();
  });
  // 1) Tenta tocar já, ao abrir. 2) Se o navegador barrar, toca no primeiro gesto da visita.
  const gestures = ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click'] as const;
  const onGesture = (e: Event) => {
    if (soundPlaying || !soundWanted) return;
    if ((e.target as Element | null)?.closest?.('.sound')) return; // o próprio botão cuida do clique
    startMusic();
  };
  gestures.forEach((g) => addEventListener(g, onGesture, { capture: true, passive: true }));
  startMusic();
  // Aba em segundo plano: a música espera
  document.addEventListener('visibilitychange', () => {
    if (!music || !soundPlaying) return;
    if (document.hidden) music.pause(); else music.play().catch(() => {});
  });
}).catch(() => { /* sem o arquivo, o site segue em silêncio */ });

// ---------- Navegação: esconde ao descer, volta ao subir, marca a seção atual ----------
const nav = $<HTMLElement>('.nav');
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate(self) {
    nav.classList.toggle('is-scrolled', self.scroll() > 40);
    nav.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > innerHeight * 0.6 && !menuOpen());
  },
});
$$<HTMLAnchorElement>('.nav__links a').forEach((a) => {
  const target = document.querySelector(a.getAttribute('href')!);
  if (!target) return;
  ScrollTrigger.create({ trigger: target, start: 'top 55%', end: 'bottom 55%', onToggle: (s) => a.classList.toggle('is-active', s.isActive) });
});
gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

// ---------- Cursor próprio, botões magnéticos e inclinação dos cards ----------
if (finePointer && !reduced) {
  const cursor = $<HTMLElement>('.cursor');
  const label = $<HTMLElement>('.cursor__label');
  const cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
  addEventListener('pointermove', (e) => { cursor.classList.add('is-on'); cx(e.clientX); cy(e.clientY); });
  document.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
  document.addEventListener('pointerover', (e) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-cursor], a, button');
    const kind = el?.dataset.cursor ?? (el ? 'link' : '');
    cursor.classList.toggle('is-link', kind === 'link');
    cursor.classList.toggle('is-view', kind === 'view');
    cursor.classList.toggle('is-zone', !!(e.target as Element).closest('#competencias, #projetos, #contato'));
    label.textContent = kind === 'view' ? 'role' : '';
  });

  $$<HTMLElement>('[data-magnetic]').forEach((el) => {
    const mx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    const my = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      mx((e.clientX - (r.left + r.width / 2)) * 0.35); my((e.clientY - (r.top + r.height / 2)) * 0.45);
    });
    el.addEventListener('pointerleave', () => { mx(0); my(0); });
  });

  $$<HTMLElement>('.project').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 7}deg`);
      card.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - 0.5) * -7}deg`);
      card.style.setProperty('--mx', `${e.clientX - r.left}px`); card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
    card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
  });
}

// ---------- Animações ----------
const mm = gsap.matchMedia();
mm.add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 701px)' }, (ctx) => {
  const { motion, desktop } = ctx.conditions as { motion: boolean; desktop: boolean };
  if (!motion) return; // movimento reduzido: tudo visível e parado

  // Entrada do hero: o nome sobe letra por letra; o resto acompanha em onda curta
  const intro = gsap.timeline({ defaults: { ease } });
  let heroChars: HTMLElement[] = [];
  SplitText.create('.hero__title', {
    type: 'lines, chars', linesClass: 'line', autoSplit: true,
    onSplit(self) {
      heroChars = self.chars as HTMLElement[];
      const t = gsap.from(self.chars, { yPercent: 115, duration: 1, ease, stagger: { each: 0.035, ease: 'power1.in' } });
      intro.add(t, 0.1);
      return t;
    },
  });
  intro.from(['.hero__canvas', '.hero__bits'], { autoAlpha: 0, duration: 1.4, ease: 'power1.out' }, 0);
  intro.from(['.hero__top', '.nav'], { autoAlpha: 0, duration: 0.6, ease: 'power1.out' }, 0.5);
  intro.from('.hero__bottom > *', { autoAlpha: 0, y: 24, duration: 0.8, stagger: { each: 0.09, ease: 'power1.in' } }, 0.55);
  intro.from('.hero__scroll', { autoAlpha: 0, duration: 0.5 }, 1.1);

  // Hero: o nome reage ao cursor. A fonte é variável: as letras próximas alargam e pegam a cor de destaque.
  if (finePointer) {
    const hero = $<HTMLElement>('.hero');
    const p = { x: -9999, y: -9999 };
    const level = new WeakMap<HTMLElement, number>();
    hero.addEventListener('pointermove', (e) => { p.x = e.clientX; p.y = e.clientY; });
    hero.addEventListener('pointerleave', () => { p.x = p.y = -9999; });
    addEventListener('blur', () => { p.x = p.y = -9999; });
    gsap.ticker.add(() => {
      if (!heroChars.length || scrollY > innerHeight) return;
      const reach = innerWidth * 0.2;
      const rects = heroChars.map((c) => c.getBoundingClientRect()); // lê tudo antes de escrever
      heroChars.forEach((c, i) => {
        const r = rects[i];
        const d = Math.hypot(p.x - (r.left + r.width / 2), p.y - (r.top + r.height / 2));
        const target = Math.max(0, 1 - d / reach);
        const now = level.get(c) ?? 0;
        if (target === 0 && now < 0.002) { if (now !== 0) { level.set(c, 0); c.style.fontVariationSettings = ''; c.style.color = ''; } return; }
        const v = now + (target - now) * 0.14;
        level.set(c, v);
        c.style.fontVariationSettings = `'wdth' ${(82 + v * 18).toFixed(2)}`;
        c.style.color = `color-mix(in srgb, var(--accent) ${Math.round(v * 100)}%, var(--ink))`;
      });
    });
  }

  // Hero: o nome se afasta devagar enquanto a página sobe (profundidade)
  gsap.to('.hero__title', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to(['.hero__canvas', '.hero__bits'], { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  gsap.to('.hero__ball', { yPercent: 22, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Cabeçalhos de seção: a linha "desenha" da esquerda para a direita
  $$('.section__head').forEach((head) => {
    gsap.from(head, { clipPath: 'inset(0 100% 0 0)', duration: 1.1, ease, scrollTrigger: { trigger: head, start: 'top 88%', once: true } });
  });

  // Perfil: o texto acende palavra por palavra no ritmo da rolagem
  SplitText.create('[data-words]', {
    type: 'words', autoSplit: true,
    onSplit(self) {
      return gsap.fromTo(self.words, { opacity: 0.14 }, {
        opacity: 1, ease: 'none', stagger: 0.05,
        scrollTrigger: { trigger: '[data-words]', start: 'top 82%', end: 'bottom 50%', scrub: 0.5 },
      });
    },
  });

  // Blocos simples: surgem em grupo ao entrar na tela
  // (set + to, nunca from: se o lote dispara duas vezes, um "from" tomaria o estado invisível como destino)
  gsap.set('[data-reveal]', { autoAlpha: 0, y: 36 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%', once: true,
    onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.9, ease, stagger: { each: 0.08, ease: 'power1.in' }, overwrite: true }),
  });

  // Letreiros: correm sozinhos e aceleram com a velocidade da rolagem
  $$<HTMLElement>('[data-marquee]').forEach((row) => {
    row.innerHTML += row.innerHTML; // duplica para o laço ficar contínuo
    const dir = Number(row.dataset.marquee);
    let x = dir > 0 ? 0 : -row.scrollWidth / 2;
    const half = () => row.scrollWidth / 2;
    gsap.ticker.add((_t, delta) => {
      const boost = Math.abs(lenis?.velocity ?? 0) * 0.9;
      x -= dir * (0.06 * delta + boost);
      if (x <= -half()) x += half();
      if (x > 0) x -= half();
      row.style.transform = `translate3d(${x}px,0,0)`;
    });
  });

  // Experiência: a linha do tempo se preenche, o ponto acende e o ano grande acompanha
  gsap.to('.xp__list', { '--line-p': 1, ease: 'none', scrollTrigger: { trigger: '.xp__list', start: 'top 60%', end: 'bottom 60%', scrub: 0.4 } });
  const yearEl = $<HTMLElement>('[data-year]');
  const setYear = (y: string) => {
    if (yearEl.textContent === y) return;
    gsap.timeline()
      .to(yearEl, { yPercent: -18, autoAlpha: 0, duration: 0.18, ease: 'power2.in' })
      .call(() => { yearEl.textContent = y; })
      .fromTo(yearEl, { yPercent: 18 }, { yPercent: 0, autoAlpha: 1, duration: 0.45, ease });
  };
  $$<HTMLElement>('.job').forEach((job) => {
    ScrollTrigger.create({
      trigger: job, start: 'top 60%', end: 'bottom 60%',
      onToggle(self) { job.classList.toggle('is-active', self.isActive); if (self.isActive) setYear(job.dataset.yearValue!); },
    });
    gsap.from(job, { autoAlpha: 0, x: desktop ? 40 : 0, y: desktop ? 0 : 24, duration: 0.9, ease, scrollTrigger: { trigger: job, start: 'top 85%', once: true } });
  });

  // Projetos: no desktop a seção prende e os cards correm na horizontal
  const track = $<HTMLElement>('.projects__track');
  const indexEl = $<HTMLElement>('[data-proj-index]');
  const cards = $$<HTMLElement>('.project');
  if (desktop) {
    const distance = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: {
        trigger: '.projects', start: 'top top', end: () => `+=${distance()}`,
        pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (self) => (indexEl.textContent = String(Math.min(cards.length, Math.floor(self.progress * cards.length) + 1))),
      },
    });
  } else {
    track.addEventListener('scroll', () => {
      const i = Math.round(track.scrollLeft / (track.scrollWidth / cards.length));
      indexEl.textContent = String(Math.min(cards.length, i + 1));
    }, { passive: true });
  }

  // Método: cada cartão encolhe um pouco quando o próximo passa por cima
  const steps = $$<HTMLElement>('.step');
  steps.forEach((step, i) => {
    if (i === steps.length - 1) return;
    gsap.to(step, {
      scale: 0.94 - (steps.length - 2 - i) * 0.015, filter: 'brightness(0.72)', ease: 'none',
      scrollTrigger: { trigger: steps[i + 1], start: 'top 85%', end: 'top 20%', scrub: true },
    });
  });

  // Bastidores (a revelação): a cor de destaque inunda a seção a partir do topo,
  // o título se decifra e o terminal "imprime" o registro de como o site foi feito
  const revealEl = $<HTMLElement>('.reveal');
  const floodR = () => Math.ceil(Math.hypot(innerWidth / 2, revealEl.offsetHeight)) + 40;
  gsap.fromTo('.reveal__flood', { clipPath: 'circle(0px at 50% 0%)' }, {
    clipPath: () => `circle(${floodR()}px at 50% 0%)`, ease: 'power2.in',
    scrollTrigger: { trigger: revealEl, start: 'top 100%', end: 'top 35%', scrub: 0.4, invalidateOnRefresh: true },
  });
  $$<HTMLElement>('[data-scramble]').forEach((el, i) => {
    gsap.to(el, {
      scrambleText: { text: el.textContent!, chars: 'upperCase', speed: 0.5, revealDelay: 0.25 },
      duration: 1.5, delay: i * 0.2, ease: 'none',
      scrollTrigger: { trigger: '.reveal__title', start: 'top 72%', once: true },
    });
  });
  const termLines = $$<HTMLElement>('.term__body p');
  gsap.set(termLines, { autoAlpha: 0 });
  ScrollTrigger.create({
    trigger: '.term', start: 'top 80%', once: true,
    onEnter: () => gsap.to(termLines, { autoAlpha: 1, duration: 0.01, stagger: 0.24 }),
  });

  // Contato: o título sobe de dentro de uma máscara
  SplitText.create('.contact__title', {
    type: 'lines', linesClass: 'line', mask: 'lines', autoSplit: true,
    onSplit(self) {
      return gsap.from(self.lines, { yPercent: 110, duration: 1.1, ease, stagger: 0.12, scrollTrigger: { trigger: '.contact', start: 'top 62%', once: true } });
    },
  });
  gsap.from(['.contact__mail', '.contact__actions'], { autoAlpha: 0, y: 30, duration: 0.9, ease, stagger: 0.1, scrollTrigger: { trigger: '.contact__mail', start: 'top 88%', once: true } });
});

// Fontes carregadas mudam larguras: recalcula as posições de rolagem
document.fonts?.ready.then(() => ScrollTrigger.refresh());
