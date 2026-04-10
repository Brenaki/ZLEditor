## Why

O arquivo `zotero_latex_tool.html` concentra ~290 linhas de CSS, JS e HTML sem separação de responsabilidades. Antes de adicionar features complexas (editor LaTeX, compilação, PDF viewer), é necessário reorganizar a base em uma estrutura modular com scripts separados por responsabilidade (SOLID), estilos divididos por componente, e identidade visual atualizada para o padrão Shadcn-inspired.

## What Changes

- Separar o HTML único em `index.html` + `scripts/` + `styles/`
- Reescrever o JavaScript em módulos ES com responsabilidade única por arquivo
- Dividir os estilos em tokens globais + componentes + layout
- Atualizar a identidade visual para Shadcn-inspired (Inter, tokens CSS, design limpo)
- Manter toda a funcionalidade atual: conexão Zotero, lista de refs, BibTeX, editor LaTeX simples

## Capabilities

### New Capabilities
- `modular-scripts`: Scripts JS organizados em módulos ES com separação SOLID (services, ui, utils)
- `component-styles`: Estilos divididos em base, componentes reutilizáveis e layout

### Modified Capabilities
- (nenhuma — funcionalidade preservada integralmente)

## Impact

- `zotero_latex_tool.html` → `index.html` (apenas estrutura HTML + imports)
- Novo diretório `scripts/` com módulos ES
- Novo diretório `styles/` com CSS por componente
- `server.py` e `launch.sh` sem alteração
