## Context

O `ProjectStore` mantém todos os arquivos do projeto em memória como `Map<string, {content, binary}>`. A `FileTree` renderiza a lista de arquivos mas não tem busca. O editor CodeMirror 6 captura teclas via `keymap.of([...])` — `Ctrl+P` não está mapeado e pode ser capturado ali. Não existe nenhum overlay/modal de busca no projeto além do `LogModal`.

## Goals / Non-Goals

**Goals:**
- `Ctrl+P` abre overlay de busca rápida
- Sem prefixo: filtra arquivos do projeto por nome (substring, case-insensitive)
- Prefixo `%`: busca string em conteúdo de todos os arquivos texto
- Navegação por teclado (↑↓ Enter Escape)
- Ao selecionar um resultado de `%`, abre o arquivo e posiciona o cursor na linha

**Non-Goals:**
- Fuzzy search (apenas substring para Fase 1)
- Busca em arquivos binários
- Regex no modo `%`
- Histórico de buscas

## Decisions

### 1. `QuickOpen` como classe UI autônoma

**Decisão**: `scripts/ui/QuickOpen.js` com a interface:
```js
class QuickOpen {
  constructor({ overlayEl, inputEl, listEl, getFiles, openFile })
  open()
  close()
}
```
`getFiles()` retorna `store.entries()` filtrado para arquivos texto. `openFile(name, line?)` chama a função de abertura de arquivo do `app.js`.

**Rationale**: Componente isolado, sem acoplamento direto ao `store` — recebe callbacks como os outros componentes UI.

---

### 2. Captura de `Ctrl+P` no CodeMirror

**Decisão**: Adicionar ao keymap do CM6 (em `editor-entry.js`):
```js
{ key: 'Ctrl-p', run: () => { onQuickOpen?.(); return true; } }
```
`onQuickOpen` é uma callback passada para `initEditor`.

**Rationale**: `Ctrl+P` dentro do editor precisa ser interceptado pelo CM antes que o browser o capture (imprimir). Retornar `true` do handler cancela o comportamento padrão. Fora do editor (foco na file tree, etc.), capturar via `document.addEventListener('keydown')` no `app.js`.

---

### 3. Modo de busca determinado pelo prefixo `%`

**Decisão**: Ao digitar no input do overlay:
- Se `value.startsWith('%')`: modo conteúdo — busca `value.slice(1)` em todos os arquivos
- Caso contrário: modo arquivo — filtra `store.entries()` por nome contendo `value`

**Rationale**: `%` é incomum no início de queries de arquivo, evita colisões. É o caractere de comentário LaTeX, associado a "busca dentro de texto LaTeX".

---

### 4. Posicionamento do cursor na linha (modo `%`)

**Decisão**: `openFile(name, line)` no `app.js` abre o arquivo normalmente e, se `line` for fornecido, chama `editor.goToLine(line)`. O `editor-entry.js` expõe `goToLine(n)` que usa `view.dispatch` com `EditorView.scrollIntoView`.

**Rationale**: Ir para a linha é o comportamento esperado ao abrir um resultado de busca em arquivo. Sem isso, o modo `%` perde metade do valor.

---

### 5. DOM do overlay

**Decisão**: `<div id="quick-open-overlay">` no `index.html`, escondido por padrão com `display:none`. Ao abrir, usa `display:flex` com backdrop semitransparente (como um modal). Não usa `<dialog>` para controle mais simples de posicionamento e foco.

## Risks / Trade-offs

- **Busca `%` em projetos grandes**: iterar sobre todos os arquivos texto é O(n×m). Para projetos típicos (<2 MB texto total) é instantâneo. Para projetos muito grandes, pode ser lento — aceitável para Fase 1.
- **Foco ao abrir**: garantir que o input do overlay recebe foco imediatamente ao abrir (`.focus()` síncrono).
- **`Ctrl+P` fora do editor**: se o foco estiver na file tree ou toolbar, o browser pode capturar Ctrl+P. Mitigação: listener no `document` com `preventDefault`.

## Migration Plan

Nenhum. Feature nova, sem mudanças em funcionalidades existentes.

## Open Questions

Nenhuma pendente.
