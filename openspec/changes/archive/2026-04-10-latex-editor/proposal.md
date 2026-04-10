## Why

Após o refactor estrutural, a ferramenta precisa evoluir de um simples auxiliar de referências para um editor LaTeX local completo — comparável ao Overleaf, mas rodando inteiramente na máquina do usuário. O objetivo é um fluxo único: importar projeto, escrever, buscar referências Zotero, compilar e visualizar o PDF, tudo sem sair da ferramenta.

## What Changes

- Layout de 3 colunas: árvore de arquivos | editor (CodeMirror) | PDF viewer
- Importação de projetos LaTeX via `.zip` (incluindo imagens e binários)
- Compilação via `pdflatex` local através de novo endpoint `POST /compile` no `server.py`
- Visualização do PDF compilado inline via `<embed>` com blob URL
- Modal de log de compilação com botão copiar
- Arquivo raiz configurável (padrão `main.tex`)
- Painel Zotero retrátil integrado à coluna esquerda
- Autosave em localStorage com prompt de restauração ao carregar
- Salvamento manual exporta o projeto como `.zip`

## Capabilities

### New Capabilities
- `file-tree`: Gerenciamento de arquivos do projeto em memória (texto + binários base64)
- `latex-compile`: Endpoint `/compile` no server.py que roda pdflatex e retorna PDF
- `pdf-viewer`: Exibição do PDF compilado inline ao lado do editor
- `project-import-export`: Import/export de projeto LaTeX como `.zip`
- `codemirror-editor`: Editor com syntax highlight para LaTeX via CodeMirror 6
- `autosave`: Persistência automática em localStorage com prompt de restauração
- `zotero-retractable`: Painel Zotero retrátil com inserção direta no editor

### Modified Capabilities
- (nenhuma — change constrói sobre refactor-structure)

## Impact

- `server.py`: adicionar endpoints `POST /compile` e `GET /compile/log`
- `scripts/`: novos módulos `FileTree.js`, `PdfViewer.js`, `CompileService.js`, `StorageService.js`, atualizar `EditorPanel.js` para CodeMirror
- `styles/`: novos layouts para 3 colunas, file tree, pdf viewer, modal
- Dependência do sistema: `pdflatex` instalado (`texlive-basic` no Arch)
