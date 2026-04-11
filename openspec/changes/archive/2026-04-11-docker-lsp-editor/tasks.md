## 1. Editor Bundle Setup

- [x] 1.1 Criar `package.json` com dependências: `codemirror`, `@codemirror/legacy-modes`, `@codemirror/autocomplete`, `@codemirror/language`, `@codemirror/commands`, `@codemirror/view`, `@codemirror/state`, e `esbuild` como devDependency
- [x] 1.2 Criar `scripts/utils/latex-completions.js` com lista de comandos LaTeX comuns para autocomplete
- [x] 1.3 Criar `scripts/editor-entry.js` que inicializa CodeMirror 6 com modo stex, autocomplete de comandos LaTeX e citekeys, e expõe `window.initEditor`

## 2. Editor.js — Migração do Textarea para CM6

- [x] 2.1 Reescrever `scripts/ui/Editor.js` para carregar `editor-bundle.js` dinamicamente e chamar `window.initEditor`, mantendo a mesma interface pública (`open`, `getContent`, `insertAtCursor`)
- [x] 2.2 Atualizar `scripts/app.js` para passar `getCitekeys` ao construtor do Editor (retorna array de strings com os citekeys carregados no ZoteroPanel)
- [x] 2.3 Atualizar `scripts/ui/ZoteroPanel.js` para expor método `getCitekeys()` que retorna os citekeys atualmente carregados

## 3. Docker

- [x] 3.1 Criar `Dockerfile` multi-stage: stage 1 (node:20-alpine) instala deps npm e roda esbuild para gerar `editor-bundle.js`; stage 2 (debian:bookworm-slim) instala Python 3 e texlive-full, copia app e bundle
- [x] 3.2 Criar `docker-compose.yml` com `network_mode: host`, mapeando o diretório como está e usando `CMD python3 server.py`
- [x] 3.3 Criar `.dockerignore` excluindo `node_modules`, `openspec`, `.git`, `.claude`

## 4. Validação

- [x] 4.1 Verificar que `docker compose up --build` constrói sem erros e o servidor inicia na porta 8765
- [x] 4.2 Verificar que o editor carrega com syntax highlighting LaTeX (não textarea simples)
- [x] 4.3 Verificar que ao digitar `\` aparece autocomplete de comandos LaTeX
- [x] 4.4 Verificar que ao digitar `\cite{` aparecem os citekeys carregados do Zotero
- [x] 4.5 Verificar que a compilação pdflatex funciona dentro do container
