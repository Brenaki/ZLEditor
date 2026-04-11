## Why

A aplicação requer TeX Live, Python 3 e pdflatex instalados no sistema do usuário, criando atrito na configuração. O editor de texto atual é um `<textarea>` simples sem syntax highlighting nem autocomplete, dificultando a escrita de LaTeX para usuários não experientes.

## What Changes

- Adicionar `Dockerfile` multi-stage: stage de build (Node.js + esbuild para bundle do editor) e stage de runtime (Python + TeX Live full)
- Adicionar `docker-compose.yml` com `network_mode: host` para acesso ao Zotero BBT em `localhost:23119`
- Substituir o editor `<textarea>` por CodeMirror 6 servido localmente (sem CDN)
- Adicionar autocomplete de comandos LaTeX (trigger em `\`) e citekeys (`\cite{`)
- Adicionar syntax highlighting para LaTeX via modo stex do CodeMirror

## Capabilities

### New Capabilities

- `docker-deploy`: Dockerfile multi-stage + docker-compose.yml para rodar a aplicação isolada com TeX Live full e acesso ao Zotero BBT no host
- `codemirror-editor`: Editor CodeMirror 6 bundlado localmente substituindo o textarea, com syntax highlighting LaTeX e autocomplete de comandos + citekeys

### Modified Capabilities

- `codemirror-editor`: A spec existente definia uso de CDN (esm.sh), que era bloqueado pelo Firefox. O requisito muda para bundle local servido pelo servidor Python.

## Impact

- Novo: `Dockerfile`, `docker-compose.yml`, `package.json`, `scripts/editor-entry.js`
- Modificado: `scripts/ui/Editor.js` (de textarea para wrapper do CM6)
- Modificado: `scripts/app.js` (expor lista de citekeys ao editor para autocomplete)
- Novo: `scripts/utils/latex-completions.js` (lista de comandos LaTeX para autocomplete)
- Dependência de build: `codemirror`, `@codemirror/lang-legacy-modes`, `@codemirror/autocomplete`, `@codemirror/commands`, `@codemirror/view`, `@codemirror/state`, `esbuild`
- Sem mudanças no `server.py` ou nos serviços existentes
