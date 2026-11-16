// Gera o PDF do currículo a partir de cv-fonte/curriculo.html usando o Edge ou o Chrome instalados.
// Uso: npm run cv
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const browser = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find(existsSync);
if (!browser) throw new Error('Não achei o Edge nem o Chrome para gerar o PDF.');

const out = here('../public/cv/Pedro_Colbert_Curriculo.pdf');
execFileSync(browser, [
  '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=4000',
  `--print-to-pdf=${out}`, pathToFileURL(here('./curriculo.html')).href,
], { stdio: 'ignore' });
console.log('PDF gerado em', out);
