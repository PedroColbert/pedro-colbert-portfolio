// Gera o currículo com Edge, Chrome ou Chromium: npm run cv.
// CV_BROWSER permite indicar o executável; CV_OUTPUT permite validar um PDF de teste.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, renameSync, statSync, unlinkSync } from 'node:fs';
import { basename, delimiter, dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const source = here('./curriculo.html');
const output = resolve(process.env.CV_OUTPUT || here('../public/cv/Pedro_Colbert_Curriculo.pdf'));
const explicit = process.env.CV_BROWSER;
const names = process.platform === 'win32'
  ? ['msedge.exe', 'chrome.exe', 'chromium.exe']
  : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge'];
const fixed = process.platform === 'win32'
  ? [
      join(process.env['PROGRAMFILES(X86)'] || 'C:/Program Files (x86)', 'Microsoft/Edge/Application/msedge.exe'),
      join(process.env.PROGRAMFILES || 'C:/Program Files', 'Microsoft/Edge/Application/msedge.exe'),
      join(process.env.PROGRAMFILES || 'C:/Program Files', 'Google/Chrome/Application/chrome.exe'),
    ]
  : ['/usr/bin/google-chrome', '/opt/google/chrome/chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];

function locate(candidate) {
  if (isAbsolute(candidate) || candidate.includes('/') || candidate.includes('\\')) {
    const path = resolve(candidate);
    return existsSync(path) ? path : null;
  }
  for (const directory of (process.env.PATH || '').split(delimiter)) {
    const path = join(directory, candidate);
    if (existsSync(path)) return path;
  }
  return null;
}

const browser = explicit ? locate(explicit) : [...names, ...fixed].map(locate).find(Boolean);
if (!browser) {
  throw new Error(explicit
    ? `Executável indicado em CV_BROWSER não encontrado: ${explicit}`
    : 'Edge, Chrome ou Chromium não encontrado. Defina CV_BROWSER com o caminho do executável.');
}
if (!existsSync(source)) throw new Error(`Fonte HTML não encontrada: ${source}`);

const temporary = join(dirname(output), `.${basename(output)}.${process.pid}.tmp.pdf`);
try {
  const result = spawnSync(browser, [
    '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=4000',
    `--print-to-pdf=${temporary}`, pathToFileURL(source).href,
  ], { encoding: 'utf8', timeout: 60000, maxBuffer: 1024 * 1024 });

  if (result.error || result.signal || result.status !== 0) {
    throw new Error(`Falha no navegador ${browser} (código ${result.status}, sinal ${result.signal || 'nenhum'}):\n${result.error?.message || ''}\n${result.stderr || ''}\n${result.stdout || ''}`);
  }
  if (!existsSync(temporary)) throw new Error(`Navegador terminou sem criar o PDF temporário: ${temporary}`);
  const size = statSync(temporary).size;
  const data = readFileSync(temporary);
  if (size < 10000 || data.toString('ascii', 0, 5) !== '%PDF-' || !data.subarray(-2048).includes(Buffer.from('%%EOF'))) {
    throw new Error(`PDF temporário inválido (${size} bytes): ${temporary}`);
  }
  renameSync(temporary, output);
  console.log(`PDF validado e salvo em ${output} (${size} bytes; navegador: ${browser})`);
} finally {
  if (existsSync(temporary)) unlinkSync(temporary);
}
