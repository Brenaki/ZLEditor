## MODIFIED Requirements

### Requirement: Painel Zotero retratável com inserção de citações
O sistema SHALL exibir um painel retratável de referências Zotero na coluna esquerda, permitindo ao usuário conectar, buscar e inserir citações no editor.

#### Scenario: Inserção de citação com escrita no .bib
- **WHEN** o usuário clica em uma referência no painel Zotero
- **THEN** `\cite{key}` é inserido na posição atual do cursor no editor
- **THEN** a entrada BibTeX é escrita no arquivo `.bib` alvo do projeto
- **THEN** o toast confirma a inserção e informa o arquivo atualizado

#### Scenario: Busca por referências no painel
- **WHEN** o usuário digita no campo de busca do painel Zotero
- **THEN** a lista filtra por título, autor, citekey ou ano
