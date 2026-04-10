## 1. Server — endpoint de compilação

- [x] 1.1 Adicionar `POST /compile` no `server.py`: recebe JSON com arquivos, escreve em `/tmp/`, executa pdflatex
- [x] 1.2 Implementar sequência de compilação: `pdflatex → bibtex (se .bib) → pdflatex → pdflatex`
- [x] 1.3 Retornar PDF como `application/pdf` em caso de sucesso
- [x] 1.4 Retornar JSON `{error: true, log: "..."}` com status 422 em caso de falha
- [x] 1.5 Detectar pdflatex ausente e retornar mensagem de instalação (status 500)
- [x] 1.6 Limpar diretório temporário após cada compilação

## 2. ProjectStore e gerenciamento de arquivos

- [x] 2.1 Criar `scripts/store/ProjectStore.js` — Map de arquivos, rootFile, métodos CRUD
- [x] 2.2 Suporte a arquivos binários: armazenar como base64, enviar ao servidor com flag `binary: true`

## 3. Import/Export .zip

- [x] 3.1 Carregar JSZip via CDN no `index.html`
- [x] 3.2 Criar `scripts/services/ZipService.js` — `importZip(file)` e `exportZip(projectStore)`
- [x] 3.3 Botão "Importar .zip" na toolbar: abre file input, chama ZipService.importZip
- [x] 3.4 Botão "Salvar .zip" na toolbar: chama ZipService.exportZip, dispara download

## 4. Autosave

- [x] 4.1 Criar `scripts/services/StorageService.js` — save/load/clear com localStorage
- [x] 4.2 Debounce de 2s no ProjectStore: salva automaticamente após edição
- [x] 4.3 No load: verificar localStorage, exibir modal de restauração se existir dados
- [x] 4.4 Modal de restauração: botões "Restaurar" e "Descartar" (remove do localStorage)

## 5. Layout 3 colunas

- [x] 5.1 Atualizar `styles/layout/app.css` para grid de 3 colunas (file-tree | editor | pdf-viewer)
- [x] 5.2 Criar `styles/layout/file-tree.css`
- [x] 5.3 Criar `styles/layout/pdf-viewer.css`
- [x] 5.4 Criar `styles/components/modal.css` (para log e restauração)
- [x] 5.5 Criar `styles/components/toolbar.css`

## 6. FileTree UI

- [x] 6.1 Criar `scripts/ui/FileTree.js` — renderiza lista de arquivos, destaca ativo
- [x] 6.2 Botão "Novo arquivo" com input inline para nome
- [x] 6.3 Context menu (botão direito) em .tex para definir como raiz de compilação

## 7. Editor CodeMirror

- [x] 7.1 Adicionar import map no `index.html` para CodeMirror 6 via esm.sh
- [x] 7.2 Criar `scripts/ui/Editor.js` — wrapper CodeMirror com método `insertAtCursor(text)`
- [x] 7.3 Ao trocar arquivo na FileTree, salvar conteúdo atual e carregar novo no CodeMirror

## 8. PDF Viewer

- [x] 8.1 Criar `scripts/ui/PdfViewer.js` — recebe ArrayBuffer, cria blob URL, atualiza `<embed>`
- [x] 8.2 Exibir spinner na toolbar durante compilação
- [x] 8.3 Exibir timestamp "Compilado às HH:MM" após compilação bem-sucedida

## 9. Modal de log

- [x] 9.1 Criar `scripts/ui/LogModal.js` — abre `<dialog>` com log, botão copiar
- [x] 9.2 Abrir modal automaticamente em caso de erro de compilação
- [x] 9.3 Botão "Ver log" na toolbar abre modal com último log (mesmo em caso de sucesso)

## 10. Painel Zotero retrátil

- [x] 10.1 Mover ZoteroPanel para coluna esquerda abaixo da FileTree
- [x] 10.2 Toggle button que anima abertura/fechamento (CSS transition na height)
- [x] 10.3 Ao selecionar ref no painel, chamar `editor.insertAtCursor(\`\\cite{key}\`)`
