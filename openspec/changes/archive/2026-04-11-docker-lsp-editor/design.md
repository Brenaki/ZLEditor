## Context

A aplicação é um editor LaTeX local composto por `server.py` (Python 3, porta 8765) que serve arquivos estáticos, executa pdflatex e faz proxy do Zotero BBT em `localhost:23119`. O editor atual é um `<textarea>` sem recursos. O sistema operacional alvo é Arch Linux. Zotero roda no host do usuário.

## Goals / Non-Goals

**Goals:**
- Empacotar a aplicação em Docker com TeX Live full e Python 3
- Manter acesso ao Zotero BBT rodando no host via `--network=host`
- Substituir o textarea por CodeMirror 6 com syntax highlighting e autocomplete
- Servir o bundle do editor localmente (sem CDN) para contornar bloqueio do Firefox
- Autocomplete de comandos LaTeX e `\cite{key}` com as refs carregadas do Zotero

**Non-Goals:**
- LSP server real (texlab, diagnósticos em tempo real)
- Suporte a Windows/macOS no Docker (network=host é Linux only)
- Hot-reload do bundle ao editar arquivos JS

## Decisions

### 1. `--network=host` para acesso ao Zotero

**Decisão**: `docker-compose.yml` com `network_mode: host`.

**Rationale**: O `server.py` usa `BBT_URL = 'http://localhost:23119/...'`. Com `--network=host`, o `localhost` dentro do container é o mesmo do host, zero mudanças no código. Alternativa (`extra_hosts: host-gateway`) exigiria mudar `BBT_URL` dinamicamente.

**Alternativa considerada**: `extra_hosts: - "host.docker.internal:host-gateway"` + patch no `server.py`. Descartada: modifica código existente sem benefício real para o caso de uso (desktop pessoal).

---

### 2. Multi-stage Docker build

**Decisão**: Stage 1 (Node.js 20 Alpine) gera o bundle; Stage 2 (Debian Bookworm Slim + TeX Live + Python) é o runtime.

**Rationale**: Node.js não precisa existir no container final. O bundle é um artefato estático (`scripts/editor-bundle.js`) gerado uma vez no build e servido pelo `SimpleHTTPRequestHandler` do Python.

**Estrutura do build**:
```
Stage 1 (node:20-alpine)
  COPY package.json, scripts/editor-entry.js
  RUN npm ci && npx esbuild ...
  → /build/editor-bundle.js

Stage 2 (debian:bookworm-slim)
  RUN apt-get install python3 texlive-full
  COPY . /app
  COPY --from=stage1 /build/editor-bundle.js /app/scripts/
  EXPOSE 8765
  CMD ["python3", "server.py"]
```

---

### 3. CodeMirror 6 com esbuild (bundle local)

**Decisão**: `editor-entry.js` importa módulos CM6 via npm e é bundlado por `esbuild` como IIFE expondo `window.initEditor`.

**Rationale**: Firefox bloqueou imports de `esm.sh` com MIME `text/plain` e erros CORS. Um bundle local servido pelo mesmo servidor Python tem origem idêntica — sem CORS, MIME correto.

**Pacotes**:
- `codemirror` (basic-setup)
- `@codemirror/legacy-modes` (modo stex para LaTeX)
- `@codemirror/autocomplete`
- `@codemirror/language`

**Interface exposta**:
```js
window.initEditor({ containerEl, filenameEl, onChange, getCitekeys })
// retorna: { open(name, content), getContent(), insertAtCursor(text) }
```

O `getCitekeys` é uma callback que o `app.js` fornece retornando os citekeys atualmente carregados no ZoteroPanel.

---

### 4. Autocomplete: LaTeX commands + citekeys dinâmicos

**Decisão**: Dois completion sources no CM6:
1. **LaTeX commands**: lista estática em `scripts/utils/latex-completions.js` (comandos comuns: `\begin`, `\end`, `\section`, `\cite`, etc.), ativada ao digitar `\`
2. **Citekeys**: ativada ao detectar `\cite{` incompleto, chama `getCitekeys()` do `app.js` que retorna os refs carregados do Zotero em tempo real

**Alternativa considerada**: texlab via WebSocket. Descartada pela complexidade (bridge stdio↔WS, protocolo LSP no browser).

---

### 5. server.py: binding address

**Decisão**: Manter `127.0.0.1` no `server.py`.

**Rationale**: Com `--network=host`, `127.0.0.1` no container é o loopback do host. O browser do usuário acessa `localhost:8765` normalmente.

## Risks / Trade-offs

- **TeX Live full é ~4 GB** → primeiro `docker build` lento (~10-20 min dependendo da conexão). Mitigação: documentar no README e usar layer cache do Docker (TeX Live em layer separada).
- **`network_mode: host` não funciona em Docker Desktop** (Mac/Windows) → Mitigação: escopo declarado como Linux only no README.
- **Bundle deve ser regenerado** se `editor-entry.js` mudar → requer `docker build` novamente. Mitigação: para desenvolvimento local sem Docker, o `textarea` original pode ser mantido como fallback (mas o bundle sobrescreve `Editor.js` dinamicamente).
- **esbuild bundle aumenta tamanho do assets** (~500 KB minificado) → aceitável para uso local.

## Migration Plan

1. Usuário executa `docker compose up --build` (único comando)
2. Browser aponta para `http://localhost:8765`
3. Zotero deve estar rodando no host para o painel funcionar
4. Sem migração de dados — localStorage é do browser do host, não do container

## Open Questions

- Nenhuma pendente. Todas as decisões foram tomadas com o usuário durante a fase de exploração.
