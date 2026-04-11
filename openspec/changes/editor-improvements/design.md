## Context

O editor usa CodeMirror 6 com `drawSelection()` para renderizar seleções como elementos DOM (`.cm-selectionBackground`). A cor atual é `#dbeafe` — azul muito claro, quase imperceptível sobre fundo branco. O auto-compile não existe; o usuário clica manualmente em "▶ Compilar". O `StorageService` já usa o padrão `setTimeout(fn, 2000)` para debounce de salvamento automático.

## Goals / Non-Goals

**Goals:**
- Cor de seleção visível e com contraste adequado
- Toggle de auto-compile na toolbar com debounce de 2s
- Estado do toggle persistido no `localStorage`
- Auto-compile não dispara em arquivos `.bib`

**Non-Goals:**
- Indicador de "documento modificado" (dirty state)
- Configuração do delay de auto-compile pelo usuário
- Auto-compile com indicador de progresso diferente do botão existente

## Decisions

### 1. Cor de seleção: `#dbeafe` → `#bfdbfe`

**Decisão**: Trocar a cor de seleção no `appTheme` de `#dbeafe` para `#bfdbfe` (um passo mais escuro na escala blue-200 do Tailwind).

**Rationale**: `#bfdbfe` mantém a paleta azul consistente com o resto do app mas tem contraste suficiente sobre fundo branco para ser claramente visível.

---

### 2. Auto-compile: debounce no `onChange` com flag de guarda

**Decisão**: Em `app.js`, adicionar:
```js
let _autoCompileTimer = null;
let _autoCompileEnabled = localStorage.getItem('auto-compile') === 'true';

// No onChange:
if (_autoCompileEnabled && !_activeFile?.endsWith('.bib')) {
  clearTimeout(_autoCompileTimer);
  _autoCompileTimer = setTimeout(() => handleCompile(), 2000);
}
```

**Rationale**: Reutiliza o padrão do `StorageService`. O guard `.bib` evita recompilações ao editar referências.

---

### 3. Toggle na toolbar: botão com estado visual

**Decisão**: Adicionar `<button id="btn-auto-compile">` na toolbar com classe CSS que muda conforme o estado (`btn--active`). Ao clicar: toggle `_autoCompileEnabled`, persiste no `localStorage`, atualiza classe CSS do botão.

**Alternativa considerada**: checkbox. Descartada — botão toggle é mais consistente com o padrão visual da toolbar existente.

## Risks / Trade-offs

- **Compile com código incompleto**: auto-compile pode disparar enquanto o usuário está no meio de uma expressão LaTeX. Com `-halt-on-error`, o servidor retorna 422 e o PDF não é atualizado — comportamento aceitável, sem side effects.
- **Compile frequente**: projetos grandes com xelatex levam vários segundos. O timer de 2s pode iniciar um novo compile antes do anterior terminar. Mitigação: desabilitar o botão durante compile (já feito) e não enfileirar novos compiles se um já está em progresso.

## Migration Plan

Nenhum. Mudanças aditivas.

## Open Questions

Nenhuma pendente.
