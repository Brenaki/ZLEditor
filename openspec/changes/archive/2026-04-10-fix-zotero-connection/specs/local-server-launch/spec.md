## ADDED Requirements

### Requirement: Script de lançamento via HTTP local
O sistema SHALL fornecer um script `launch.sh` na raiz do projeto que serve a ferramenta via HTTP local e abre o Firefox automaticamente, eliminando o bloqueio CORS de `file://` → `localhost`.

#### Scenario: Lançamento bem-sucedido
- **WHEN** o usuário executa `./launch.sh`
- **THEN** o servidor HTTP sobe na porta 8765
- **THEN** o Firefox abre em `http://localhost:8765/zotero_latex_tool.html`
- **THEN** ao fechar o Firefox, o servidor HTTP é encerrado automaticamente

#### Scenario: Porta ocupada
- **WHEN** o usuário executa `./launch.sh` com a porta 8765 já em uso
- **THEN** o script exibe mensagem de erro informando que a porta está ocupada
- **THEN** o script encerra sem iniciar o servidor

### Requirement: Conexão com Better BibTeX via JSON-RPC
A ferramenta SHALL conectar ao Better BibTeX usando o método JSON-RPC correto para retornar todos os itens da biblioteca Zotero quando o usuário clicar em "Conectar".

#### Scenario: Conexão bem-sucedida com itens
- **WHEN** o Zotero está aberto com Better BibTeX instalado
- **THEN** o fetch para `localhost:23119/better-bibtex/json-rpc` retorna com sucesso
- **THEN** a lista de referências é exibida na sidebar

#### Scenario: Zotero offline
- **WHEN** o Zotero não está aberto
- **THEN** a ferramenta exibe "Demo (Zotero offline)" e carrega dados de exemplo
