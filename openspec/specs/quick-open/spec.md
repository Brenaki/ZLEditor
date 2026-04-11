## ADDED Requirements

### Requirement: Overlay de busca rápida via Ctrl+P
O sistema SHALL abrir um overlay de busca rápida ao pressionar Ctrl+P, permitindo navegar por arquivos do projeto por nome ou buscar conteúdo dentro dos arquivos.

#### Scenario: Abrir overlay com Ctrl+P
- **WHEN** o usuário pressiona Ctrl+P (com foco no editor ou em qualquer parte da página)
- **THEN** o overlay de busca é exibido com o input em foco
- **THEN** o comportamento padrão do browser (imprimir) é cancelado

#### Scenario: Fechar overlay com Escape
- **WHEN** o overlay está aberto
- **WHEN** o usuário pressiona Escape
- **THEN** o overlay é fechado sem abrir nenhum arquivo

### Requirement: Busca de arquivo por nome
O sistema SHALL filtrar arquivos do projeto em tempo real conforme o usuário digita no overlay, sem prefixo.

#### Scenario: Filtro por nome de arquivo
- **WHEN** o overlay está aberto e o usuário digita texto sem prefixo `%`
- **THEN** a lista exibe arquivos do projeto cujo nome contém o texto digitado (case-insensitive)

#### Scenario: Abrir arquivo selecionado
- **WHEN** o usuário pressiona Enter ou clica em um resultado da lista de arquivos
- **THEN** o arquivo é aberto no editor
- **THEN** o overlay é fechado

#### Scenario: Navegação por teclado na lista
- **WHEN** o overlay está aberto com resultados visíveis
- **WHEN** o usuário pressiona ↑ ou ↓
- **THEN** o item destacado na lista muda conforme a direção

### Requirement: Busca de conteúdo com prefixo %
O sistema SHALL buscar o texto (sem o `%`) em todos os arquivos texto do projeto quando o input começa com `%`.

#### Scenario: Busca de conteúdo em arquivo
- **WHEN** o usuário digita `%tailwind` no overlay
- **THEN** a lista exibe resultados no formato `arquivo.tex:44 — contexto da linha`
- **THEN** apenas arquivos texto (não binários) são buscados

#### Scenario: Abrir resultado de busca em conteúdo na linha correta
- **WHEN** o usuário seleciona um resultado do modo `%`
- **THEN** o arquivo é aberto no editor
- **THEN** o cursor é posicionado na linha do resultado
- **THEN** a linha é centralizada na viewport do editor
