## Why

Inserir `\cite{key}` pelo painel Zotero não garante que a entrada exista no `.bib` do projeto — o BibTeX compila mas não encontra a referência, resultando em citações indefinidas no PDF. O usuário precisa exportar manualmente para o clipboard e colar no arquivo `.bib`. Esse gap torna o workflow de citação incompleto.

## What Changes

- `onInsert` no `ZoteroPanel` passa a fornecer o objeto ref completo além do citekey
- Ao inserir uma citação, o `app.js` detecta o arquivo `.bib` alvo do projeto (via `\bibliography{}` no root file) e escreve a entrada BibTeX automaticamente
- Se a entrada já existir no `.bib`, não duplica
- O toast de confirmação informa qual arquivo `.bib` foi atualizado
- Se nenhum `.bib` alvo for encontrado, cria `zotero-refs.bib` no projeto com aviso no toast

## Capabilities

### New Capabilities

- `zotero-bib-write`: Escrita automática de entradas BibTeX no arquivo `.bib` do projeto ao inserir citação via painel Zotero, com detecção do arquivo alvo e feedback visual

### Modified Capabilities

- `zotero-retractable`: O callback `onInsert` passa a receber `(key, ref)` em vez de só `key`

## Impact

- **Modificado**: `scripts/ui/ZoteroPanel.js` — `_onInsert` recebe `(key, ref)`
- **Modificado**: `scripts/app.js` — lógica de detecção do `.bib` alvo e escrita da entrada
- **Sem novas dependências** — usa `generateBibtex()` já existente em `bibtex.js`
- **Sem mudança de UI** — apenas o toast muda para incluir o nome do arquivo
