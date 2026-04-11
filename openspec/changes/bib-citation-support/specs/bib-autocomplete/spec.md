## ADDED Requirements

### Requirement: Extração de citekeys de arquivos .bib do projeto
O sistema SHALL detectar e parsear automaticamente todos os arquivos `*.bib` presentes no projeto, extraindo seus citekeys para uso no autocomplete do editor.

#### Scenario: Projeto importado com arquivo .bib
- **WHEN** o usuário importa um projeto (ZIP) que contém um ou mais arquivos `*.bib`
- **THEN** o `BibService` parseia todos os arquivos `*.bib` encontrados
- **THEN** os citekeys extraídos ficam disponíveis no autocomplete de `\cite{}`

#### Scenario: Projeto sem arquivo .bib
- **WHEN** o usuário importa um projeto sem nenhum arquivo `*.bib`
- **THEN** o `BibService` retorna uma lista vazia de citekeys
- **THEN** o autocomplete continua funcionando normalmente com citekeys do Zotero (se disponível)

### Requirement: Invalidação de cache ao editar arquivo .bib
O sistema SHALL re-parsear o arquivo `.bib` e atualizar o cache de citekeys sempre que o usuário salvar modificações em um arquivo `*.bib` aberto no editor.

#### Scenario: Usuário edita e salva um arquivo .bib ativo
- **WHEN** o arquivo ativo no editor é um `*.bib`
- **WHEN** o conteúdo do arquivo é modificado (callback `onChange` disparado)
- **THEN** o `BibService` re-ingere o conteúdo atualizado
- **THEN** o autocomplete de `\cite{}` reflete imediatamente os novos citekeys

#### Scenario: Citekey adicionado ao .bib ativo
- **WHEN** o usuário adiciona uma nova entrada `@type{newkey, ...}` ao arquivo `.bib` ativo
- **WHEN** o conteúdo é persistido via `onChange`
- **THEN** `newkey` passa a aparecer nas sugestões de `\cite{}`

### Requirement: Agregação de citekeys de múltiplos providers
O sistema SHALL agregar citekeys do `BibService` e do `ZoteroPanel` sem duplicatas, expondo a lista combinada para o autocomplete do editor.

#### Scenario: Zotero ativo e .bib presente no projeto
- **WHEN** o Zotero está conectado e retorna refs
- **WHEN** o projeto contém um arquivo `.bib` com citekeys
- **THEN** o autocomplete exibe sugestões de ambas as fontes
- **THEN** citekeys idênticos entre as fontes aparecem apenas uma vez

#### Scenario: Apenas .bib disponível (Zotero offline)
- **WHEN** o Zotero não está acessível (retorna lista vazia)
- **WHEN** o projeto contém um arquivo `.bib`
- **THEN** o autocomplete exibe apenas os citekeys do `.bib`
- **THEN** nenhum erro é exibido ao usuário
