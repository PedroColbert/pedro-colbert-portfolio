// Batida da música de fundo, para a esfera do hero pulsar junto.
// Em vez de "ouvir" a música em tempo real (Web Audio), o site consulta um mapa de batidas
// gerado uma vez a partir do arquivo (src/beat-map.ts), usando o tempo atual da música.
// Assim funciona igual em todos os navegadores, inclusive no Safari do iPhone, que não
// entrega o som do elemento de áudio a um medidor de forma confiável. E o som da música não
// passa por nenhum processamento: nada pode deixá-la muda.
import { BEAT_FPS, BEAT_MAP } from './beat-map';

const LEVELS = 61;
let element: HTMLAudioElement | null = null;
let fullVolume = 0.3;

const value = (frame: number) => {
  const c = BEAT_MAP.charCodeAt(((frame % BEAT_MAP.length) + BEAT_MAP.length) % BEAT_MAP.length);
  // 0-9 = 0 a 9, a-z = 10 a 35, A-Z = 36 a 61
  return (c <= 57 ? c - 48 : c >= 97 ? c - 87 : c - 29) / LEVELS;
};

// Informa qual elemento de áudio acompanhar e o volume normal da música.
export function listenTo(audio: HTMLAudioElement, volume = 0.3) {
  element = audio;
  fullVolume = volume || 0.3;
}

// Pulso atual, de 0 a 1. Pode ser chamado a cada quadro.
export function beat(): number {
  const el = element;
  if (!el || el.paused || el.ended || el.readyState < 2) return 0;
  const t = el.currentTime * BEAT_FPS;
  const f = Math.floor(t);
  const pulse = value(f) + (value(f + 1) - value(f)) * (t - f); // interpola entre quadros
  // Acompanha a entrada e a saída suaves do volume: com a música sumindo, o pulso some junto
  return pulse * Math.min(1, el.volume / fullVolume);
}
