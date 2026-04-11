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

#### Scenario: Inserção de citação com escrita no .bib
- **WHEN** o usuário clica em uma referência no painel Zotero
- **THEN** `\cite{key}` é inserido na posição atual do cursor no editor
- **THEN** a entrada BibTeX é escrita no arquivo `.bib` alvo do projeto
- **THEN** o toast confirma a inserção e informa o arquivo atualizado

#### Scenario: Busca por referências no painel
- **WHEN** o usuário digita no campo de busca do painel Zotero
- **THEN** a lista filtra por título, autor, citekey ou ano
