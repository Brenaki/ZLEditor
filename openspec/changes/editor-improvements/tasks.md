## 1. Fix de seleção

- [ ] 1.1 Em `editor-entry.js`, trocar a cor `.cm-selectionBackground, ::selection` de `#dbeafe` para `#bfdbfe`
- [ ] 1.2 Rebuildar o bundle (`npm run build` ou equivalente) e confirmar visualmente a seleção

## 2. Toggle de auto-compile

- [ ] 2.1 Adicionar `<button id="btn-auto-compile">` na toolbar do `index.html` (ao lado do botão Compilar)
- [ ] 2.2 Em `app.js`, adicionar variável `_autoCompileEnabled` inicializada via `localStorage.getItem('auto-compile')`
- [ ] 2.3 Adicionar variável `_autoCompileTimer` e lógica de debounce no `onChange` (2000ms, guard `.bib`)
- [ ] 2.4 Adicionar guard para não enfileirar compile se o botão já está desabilitado (compilação em progresso)
- [ ] 2.5 Wiring do botão `btn-auto-compile`: toggle `_autoCompileEnabled`, persistir no `localStorage`, atualizar classe visual do botão
- [ ] 2.6 Aplicar classe inicial ao botão com base no estado salvo no `localStorage`

## 3. Verificação

- [ ] 3.1 Verificar visualmente que seleção de texto no editor é claramente visível
- [ ] 3.2 Ativar auto-compile, editar um `.tex` e aguardar 2s — PDF deve atualizar automaticamente
- [ ] 3.3 Ativar auto-compile, editar um `.bib` — confirmar que nenhuma compilação é disparada
- [ ] 3.4 Recarregar a página com toggle ativo — confirmar que permanece ativo
