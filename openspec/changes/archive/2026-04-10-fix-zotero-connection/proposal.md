## Why

A ferramenta `zotero_latex_tool.html` não consegue se conectar ao Zotero porque: (1) abrir o arquivo via `file://` faz o browser bloquear requisições fetch para `localhost`, e (2) o endpoint Better BibTeX JSON-RPC não era encontrado pois o plugin não estava instalado. Com o Better BibTeX agora instalado, resta resolver o problema de CORS servindo a ferramenta via HTTP local.

## What Changes

- Adicionar script `launch.sh` que sobe um servidor HTTP local e abre a ferramenta no Firefox automaticamente
- Verificar e corrigir o método JSON-RPC usado para buscar itens do Zotero (`item.search`)

## Capabilities

### New Capabilities
- `local-server-launch`: Script que serve a ferramenta via HTTP local e abre o Firefox, resolvendo o bloqueio CORS de `file://` → `localhost`

### Modified Capabilities
- (nenhuma)

## Impact

- Novo arquivo: `launch.sh` (script de lançamento)
- Possível ajuste no método JSON-RPC em `zotero_latex_tool.html`
- Dependência de `python3` (http.server) e `firefox` no sistema
