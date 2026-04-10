## Context

Constrói sobre `refactor-structure`. O `server.py` já existe e serve arquivos estáticos + proxy BBT. A nova funcionalidade de compilação estende esse servidor. O usuário tem `pdflatex` instalado via `texlive` no Arch Linux.

## Goals / Non-Goals

**Goals:**
- Layout 3 colunas responsivo (file tree | editor | PDF)
- Compilação local com pdflatex (multi-passo: pdflatex → bibtex → pdflatex × 2)
- Suporte a imagens e arquivos binários (base64 no JSON de upload)
- Arquivo raiz configurável por projeto
- Autosave debounced (2s) com prompt de restauração
- Painel Zotero retrátil com inserção de `\cite{}` na posição do cursor
- Modal de log com botão copiar

**Non-Goals:**
- Colaboração em tempo real
- Suporte a outros engines (XeLaTeX, LuaLaTeX) — pode ser adicionado depois
- Syntax check em tempo real (linting LaTeX)
- Histórico de versões

## Decisions

### Compilação via server.py (pdflatex local)

**Decisão**: Endpoint `POST /compile` recebe JSON `{files: [{name, content, binary?: boolean, base64?: string}], rootFile: string}`, escreve em `/tmp/zotero-latex-{uuid}/`, executa a sequência de compilação e retorna o PDF como `application/pdf`.

**Sequência de compilação**:
```
pdflatex -interaction=nonstopmode -halt-on-error main.tex
bibtex main           (se existir .bib nos arquivos)
pdflatex ... main.tex
pdflatex ... main.tex
```

**Resposta de erro**: Se pdflatex falhar, retorna `{error: true, log: "..."}` com status 422.

**Cleanup**: Diretório temporário removido após cada compilação.

### PDF Viewer com `<embed>`

**Decisão**: `<embed src="{blobURL}" type="application/pdf" width="100%" height="100%">`. Firefox tem viewer nativo excelente. Sem dependência de PDF.js.

**Blob URL**: `URL.createObjectURL(new Blob([pdfBytes], {type: 'application/pdf'}))` — revogar o anterior antes de criar novo.

### Editor CodeMirror 6 via CDN

**Decisão**: Carregar via `https://esm.sh/` (CDN de ES modules). Pacotes necessários: `@codemirror/view`, `@codemirror/state`, `@codemirror/lang-markdown` (LaTeX não tem pacote oficial — Markdown mode é adequado para highlight básico).

**Import map** no HTML para resolver aliases.

### Armazenamento de projeto em memória

```javascript
// ProjectStore
{
  files: Map<string, {content: string, binary: boolean, base64?: string}>,
  rootFile: string,           // default: 'main.tex'
  name: string,               // nome do projeto
  lastModified: number,
}
```

### Autosave em localStorage

- Chave: `zotero-latex-autosave`
- Debounce: 2000ms após última edição
- On load: se existe dado → modal "Restaurar sessão anterior de [timestamp]?" → sim: restaura, não: `localStorage.removeItem()`
- Formato: JSON com todos os arquivos (base64 para binários)

### Import/Export .zip

**Import**: `<input type="file" accept=".zip">` → JSZip (CDN) → popula `ProjectStore`
**Export (Salvar)**: JSZip → gera blob → download automático como `projeto.zip`

### Painel Zotero retrátil

Integrado à coluna esquerda. Toggle button fecha/abre. Quando aberto, empurra a file tree para cima (flex column com `overflow: hidden` e height animada).

### Modal de log

`<dialog>` nativo do HTML. Abre automaticamente em caso de erro de compilação. Contém o log completo + botão "Copiar log". Também acessível manualmente via botão "Ver log" na toolbar.

## Risks / Trade-offs

- [pdflatex não instalado] → servidor retorna 500 com mensagem clara; UI mostra instrução de instalação
- [Arquivo zip muito grande (muitas imagens)] → sem limite implementado inicialmente; avisar se > 50MB
- [Compilação demorada] → mostrar spinner na toolbar durante compilação; não bloquear UI
- [bibtex vs biber] → usar bibtex por padrão; arquivos com `\addbibresource` podem precisar de biber (fora de escopo inicial)
