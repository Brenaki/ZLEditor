## 1. Estrutura de diretórios e estilos

- [x] 1.1 Criar `styles/base.css` com tokens CSS (cores, raios, fontes Inter, espaçamentos)
- [x] 1.2 Criar `styles/components/button.css`
- [x] 1.3 Criar `styles/components/input.css`
- [x] 1.4 Criar `styles/components/badge.css` (chips de \cite{})
- [x] 1.5 Criar `styles/components/card.css`
- [x] 1.6 Criar `styles/layout/app.css` (grid sidebar + main)
- [x] 1.7 Criar `styles/layout/sidebar.css`
- [x] 1.8 Criar `styles/layout/panel.css`
- [x] 1.9 Configurar `@import` de todos os arquivos em `base.css`

## 2. Módulos JavaScript

- [x] 2.1 Criar `scripts/utils/bibtex.js` — extrair `generateBibtex()` e `makeCiteKey()` do HTML atual
- [x] 2.2 Criar `scripts/services/ZoteroService.js` — extrair lógica de fetch, mapeamento de campos
- [x] 2.3 Criar `scripts/ui/Toast.js` — extrair `showToast()`
- [x] 2.4 Criar `scripts/ui/Sidebar.js` — extrair renderRefs(), filterRefs(), status de conexão
- [x] 2.5 Criar `scripts/ui/BibtexPanel.js` — extrair showBibtex(), copyBibtex(), copyKey(), exportAll()
- [x] 2.6 Criar `scripts/ui/EditorPanel.js` — extrair insertCite(), copyLatex(), clearEditor(), renderChips()
- [x] 2.7 Criar `scripts/app.js` — bootstrap: instancia serviços e componentes, conecta callbacks

## 3. HTML principal

- [x] 3.1 Criar `index.html` com DOCTYPE, meta tags, import de `styles/base.css` e `scripts/app.js`
- [x] 3.2 Mover estrutura HTML de `zotero_latex_tool.html` para `index.html` (sem inline styles/scripts)
- [x] 3.3 Atualizar `launch.sh` para abrir `index.html` em vez de `zotero_latex_tool.html`

## 4. Validação

- [x] 4.1 Testar conexão com Zotero: lista de refs carrega corretamente
- [x] 4.2 Testar seleção de ref: BibTeX exibido corretamente
- [x] 4.3 Testar inserção de \cite{} no editor
- [x] 4.4 Testar exportar biblioteca (.bib)
