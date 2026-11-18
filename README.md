# Pedro Colbert — portfólio profissional

Portfólio e currículo online de Pedro Colbert, desenvolvedor de software com foco em IA aplicada à engenharia de software e aos negócios.

**[Acessar demonstração](https://pedrocolbert.github.io/pedro-colbert-portfolio/)** · [Perfil no GitHub](https://github.com/PedroColbert) · [LinkedIn](https://www.linkedin.com/in/pedro-colbert/)

## Proposta

Apresentar minha trajetória, competências, projetos e método de trabalho: compreender o problema de negócio, estruturar requisitos e contexto, direcionar agentes de programação e validar as entregas.

Este repositório contém o site de apresentação. Os projetos corporativos descritos no conteúdo não têm seu código-fonte publicado aqui. O uso de IA no desenvolvimento do portfólio não significa que o site execute um sistema de RAG ou possua um backend de IA.

## Funcionalidades implementadas

- Página única com seções de perfil, competências, experiência, projetos, método, formação, bastidores e contato.
- Navegação por âncoras, indicador de progresso de leitura e menu para dispositivos móveis.
- Temas claro e escuro, com preferência salva no navegador.
- Linha do tempo profissional e apresentação de projetos com rolagem horizontal no desktop e deslize no celular.
- Animações de entrada, efeitos de cursor e componentes visuais carregados conforme suporte a WebGL 2 e preferência de movimento.
- Download do currículo em PDF, links de contato e botão para copiar o e-mail.
- Música de fundo com controle de som e preferência persistida; a reprodução depende do suporte e das permissões do navegador.
- Seção de bastidores que apresenta o desenvolvimento assistido por IA e contagens de linhas calculadas no build.

## Tecnologias utilizadas

| Tecnologia | Uso no projeto |
| --- | --- |
| HTML e CSS | Conteúdo, estilos, temas e layout responsivo |
| TypeScript | Comportamento da interface e organização do código |
| Vite | Servidor de desenvolvimento e build estático |
| React e React DOM | Montagem dos componentes visuais em ilhas |
| GSAP e ScrollTrigger | Animações e interações ligadas à rolagem |
| Lenis | Rolagem suave quando o movimento está habilitado |
| OGL / WebGL e Canvas 2D | Efeitos gráficos e alternativa visual |
| React Bits e React Icons | Componentes visuais e ícones |
| GitHub Actions e GitHub Pages | Build e publicação |

As tecnologias citadas na seção de competências do site representam o perfil profissional; nem todas são dependências desta aplicação.

## Estrutura principal

| Caminho | Responsabilidade |
| --- | --- |
| `index.html` | Conteúdo e estrutura das seções |
| `src/main.ts` | Navegação, temas, som e animações |
| `src/style.css` | Estilos, responsividade e regras de movimento reduzido |
| `src/islands.tsx` | Montagem dos componentes React |
| `src/hero-canvas.ts` e `src/beat.ts` | Canvas do hero e integração visual com áudio |
| `src/reactbits/` | Componentes e respectivos créditos |
| `public/` | Favicon, áudio e currículo em PDF |
| `cv-fonte/` | Fonte HTML e script auxiliar do currículo |
| `vite.config.ts` | Configuração do Vite e contagem de linhas |
| `.github/workflows/pages.yml` | Publicação no GitHub Pages |

## Instalação e execução local

Use Node.js e npm. O workflow de publicação utiliza **Node.js 22**.

```bash
git clone https://github.com/PedroColbert/pedro-colbert-portfolio.git
cd pedro-colbert-portfolio
npm ci
npm run dev
```

Abra o endereço informado no terminal. A configuração atual utiliza a porta `5173`, com `strictPort` habilitado.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Iniciar o servidor de desenvolvimento |
| `npm run build` | Verificar tipos com `tsc --noEmit` e gerar o site em `dist/` |
| `npm run preview` | Visualizar localmente o build já gerado |
| `npm run cv` | Executar o script auxiliar de geração do currículo em `cv-fonte/gerar.mjs` |

Para conferir a versão de publicação localmente:

```bash
npm run build
npm run preview
```

## Publicação no GitHub Pages

O workflow `.github/workflows/pages.yml` executa em cada push para `main` ou por acionamento manual. Ele instala as dependências com `npm ci`, executa o build, envia `dist/` como artefato e publica no GitHub Pages.

A origem de publicação deve estar configurada como **GitHub Actions** em **Settings → Pages**. O Vite usa caminhos relativos (`base: './'`).

Demonstração: https://pedrocolbert.github.io/pedro-colbert-portfolio/

## Responsividade e acessibilidade

O código inclui layouts adaptados por media queries, menu móvel, link para pular ao conteúdo, marcação semântica, atributos ARIA e fechamento do menu com Esc.

A preferência `prefers-reduced-motion` desabilita a rolagem suave e os principais efeitos animados; há regras equivalentes no CSS. Sem WebGL 2, o hero utiliza Canvas 2D como alternativa. Esses recursos foram identificados no código e não representam certificação de acessibilidade ou garantia de compatibilidade com todos os dispositivos.

## Créditos e licenças de terceiros

- Efeitos de código aberto do [React Bits](https://reactbits.dev), presentes em `src/reactbits/`. Consulte [o registro de componentes e seus créditos](src/reactbits/LEIAME.md), que informa a licença MIT + Commons Clause.
- Animações com [GSAP](https://gsap.com/) e rolagem com [Lenis](https://lenis.darkroom.engineering/).
- Música: **“Chill Day”**, de [LAKEY INSPIRED](https://soundcloud.com/lakeyinspired/chill-day), sob licença **Creative Commons BY-SA**, conforme a atribuição já existente no projeto.

As dependências e os assets mantêm suas próprias condições de uso; este README não substitui essas licenças.
