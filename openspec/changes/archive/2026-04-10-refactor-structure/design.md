## Context

O projeto é uma ferramenta local servida via `server.py` (Python http.server). Não há build tool — tudo é servido como arquivos estáticos. ES modules (`<script type="module">`) funcionam nativamente com HTTP server. O arquivo atual `zotero_latex_tool.html` será renomeado para `index.html` e esvaziado para só conter estrutura HTML + imports.

## Goals / Non-Goals

**Goals:**
- Estrutura de arquivos clara: `scripts/services/`, `scripts/ui/`, `scripts/utils/`, `styles/components/`, `styles/layout/`
- Cada módulo JS tem responsabilidade única (S de SOLID)
- Tokens CSS centralizados em `styles/base.css`
- Estética Shadcn-inspired: Inter font, bordas sutis, sem gradients, espaçamento consistente
- Funcionalidade 100% preservada

**Non-Goals:**
- Build tool (Vite, Webpack) — não necessário para este escopo
- TypeScript — vanilla JS com JSDoc suficiente
- Temas dark/light — fica para o change latex-editor

## Decisions

### ES Modules nativos (sem bundler)
`<script type="module" src="scripts/app.js">` — o browser resolve imports nativamente via HTTP. Zero configuração, funciona com `server.py` existente.

### Estrutura de módulos JS

```
scripts/
├── app.js                    ← bootstrap: instancia serviços e componentes UI
├── services/
│   └── ZoteroService.js      ← fetch /bbt-proxy, mapeamento de campos, makeCiteKey
├── ui/
│   ├── Sidebar.js            ← lista de refs, status de conexão, busca
│   ├── BibtexPanel.js        ← exibição e cópia de BibTeX
│   ├── EditorPanel.js        ← textarea LaTeX, inserção de \cite{}
│   └── Toast.js              ← notificações temporárias
└── utils/
    └── bibtex.js             ← generateBibtex() — função pura, sem I/O
```

### Estrutura de estilos CSS

```
styles/
├── base.css                  ← @import de todos; custom properties (tokens)
├── components/
│   ├── button.css
│   ├── input.css
│   ├── badge.css             ← \cite{key} chips
│   └── card.css
└── layout/
    ├── app.css               ← grid 2 colunas (sidebar + main)
    ├── sidebar.css
    └── panel.css
```

### Tokens CSS (Shadcn-inspired)

Definidos em `styles/base.css` como `--color-*`, `--radius-*`, `--font-*`. Sem dependência de framework — CSS puro.

### Comunicação entre módulos

Sem framework reativo. `app.js` passa callbacks explícitos na construção dos componentes UI. Simples e rastreável.

```
app.js
  └── new ZoteroService()
  └── new Sidebar({ onConnect, onSelect, onFilter })
  └── new BibtexPanel()
  └── new EditorPanel()
```

## Risks / Trade-offs

- [ES modules sem bundler → sem tree-shaking] → Irrelevante neste tamanho de projeto
- [CSS custom properties não funcionam em IE] → Não é alvo; Firefox moderno garantido
- [Refactor pode quebrar funcionalidade] → Manter os mesmos nomes de funções internamente facilita validação
