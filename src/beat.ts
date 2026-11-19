// Batida da música de fundo, medida em tempo real para a esfera do hero pulsar junto.
// Um AnalyserNode lê a energia dos graves (onde fica o bumbo) a cada quadro e a compara com a
// média recente: o que passa da média vira um "pulso" de 0 a 1, com subida rápida e descida lenta.
// Sem música tocando, o pulso fica em 0 e a esfera se comporta como sempre.
//
// Celular: o navegador (o iPhone principalmente) só libera o contexto de áudio se ele for criado
// e retomado DENTRO do toque, de forma síncrona. Por isso o `prime()` é chamado direto nos
// eventos de toque, clique e tecla, antes de qualquer espera; e a ligação com a música só é feita
// quando o contexto já está ativo. Ligar com o contexto suspenso deixaria a música muda.
let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let bins: Uint8Array<ArrayBuffer> | null = null;
let element: HTMLAudioElement | null = null;
let connected = false;
let average = 0;
let pulse = 0;
let last = 0;

function connect() {
  if (connected || !ctx || !element || ctx.state !== 'running') return;
  try {
    const source = ctx.createMediaElementSource(element);
    const node = ctx.createAnalyser();
    node.fftSize = 1024;
    node.smoothingTimeConstant = 0.6;
    source.connect(node);
    node.connect(ctx.destination);
    analyser = node; bins = new Uint8Array(node.frequencyBinCount); connected = true;
  } catch { /* navegador sem suporte: segue sem pulso, a música não é afetada */ }
}

// Chamar de forma síncrona dentro de um gesto da pessoa (toque, clique ou tecla).
export function prime() {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      ctx.addEventListener('statechange', connect);
    }
    if (ctx.state !== 'running') ctx.resume().then(connect, () => {});
    else connect();
  } catch { /* sem Web Audio: segue sem pulso */ }
}

// Informa qual elemento de áudio medir. Liga na hora se o contexto já estiver ativo;
// senão, liga sozinho quando o próximo gesto ativar o contexto.
export function listenTo(audio: HTMLAudioElement) {
  element = audio;
  prime(); // se o navegador já liberou som (música tocando sem toque), liga agora; senão, espera o gesto
}

// Ao voltar para a aba, o celular pode ter suspendido o áudio: tenta retomar.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
});

// Pulso atual, de 0 a 1. Pode ser chamado a cada quadro.
export function beat(): number {
  if (!analyser || !bins || !ctx || ctx.state !== 'running') return (pulse = 0);
  const now = performance.now();
  const dt = Math.min(0.1, (now - last) / 1000 || 0.016);
  last = now;
  analyser.getByteFrequencyData(bins);
  // Graves de ~40 a ~180 Hz
  const hz = ctx.sampleRate / analyser.fftSize;
  const from = Math.max(1, Math.round(40 / hz)), to = Math.max(from + 1, Math.round(180 / hz));
  let sum = 0;
  for (let i = from; i <= to; i++) sum += bins[i];
  const energy = sum / ((to - from + 1) * 255);
  average += (energy - average) * (1 - Math.exp(-dt / 1.2)); // média dos últimos ~1,2 s
  const hit = average > 0.02 ? Math.min(1, Math.max(0, (energy - average * 1.08) / (average * 0.5))) : 0;
  pulse = hit > pulse ? pulse + (hit - pulse) * 0.6 : pulse * Math.exp(-dt / 0.18); // sobe rápido, desce suave
  return pulse;
}
