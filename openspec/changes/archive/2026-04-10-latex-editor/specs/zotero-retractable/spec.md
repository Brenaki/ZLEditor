## ADDED Requirements

### Requirement: Painel Zotero retrátil na coluna esquerda
O sistema SHALL integrar o painel Zotero à coluna esquerda como seção retrátil abaixo da file tree.

#### Scenario: Abrir painel Zotero
- **WHEN** o usuário clica no toggle "Zotero"
- **THEN** o painel expande abaixo da file tree com animação
- **THEN** o painel exibe o status de conexão e campo de busca

#### Scenario: Inserir referência no editor
- **WHEN** o usuário clica em uma referência no painel Zotero expandido
- **THEN** `\cite{key}` é inserido na posição do cursor no editor
- **THEN** uma notificação toast confirma a inserção
