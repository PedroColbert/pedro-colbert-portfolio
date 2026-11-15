import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Conta as linhas reais do código-fonte e escreve os números na seção "bastidores" do HTML.
// Assim o que o site afirma sobre si mesmo nunca fica desatualizado nem inventado.
function sourceStats(): Plugin {
  const lines = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8').split('\n').length;
  return {
    name: 'source-stats',
    transformIndexHtml(html) {
      const n = { HTML: lines('./index.html'), CSS: lines('./src/style.css'), MAIN: lines('./src/main.ts'), CANVAS: lines('./src/hero-canvas.ts'), ISLANDS: lines('./src/islands.tsx') };
      const total = n.HTML + n.CSS + n.MAIN + n.CANVAS + n.ISLANDS;
      return html
        .replace('%L_HTML%', String(n.HTML)).replace('%L_CSS%', String(n.CSS))
        .replace('%L_MAIN%', String(n.MAIN)).replace('%L_CANVAS%', String(n.CANVAS))
        .replace('%L_ISLANDS%', String(n.ISLANDS))
        .replace('%L_TOTAL%', total.toLocaleString('pt-BR'));
    },
  };
}

export default defineConfig({
  base: './', // caminhos relativos: funciona em GitHub Pages ou na raiz de qualquer host
  server: { port: 5173, strictPort: true },
  plugins: [react(), sourceStats()],
});
