// Batida da música de fundo, medida em tempo real para a esfera do hero pulsar junto.
// Um AnalyserNode lê a energia dos graves (onde fica o bumbo) a cada quadro e a compara com a
// média recente: o que passa da média vira um "pulso" de 0 a 1, com subida rápida e descida lenta.
// Sem música tocando, o pulso fica em 0 e a esfera se comporta como sempre.
let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let bins: Uint8Array<ArrayBuffer> | null = null;
let average = 0;
let pulse = 0;
let last = 0;

// Liga o medidor ao elemento de áudio. Só funciona dentro de um gesto da pessoa (clique, toque
// ou tecla), quando o navegador libera o som. Se o contexto de áudio não ficar ativo, desiste
// sem tocar no elemento: a música segue tocando normalmente, só sem o pulso.
export async function listenTo(audio: HTMLAudioElement) {
  if (ctx) { if (ctx.state !== 'running') await ctx.resume().catch(() => {}); return; }
  try {
    const context = new AudioContext();
    if (context.state !== 'running') await context.resume().catch(() => {});
    if (context.state !== 'running') { context.close(); return; }
    const source = context.createMediaElementSource(audio);
    const node = context.createAnalyser();
    node.fftSize = 1024;
    node.smoothingTimeConstant = 0.6;
    source.connect(node);
    node.connect(context.destination);
    ctx = context; analyser = node; bins = new Uint8Array(node.frequencyBinCount);
  } catch { /* navegador sem Web Audio: segue sem pulso */ }
}

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
