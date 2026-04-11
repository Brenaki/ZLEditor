## 1. BibService

- [ ] 1.1 Criar `scripts/services/BibService.js` com `ingest(filename, text)`, `remove(filename)` e `getCitekeys()`
- [ ] 1.2 Implementar extração de citekeys via regex `/@\w+\{([^,\s]+)/g` no `ingest()`
- [ ] 1.3 Garantir que `getCitekeys()` retorna array deduplicado de todos os arquivos ingeridos

## 2. Integração em app.js

- [ ] 2.1 Importar e instanciar `BibService` em `app.js`
- [ ] 2.2 Atualizar `getCitekeys` para agregar `zoteroPanel.getCitekeys()` + `bibService.getCitekeys()` com `Set`
- [ ] 2.3 Adicionar ingestão de todos os `*.bib` do projeto após import (loop no `store` ao reconstruir a FileTree)
- [ ] 2.4 Adicionar re-ingestão no `onChange` quando `_activeFile?.endsWith('.bib')`
- [ ] 2.5 Chamar `bibService.remove(name)` no `handleFileDelete` quando o arquivo deletado for `*.bib`

## 3. Verificação

- [ ] 3.1 Testar autocomplete de `\cite{}` com projeto contendo `refs.bib` — citekeys devem aparecer nas sugestões
- [ ] 3.2 Adicionar nova entrada ao `.bib` no editor e confirmar que o autocomplete reflete o novo citekey sem recarregar a página
- [ ] 3.3 Testar com Zotero offline — citekeys do `.bib` devem aparecer normalmente
- [ ] 3.4 Testar com Zotero ativo e `.bib` presente — ambas as fontes devem aparecer sem duplicatas
