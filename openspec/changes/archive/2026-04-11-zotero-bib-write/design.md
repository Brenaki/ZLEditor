## Context

O `ZoteroPanel` renderiza referências e ao clicar em uma chama `_onInsert(key)` — passando só a string do citekey. O `app.js` recebe esse callback e executa `editor.insertAtCursor(\`\\cite{${key}}\`)`. O `generateBibtex(ref)` em `bibtex.js` já converte um objeto ref para BibTeX válido. O `ProjectStore` contém todos os arquivos do projeto em memória.

## Goals / Non-Goals

**Goals:**
- Ao inserir uma citação Zotero, escrever a entrada BibTeX no `.bib` correto do projeto
- Detectar o arquivo `.bib` alvo via `\bibliography{}` no root file
- Não duplicar entradas já presentes
- Feedback no toast indicando qual arquivo foi atualizado (ou criado)

**Non-Goals:**
- Atualizar entradas existentes (apenas inserir se ausente)
- Sincronização reversa (`.bib` → Zotero)
- Suporte a múltiplos arquivos em `\bibliography{a,b,c}` — usa o primeiro

## Decisions

### 1. Mudar assinatura de `onInsert` para `(key, ref)`

**Decisão**: `ZoteroPanel._render()` passa `(el.dataset.key, ref)` para `_onInsert`. O `app.js` passa `onInsert: (key, ref) => { ... }`.

**Rationale**: O objeto `ref` completo é necessário para `generateBibtex()`. Passar só o `key` e depois buscar o ref no `ZoteroPanel` seria acoplamento desnecessário.

---

### 2. Detecção do `.bib` alvo

**Decisão**: Algoritmo sequencial:
```
1. Ler conteúdo do root file (store.get(store.rootFile).content)
2. Regex: /\\bibliography\{([^}]+)\}/  → extrai "Referencias/Referencias"
3. Tentar: store.get("Referencias/Referencias.bib")
4. Fallback: único .bib no projeto
5. Fallback final: criar "zotero-refs.bib" vazio no store
```

**Rationale**: O `\bibliography{}` é a fonte canônica de qual `.bib` o documento usa. Parsear o root file é mais confiável que heurísticas de nome de arquivo.

**Limitação aceita**: `\bibliography{}` comentado ou em arquivo `\input`-ado não é detectado no passo 2 — cai nos fallbacks.

---

### 3. Verificação de duplicata

**Decisão**: Antes de append, verificar se `@.*\{${key},` ou `@.*\{${key}\s` já existe no conteúdo do `.bib`.

**Rationale**: Regex simples, sem parsing completo. Falsos negativos são impossíveis (a key é única). Falsos positivos (key como substring de outra) são improváveis mas aceitáveis — melhor não duplicar.

---

### 4. Feedback no toast

**Decisão**: 
- Escrita bem-sucedida: `"\\cite{key} inserido → refs.bib atualizado"`
- Entrada já existia: `"\\cite{key} inserido (já estava no .bib)"`
- Criou arquivo novo: `"\\cite{key} inserido → zotero-refs.bib criado"`

**Rationale**: O usuário precisa saber que o `.bib` foi modificado para entender que pode recompilar.

## Risks / Trade-offs

- **`\bibliography` em `\input`-ado**: não detectado. Fallback para único `.bib` cobre a maioria dos casos.
- **Projetos sem `.bib`**: cria `zotero-refs.bib`, mas o usuário ainda precisa adicionar `\bibliography{zotero-refs}` ao documento. O toast avisa.
- **Concorrência**: o usuário pode estar editando o `.bib` enquanto a escrita acontece. Como o `ProjectStore` é síncrono (em memória), não há race condition — o append ocorre no objeto em memória e o editor, se o arquivo estiver aberto, não é atualizado automaticamente (aceitável para Fase 1).

## Migration Plan

Nenhum. Mudança aditiva — nenhuma API pública é quebrada.

## Open Questions

Nenhuma pendente.
