## Context

A ferramenta `zotero_latex_tool.html` é um arquivo HTML estático que usa `fetch` para se comunicar com o Better BibTeX via JSON-RPC em `localhost:23119`. O problema atual é que browsers bloqueiam requisições de `file://` para `localhost` por política de CORS. A solução é servir a ferramenta via HTTP local, tornando a origem `localhost:PORT` e permitindo a comunicação com `localhost:23119`.

O usuário tem Python 3 e Firefox disponíveis no sistema.

## Goals / Non-Goals

**Goals:**
- Criar script `launch.sh` que serve a ferramenta via `python3 -m http.server` e abre Firefox automaticamente
- Verificar e corrigir o método JSON-RPC `item.search` se necessário para retornar itens da biblioteca Zotero
- Script deve encerrar o servidor HTTP ao fechar o Firefox

**Non-Goals:**
- Reescrever a ferramenta HTML
- Suporte a outros browsers
- Servidor HTTP persistente como serviço do sistema

## Decisions

### Script de lançamento com python3 http.server

**Decisão**: Usar `python3 -m http.server` com uma porta fixa (ex: `8765`).

**Rationale**: Python 3 já vem instalado no sistema, zero dependências adicionais. Porta fixa simplifica o launch e evita lógica de "encontrar porta livre".

**Alternativa considerada**: Node.js `http-server` — requer instalação adicional.

### Encerramento do servidor

**Decisão**: O script sobe o servidor em background, abre o Firefox, e mata o servidor quando o Firefox fechar (`wait`).

**Rationale**: Evita que o servidor fique rodando em background após o uso.

### Verificação do método JSON-RPC

**Decisão**: Testar `item.search` contra a API do Better BibTeX. Se não existir, usar alternativa documentada.

O Better BibTeX expõe via JSON-RPC:
- `item.search(query)` — disponível em versões recentes do BBT
- Se não disponível, alternativa é `item.export(itemKeys, libraryID, "biblatex")` com `itemKeys=[]` para exportar toda a biblioteca

## Risks / Trade-offs

- [Porta 8765 ocupada] → Verificar antes de subir e informar o usuário se estiver em uso
- [Firefox não estar no PATH] → Usar `firefox` diretamente; se falhar, instruir o usuário a abrir manualmente
- [`item.search` não existir no BBT] → Fallback para `item.export` com biblioteca completa — mais pesado mas funcional
