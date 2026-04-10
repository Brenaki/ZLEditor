## ADDED Requirements

### Requirement: Editor CodeMirror com syntax highlight
O sistema SHALL usar CodeMirror 6 como editor, com highlight para LaTeX e suporte a múltiplos arquivos abertos.

#### Scenario: Abrir arquivo no editor
- **WHEN** o usuário clica em um arquivo na file tree
- **THEN** o conteúdo é carregado no CodeMirror
- **THEN** o nome do arquivo ativo é exibido na toolbar do editor

#### Scenario: Inserção de \cite{} na posição do cursor
- **WHEN** o usuário clica em uma referência no painel Zotero
- **THEN** `\cite{key}` é inserido na posição atual do cursor no CodeMirror
- **THEN** o foco retorna ao editor
