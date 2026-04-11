## Why

O autocomplete de `\cite{}` no editor depende exclusivamente do Zotero, exigindo que o usuário mantenha o Zotero rodando localmente. Projetos LaTeX frequentemente incluem um arquivo `.bib` próprio — parsear esses arquivos diretamente elimina essa dependência e funciona offline com qualquer workflow (Zotero, Mendeley, JabRef, manual).

## What Changes

- Novo `BibService` que parseia arquivos `*.bib` do projeto e expõe citekeys em cache
- Detecção automática de arquivos `*.bib` ao importar um projeto
- Cache invalidado em tempo real via `onChange` sempre que o arquivo ativo for `.bib` — sem depender de evento de "salvar" explícito
- `getCitekeys` em `app.js` passa a agregar citekeys do Zotero **e** do `BibService`
- Nenhuma nova UI — o `.bib` é processado silenciosamente em segundo plano

## Capabilities

### New Capabilities

- `bib-autocomplete`: Extração de citekeys de arquivos `*.bib` do projeto e integração no autocomplete de `\cite{}` do editor, com cache invalidado ao editar o `.bib`

### Modified Capabilities

- `codemirror-editor`: O autocomplete de `\cite{}` passa a consumir uma lista de citekeys agregada (Zotero + `.bib`) em vez de exclusivamente do ZoteroPanel

## Impact

- **Novo arquivo**: `scripts/services/BibService.js`
- **Modificado**: `scripts/app.js` — `getCitekeys` agrega `BibService` + `zoteroPanel`
- **Modificado**: `scripts/app.js` — hook em `onChange` para re-ingerir quando arquivo ativo for `*.bib`
- **Sem novas dependências** — parser via regex simples, sem libs externas
- **Sem mudança de UI** — ZoteroPanel permanece intacto; nenhum painel novo criado para `.bib` nesta fase
