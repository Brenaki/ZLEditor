## MODIFIED Requirements

### Requirement: Editor CodeMirror com syntax highlight
O sistema SHALL usar CodeMirror 6 como editor, com highlight para LaTeX e suporte a múltiplos arquivos abertos. O bundle SHALL ser servido localmente (gerado no Docker build via esbuild) sem dependências de CDN externo.

#### Scenario: Abrir arquivo no editor
- **WHEN** o usuário clica em um arquivo na file tree
- **THEN** o conteúdo é carregado no CodeMirror
- **THEN** o nome do arquivo ativo é exibido na toolbar do editor

#### Scenario: Inserção de \cite{} na posição do cursor
- **WHEN** o usuário clica em uma referência no painel Zotero
- **THEN** `\cite{key}` é inserido na posição atual do cursor no CodeMirror
- **THEN** o foco retorna ao editor

#### Scenario: Bundle servido localmente
- **WHEN** o browser carrega a aplicação
- **THEN** o editor-bundle.js é carregado de `/scripts/editor-bundle.js` (mesmo origin)
- **THEN** nenhum request é feito para CDN externo para o editor

## ADDED Requirements

### Requirement: Autocomplete de comandos LaTeX
O sistema SHALL oferecer autocomplete de comandos LaTeX ao digitar `\`.

#### Scenario: Trigger de autocomplete com backslash
- **WHEN** o usuário digita `\` no editor
- **THEN** uma lista de sugestões de comandos LaTeX aparece (ex: `\begin`, `\section`, `\textbf`)
- **THEN** ao selecionar uma sugestão, o comando é inserido no cursor

#### Scenario: Filtro por prefixo
- **WHEN** o usuário digita `\sec`
- **THEN** a lista filtra mostrando apenas comandos que começam com `\sec`

### Requirement: Autocomplete de citekeys
O sistema SHALL oferecer autocomplete de citekeys ao digitar `\cite{`.

#### Scenario: Trigger dentro de \cite{}
- **WHEN** o usuário digita `\cite{` no editor
- **THEN** uma lista com os citekeys carregados do Zotero aparece
- **THEN** ao selecionar, o citekey é inserido e `}` fecha o comando

#### Scenario: Lista vazia sem refs carregadas
- **WHEN** o usuário digita `\cite{` mas nenhuma referência foi carregada do Zotero
- **THEN** a lista de autocomplete está vazia ou não aparece
