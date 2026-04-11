## Why

Dois problemas de UX independentes afetam a experiência de edição: (1) a seleção de texto com mouse não é visualmente aparente no editor CodeMirror, tornando difícil saber o que está selecionado; (2) o ciclo editar → compilar → visualizar exige que o usuário clique manualmente em "Compilar" a cada mudança, quebrando o fluxo de escrita. Ambos têm soluções simples e de baixo risco.

## What Changes

- A cor de seleção no editor é ajustada para um azul mais contrastante e visível
- Um toggle de auto-compilação é adicionado à toolbar — quando ativo, compila automaticamente após 2 segundos de inatividade no editor
- O auto-compile não dispara quando o arquivo ativo é `.bib` (edição de referências não deve recompilar)
- O estado do toggle persiste entre sessões via `localStorage`

## Capabilities

### New Capabilities

- `auto-compile`: Toggle de compilação automática após idle de 2 segundos, com estado persistido

### Modified Capabilities

- `codemirror-editor`: Cor de seleção corrigida para contraste adequado

## Impact

- **Modificado**: `scripts/editor-entry.js` — cor `#dbeafe` no `appTheme` trocada por valor mais visível
- **Modificado**: `scripts/app.js` — lógica de debounce para auto-compile + leitura/escrita do toggle no `localStorage`
- **Modificado**: `index.html` — toggle button na toolbar
- **Sem novas dependências**
