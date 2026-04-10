## ADDED Requirements

### Requirement: Gerenciamento de arquivos do projeto em memória
O sistema SHALL manter todos os arquivos do projeto em memória organizado em um ProjectStore.

#### Scenario: Criar novo arquivo
- **WHEN** o usuário clica em "Novo arquivo" na file tree
- **THEN** um arquivo vazio é adicionado ao ProjectStore
- **THEN** o arquivo aparece na árvore e é aberto no editor

#### Scenario: Remover arquivo
- **WHEN** o usuário remove um arquivo da file tree
- **THEN** o arquivo é removido do ProjectStore
- **THEN** se o arquivo estava aberto, o editor mostra o arquivo raiz

#### Scenario: Arquivo raiz configurável
- **WHEN** o usuário clica com botão direito em um arquivo .tex
- **THEN** pode definir esse arquivo como raiz de compilação
- **THEN** a compilação usa esse arquivo como entry point
