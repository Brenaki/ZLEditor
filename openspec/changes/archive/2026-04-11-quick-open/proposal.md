## Why

Navegar entre arquivos no ZLEditor requer clicar na file tree — ineficiente em projetos com Cap1–Cap10, múltiplos `.bib`, figuras e estilos. Não há como buscar conteúdo dentro dos arquivos sem abri-los um a um. O VSCode popularizou o padrão Quick Open (Ctrl+P) como solução universal para navegação e busca em projetos, e é o comportamento que usuários avançados esperam.

## What Changes

- `Ctrl+P` abre um overlay de busca rápida
- Digitar texto sem prefixo filtra arquivos do projeto por nome (substring match, case-insensitive)
- Digitar com prefixo `%` busca o texto em todos os arquivos do projeto, exibindo arquivo + linha + contexto
- Setas cima/baixo navegam os resultados; Enter abre o arquivo (e posiciona o cursor na linha, no modo `%`)
- `Escape` fecha o overlay
- O overlay é fechado automaticamente ao abrir um arquivo

## Capabilities

### New Capabilities

- `quick-open`: Overlay Ctrl+P para navegação por nome de arquivo e busca de conteúdo com prefixo `%`

## Impact

- **Novo arquivo**: `scripts/ui/QuickOpen.js` — componente do overlay
- **Modificado**: `scripts/editor-entry.js` — keymap para capturar `Ctrl+P` dentro do editor
- **Modificado**: `scripts/app.js` — instanciação e wiring do `QuickOpen` com `store` e `editor`
- **Modificado**: `index.html` — elemento DOM do overlay
- **Sem novas dependências** — busca feita sobre o `ProjectStore` em memória
