## 1. ZoteroPanel — passar ref completo no callback

- [ ] 1.1 Alterar `ZoteroPanel._render()` para passar `(key, ref)` ao chamar `_onInsert`
- [ ] 1.2 Atualizar a assinatura do `onInsert` no JSDoc do construtor de `ZoteroPanel`

## 2. app.js — lógica de detecção do .bib alvo e escrita

- [ ] 2.1 Criar função `findTargetBib(store)` que detecta o arquivo `.bib` alvo via `\bibliography{}` no root file, com fallbacks (único .bib → criar zotero-refs.bib)
- [ ] 2.2 Criar função `appendToBib(store, bibName, ref)` que verifica duplicata e faz append da entrada BibTeX
- [ ] 2.3 Atualizar `onInsert` em `app.js` para receber `(key, ref)`, chamar `findTargetBib` + `appendToBib` e exibir toast com resultado correto

## 3. Verificação

- [ ] 3.1 Importar projeto com `\bibliography{Referencias/Referencias}` e inserir uma ref do Zotero — confirmar que a entrada aparece em `Referencias/Referencias.bib`
- [ ] 3.2 Inserir a mesma ref duas vezes — confirmar que não há duplicata no `.bib`
- [ ] 3.3 Importar projeto sem `\bibliography` mas com um único `.bib` — confirmar fallback para esse arquivo
- [ ] 3.4 Importar projeto sem nenhum `.bib` — confirmar criação de `zotero-refs.bib` e aparição na file tree
