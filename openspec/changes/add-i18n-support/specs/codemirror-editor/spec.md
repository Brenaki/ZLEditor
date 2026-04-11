## MODIFIED Requirements

### Requirement: Editor CodeMirror com syntax highlight
O sistema SHALL usar CodeMirror 6 como editor, com highlight para LaTeX e suporte a múltiplos arquivos abertos. O bundle SHALL ser servido localmente (gerado no Docker build via esbuild) sem dependências de CDN externo. Any user-facing strings produced by the editor UI layer (e.g., status indicators, placeholder text) SHALL use `t()` for translation and SHALL update on `localechange`.

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

#### Scenario: Seleção de texto visível com mouse
- **WHEN** o usuário seleciona texto com o mouse ou teclado no editor
- **THEN** a seleção é destacada com cor claramente visível e contrastante

#### Scenario: Editor UI strings update on locale change
- **WHEN** the user changes the active locale
- **THEN** any visible UI strings owned by the editor component update to the new locale without requiring a file to be re-opened
