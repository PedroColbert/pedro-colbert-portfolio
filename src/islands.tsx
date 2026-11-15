// Efeitos do React Bits (reactbits.dev, código aberto) montados como "ilhas" dentro da página.
// O conteúdo do site é HTML puro; o React só cuida destes efeitos, e este arquivo
// é carregado depois do primeiro desenho para não atrasar a abertura.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { DiMsqlServer } from 'react-icons/di';
import { SiClaude, SiGit, SiGooglegemini, SiJavascript, SiLaravel, SiMysql, SiPhp, SiPython, SiReact, SiTypescript } from 'react-icons/si';
import { TbApi, TbBrandOpenai, TbBrandPowershell, TbDatabase } from 'react-icons/tb';
import ClickSpark, { type ClickSparkHandle } from './reactbits/ClickSpark';
import CrystalizedBall from './reactbits/CrystalizedBall';
import Cubes from './reactbits/Cubes';
import CursorGrid from './reactbits/CursorGrid';
import DotGrid from './reactbits/DotGrid';
import LetterGlitch from './reactbits/LetterGlitch';
import LogoLoop, { type LogoItem } from './reactbits/LogoLoop';
import SplashCursor from './reactbits/SplashCursor';
import StickerPeel from './reactbits/StickerPeel';
import TargetCursor from './reactbits/TargetCursor';
import Threads from './reactbits/Threads';

// Cores de cada tema, iguais aos tokens do style.css
const palette = {
  dark: { accent: '#ff5a36', dot: '#4b4844', bg: '#0d0d0e', ink: '#f3efe8', ink2: '#a9a49c' },
  light: { accent: '#e2401c', dot: '#bfb7a8', bg: '#f3efe8', ink: '#131313', ink2: '#5d5850' },
} as const;
type Theme = keyof typeof palette;
const readTheme = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const small = matchMedia('(max-width: 700px)').matches;

