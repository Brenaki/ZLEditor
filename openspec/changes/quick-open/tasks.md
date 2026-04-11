## 1. DOM e CSS

- [ ] 1.1 Adicionar `<div id="quick-open-overlay">` com input e lista de resultados no `index.html`
- [ ] 1.2 Criar estilos para o overlay (backdrop semitransparente, container centralizado, input destacado, lista de resultados)

## 2. QuickOpen component

- [ ] 2.1 Criar `scripts/ui/QuickOpen.js` com `constructor({ overlayEl, inputEl, listEl, getFiles, openFile })`
- [ ] 2.2 Implementar `open()` (exibe overlay, limpa input, foca input) e `close()` (esconde overlay)
- [ ] 2.3 Implementar lógica de filtro no `input` event: modo arquivo (sem prefixo) e modo conteúdo (prefixo `%`)
- [ ] 2.4 Implementar renderização de resultados: arquivo → nome; conteúdo → `arquivo:linha — contexto`
- [ ] 2.5 Implementar navegação por teclado (↑↓ destacam item, Enter abre, Escape fecha)
- [ ] 2.6 Ao clicar/Enter em resultado: chamar `openFile(name, line?)` e fechar overlay

## 3. Editor — expor goToLine e callback onQuickOpen

- [ ] 3.1 Em `editor-entry.js`, expor `goToLine(n)` no objeto retornado por `initEditor`
- [ ] 3.2 Adicionar parâmetro `onQuickOpen` em `initEditor` e binding `Ctrl-p` no keymap do CM6

## 4. Integração em app.js

- [ ] 4.1 Importar e instanciar `QuickOpen` em `app.js`
- [ ] 4.2 Passar `getFiles: () => store.entries().filter(...)` e `openFile: (name, line) => { openFile(name); if (line) editor.goToLine(line); }`
- [ ] 4.3 Adicionar listener `document.addEventListener('keydown')` para capturar `Ctrl+P` fora do editor

## 5. Verificação

- [ ] 5.1 Pressionar Ctrl+P com foco no editor — overlay abre e browser não mostra diálogo de impressão
- [ ] 5.2 Digitar "Cap" — apenas arquivos com "Cap" no nome aparecem
- [ ] 5.3 Digitar "%cite" — resultados mostram arquivo, linha e contexto
- [ ] 5.4 Selecionar resultado de `%` com Enter — arquivo abre na linha correta
- [ ] 5.5 Pressionar Escape — overlay fecha sem abrir arquivo
