## Context

O editor tem um autocomplete de `\cite{}` alimentado por `getCitekeys`, uma callback definida em `app.js:38` que hoje retorna exclusivamente `zoteroPanel?.getCitekeys() ?? []`. O `ZoteroService` busca refs via BBT proxy do Zotero; se indisponível, cai em dados mock.

Projetos LaTeX tipicamente incluem um `refs.bib` dentro do projeto. O `ProjectStore` já mantém o conteúdo de todos os arquivos do projeto em memória. A `FileTree` exibe todos esses arquivos, incluindo `.bib`.

## Goals / Non-Goals

**Goals:**
- Parsear `*.bib` do projeto e expor seus citekeys para o autocomplete
- Manter cache dos citekeys com invalidação quando o arquivo `.bib` ativo for editado
- Agregar citekeys de Zotero + `.bib` no `getCitekeys` de `app.js`
- Zero novas dependências — parser via regex

**Non-Goals:**
- Parser completo de campos BibTeX (title, author, year) — apenas citekeys nesta fase
- Novo painel de UI para gerenciar referências `.bib`
- Suporte a `.bib` fora do projeto (arquivos externos do filesystem)
- Substituir ou modificar o `ZoteroPanel`

## Decisions

### 1. `BibService` como classe de cache com método `ingest()`

**Decisão**: Criar `scripts/services/BibService.js` com a seguinte interface:
```js
class BibService {
  ingest(filename, text)   // parseia e armazena citekeys do arquivo
  remove(filename)         // remove citekeys de um arquivo deletado
  getCitekeys()            // retorna array de strings (todos os citekeys, deduplicados)
}
```

**Rationale**: Espelha o padrão já estabelecido pelo `ZoteroService`. Mantém o cache interno (`Map<filename, string[]>`), permitindo múltiplos `.bib` no projeto sem conflito. A deduplicação acontece no `getCitekeys()`.

**Alternativa considerada**: Variável local em `app.js`. Descartada: mistura responsabilidades e não encapsula a lógica de múltiplos arquivos.

---

### 2. Parser de citekeys via regex

**Decisão**: Extrair citekeys com regex simples:
```js
/@\w+\{([^,\s]+)/g
```

**Rationale**: Para o caso de uso de autocomplete, apenas o citekey é necessário. BibTeX é notoriamente irregular; um parser completo precisaria de uma lib externa. A regex cobre 100% dos casos válidos de citekey.

**Alternativa considerada**: Lib `@retorquere/bibtex-parser`. Descartada para Fase 1 — zero deps é uma vantagem, e parser completo só é necessário quando houver UI de exibição de refs do `.bib`.

---

### 3. Ingestão inicial no import do projeto

**Decisão**: Em `app.js`, ao reconstruir a `FileTree` (após import), iterar sobre os arquivos do `store` e chamar `bibService.ingest(name, text)` para cada `*.bib` encontrado.

**Rationale**: O import já dispara uma reconstrução do estado do projeto. É o momento natural para popular o cache.

---

### 4. Invalidação de cache em tempo real via `onChange`

**Decisão**: O callback `onChange` em `app.js` dispara a cada modificação no editor (não em um evento de "salvar" explícito). Adicionar verificação:
```js
onChange: content => {
  if (_activeFile) store.setText(_activeFile, content);
  if (_activeFile?.endsWith('.bib')) bibService.ingest(_activeFile, content);
  storage.scheduleSave(store);
}
```

**Rationale**: `onChange` já é o ponto em que o `ProjectStore` é atualizado — a re-ingestão acontece no mesmo momento, em tempo real. O autocomplete reflete cada edição no `.bib` sem nenhum gesto adicional do usuário (sem Ctrl+S, sem botão). Isso é intencional: o `.bib` deve se comportar como uma fonte de dados viva enquanto o usuário edita.

---

### 5. Agregação em `app.js`

**Decisão**: `getCitekeys` passa a ser:
```js
getCitekeys: () => [
  ...new Set([
    ...zoteroPanel?.getCitekeys() ?? [],
    ...bibService.getCitekeys(),
  ])
]
```

**Rationale**: O `Editor` não sabe de onde vêm os citekeys. A agregação fica em `app.js`, que já orquestra todos os serviços. O `Set` garante deduplicação sem custo adicional.

## Risks / Trade-offs

- **`.bib` malformado** → regex não extrai nada; autocomplete continua funcional com citekeys do Zotero. Sem crash, sem erro visível ao usuário.
- **`.bib` muito grande (milhares de entradas)** → regex em string grande é O(n), negligível para arquivos bibliográficos típicos (< 1 MB).
- **Múltiplos `.bib` com citekeys idênticos** → `Set` na agregação final elimina duplicatas sem aviso. Comportamento esperado e aceitável.
- **Arquivo `.bib` deletado do projeto** → `BibService.remove(filename)` precisa ser chamado. Requer hook no `handleFileDelete` de `app.js`. Risco de esquecer este caso.

## Migration Plan

1. Criar `BibService.js`
2. Instanciar em `app.js`
3. Adicionar ingestão no import do projeto
4. Adicionar hook no `onChange`
5. Adicionar hook no `handleFileDelete`
6. Atualizar `getCitekeys` para agregar

Sem migração de dados — `localStorage` e `ProjectStore` não são afetados.

## Open Questions

- Nenhuma. Todas as decisões foram tomadas durante a fase de exploração.