// Os efeitos acompanham a troca de tema
function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme);
  useEffect(() => {
    const mo = new MutationObserver(() => setTheme(readTheme()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);
  return theme;
}

// ---------- Hero ----------
// Grade de pontos com física (empurra com o cursor, onda de choque no clique)
function HeroGrid() {
  const c = palette[useTheme()];
  return <DotGrid dotSize={4} gap={28} baseColor={c.dot} activeColor={c.accent} proximity={190} strength={1.1} shockRadius={360} shockStrength={5} swell={1.6} glow={0.7} intro={false} />;
}

// Bola de cristal ao lado do nome: o "núcleo" de IA do site. Reage ao cursor e leva um tranco no clique.
// No celular usa menos partículas, para ficar leve.
function HeroBall() {
  const theme = useTheme();
  return (
    <CrystalizedBall
      preset="plasma" color={palette[theme].accent} theme={theme} size={0.7}
      crackle={0.85} fill={0.5} strands={6} flares={0.65} glow={0.9} sparks={0.6}
      particleCount={small ? 8000 : 15000} motion="rise" particleShape="square"
      depth={0.6} sway={0.5} twinkle={0.5} haze={0.7} dustSpeed={1} speed={1}
      interactive hoverStrength={0.7} intro
    />
  );
}

// ---------- Fundos de seção (só em algumas, para não poluir) ----------
// Perfil: grade cujas células acendem atrás do cursor
function ProfileGrid() {
  const theme = useTheme();
  const c = palette[theme];
  return <CursorGrid cellSize={64} color={c.accent} gridColor={c.ink} radius={170} fillOpacity={0.1} gridOpacity={0.07} edgeFade={0.3} lightMode={theme === 'light'} />;
}

// Experiência: cubos no fundo da seção inteira, que viram para o cursor e ondulam no clique.
// O efeito sempre desenha um quadrado; por isso ele recebe o maior lado da seção e a sobra é recortada.
// Como fica atrás do texto, o clique na seção é repassado a ele para a ondulação acontecer.
function SectionCubes() {
  const c = palette[useTheme()];
  const wrap = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState(0);
  useEffect(() => {
    const host = wrap.current!.parentElement!;
    const section = host.closest('section')!;
    const measure = () => setSide(Math.ceil(Math.max(host.clientWidth, host.clientHeight)));
    const ro = new ResizeObserver(measure);
    ro.observe(host); measure();
    const onDown = (e: PointerEvent) => {
      wrap.current?.querySelector('.cubes-container')?.dispatchEvent(new PointerEvent('pointerdown', { clientX: e.clientX, clientY: e.clientY, pointerType: e.pointerType }));
    };
    section.addEventListener('pointerdown', onDown, { passive: true });
    return () => { ro.disconnect(); section.removeEventListener('pointerdown', onDown); };
  }, []);
  return (
    <div ref={wrap} style={{ position: 'absolute', left: '50%', top: '50%', width: side, height: side, transform: 'translate(-50%, -50%)' }}>
      {side > 0 && <Cubes gridSize={Math.min(40, Math.max(6, Math.round(side / 110)))} faceColor={c.bg} edgeColor={c.ink2} rippleColor={c.accent} edgeWidth={1} maxAngle={50} radius={3} intro={false} dpr={Math.min(devicePixelRatio, 1.5)} />}
    </div>
  );
}

// ---------- Cursores ----------
// Rastro de tinta que segue o cursor e estoura no clique, no site todo (atrás do conteúdo)
function Splash() {
  const theme = useTheme();
  return <SplashCursor colors={theme === 'light' ? ['#e2401c', '#ff7a5c', '#f0a070'] : ['#ff5a36', '#ff8a4a', '#b3261a']} rainbow={false} intensity={0.8} quality="medium" theme={theme} zIndex={-1} />;
}

// Em telas de toque não há cursor: ficam as faíscas a cada toque
function Sparks() {
  const ref = useRef<ClickSparkHandle>(null);
  const c = palette[useTheme()];
  useEffect(() => {
    const onDown = (e: PointerEvent) => { if (e.button === 0) ref.current?.spark(e.clientX, e.clientY); };
    addEventListener('pointerdown', onDown, { passive: true });
    return () => removeEventListener('pointerdown', onDown);
  }, []);
  return <ClickSpark ref={ref} sparkColor={c.accent} sparkSize={12} sparkRadius={26} sparkCount={8} duration={450} style={{ position: 'fixed', inset: 0, zIndex: 130, pointerEvents: 'none' }} />;
}

// Mira que "trava" nos alvos, só dentro de três seções: competências, projetos e contato
const TARGET_ZONES = ['#competencias', '#projetos', '#contato'];
const TARGETS = '.skill, .project, .contact .btn, .contact__mail';
function Targets() {
  const c = palette[useTheme()];
  return (
    <>
      {TARGET_ZONES.map((zone) => (
        <TargetCursor key={zone} container={document.querySelector<HTMLElement>(zone)} cursorColor={c.ink} cursorColorOnTarget={c.accent} blendMode="normal" thickness={2} cornerSize={14} showLabel={false} />
      ))}
    </>
  );
}

// ---------- Competências: ferramentas e tecnologias do currículo, em laço ----------
const tech: [string, ReactNode][] = [
  ['ChatGPT', <TbBrandOpenai />], ['Codex', <TbBrandOpenai />], ['Claude Code', <SiClaude />], ['Gemini', <SiGooglegemini />],
  ['Git', <SiGit />], ['PHP', <SiPhp />], ['Laravel', <SiLaravel />], ['React', <SiReact />],
  ['TypeScript', <SiTypescript />], ['JavaScript', <SiJavascript />], ['Python', <SiPython />], ['PowerShell', <TbBrandPowershell />],
  ['MySQL', <SiMysql />], ['SQL Server', <DiMsqlServer />], ['Oracle', <TbDatabase />], ['APIs REST', <TbApi />],
];
function TechLoop() {
  const c = palette[useTheme()];
  const logos: LogoItem[] = tech.map(([title, node]) => ({ node, title, hoverColor: c.accent }));
  return <LogoLoop logos={logos} speed={70} logoHeight={small ? 30 : 44} gap={small ? 40 : 64} labels="inline" pauseOnHover scaleOnHover fadeOut fadeOutColor={c.bg} scrollBoost={1} ariaLabel="Ferramentas e tecnologias" />;
}

// ---------- Adesivo: brincadeira para arrastar, descolar e jogar ----------
// Ele mora na página, não na janela: fica onde a pessoa soltar e rola junto com o conteúdo.
// A arte é desenhada aqui mesmo, com a fonte do site, e entregue ao efeito como imagem.
function drawSticker(): string {
  const S = 512, cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d')!;
  const display = "'Bricolage Grotesque Variable', 'Arial Black', sans-serif";
  g.fillStyle = '#f3efe8'; g.beginPath(); g.arc(S / 2, S / 2, 250, 0, Math.PI * 2); g.fill(); // borda do recorte
  g.fillStyle = '#ff5a36'; g.beginPath(); g.arc(S / 2, S / 2, 226, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#0d0d0e'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `800 228px ${display}`;
  if ('fontStretch' in g) (g as CanvasRenderingContext2D & { fontStretch: string }).fontStretch = 'condensed';
  g.fillText('PC', S / 2, S / 2 + 12);
  // Texto em volta, letra por letra
  const ring = 'ME ARRASTE  •  ME DESCOLE  •  ME JOGUE  •  ';
  g.font = `700 30px ${display}`;
  [...ring].forEach((ch, i) => {
    const a = (i / ring.length) * Math.PI * 2 - Math.PI / 2;
    g.save(); g.translate(S / 2 + Math.cos(a) * 190, S / 2 + Math.sin(a) * 190); g.rotate(a + Math.PI / 2); g.fillText(ch, 0, 0); g.restore();
  });
  return cv.toDataURL('image/png');
}
function Sticker() {
  const [src, setSrc] = useState('');
  useEffect(() => { document.fonts.ready.then(() => setSrc(drawSticker())); }, []);
  if (!src) return null;
  // Começa no hero, colado na beirada direita, sobre a bola de cristal (sem cobrir texto nem botão).
  // O efeito mede a posição a partir do centro da camada, que aqui é a página inteira.
  const layer = document.querySelector<HTMLElement>('.sticker-layer')!;
  const start = { x: layer.clientWidth / 2 - 92, y: innerHeight * 0.63 - layer.clientHeight / 2 };
  return <StickerPeel imageSrc={src} width={124} rotate={-12} peelDirection={30} finish="gloss" backColor="#d9d3c7" friction={1} initialPosition={start} />;
}

// ---------- Bastidores e contato ----------
// Tela do terminal: letras que "decifram", como código sendo escrito
function TermScreen() {
  return <LetterGlitch glitchColors={['#ff5a36', '#ff7a5c', '#f3efe8']} baseColor="#a9a49c" backgroundColor="#0d0d0e" fontSize={13} speed={0.8} edgeFade={0.25} />;
}

// Fios de luz atrás do "Vamos conversar?", que se abrem com o cursor
function ContactThreads() {
  const c = palette[useTheme()];
  return <Threads color={c.accent} amplitude={1.5} distance={0.35} lineCount={70} enableMouseInteraction opacity={0.9} />;
}

export function mountIslands() {
  const mount = (selector: string, node: ReactNode) => {
    const el = document.querySelector(selector);
    if (el) createRoot(el).render(node);
  };
  mount('[data-bits="hero"]', <HeroGrid />);
  mount('[data-bits="ball"]', <HeroBall />);
  mount('[data-bits="perfil"]', <ProfileGrid />);
  mount('[data-bits="logos"]', <TechLoop />);
  mount('[data-bits="term"]', <TermScreen />);
  mount('[data-bits="contact"]', <ContactThreads />);
  if (!small) mount('[data-bits="cubes"]', <SectionCubes />);
  if (finePointer) {
    // Com mouse: rastro de tinta no site todo, mira em três seções e o adesivo solto
    document.querySelectorAll(TARGETS).forEach((el) => el.classList.add('cursor-target'));
    mount('[data-bits="splash"]', <Splash />);
    mount('[data-bits="targets"]', <Targets />);
    mount('[data-bits="sticker"]', <Sticker />);
  } else {
    mount('[data-bits="splash"]', <Sparks />);
  }
}
