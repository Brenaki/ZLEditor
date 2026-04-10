## ADDED Requirements

### Requirement: PDF exibido inline ao lado do editor
O sistema SHALL exibir o PDF compilado na terceira coluna, ao lado do editor.

#### Scenario: PDF exibido após compilação
- **WHEN** a compilação é concluída com sucesso
- **THEN** o PDF é carregado via blob URL em um elemento `<embed>`
- **THEN** o viewer ocupa toda a altura disponível da terceira coluna
- **THEN** o timestamp "Compilado às HH:MM" é exibido abaixo do viewer

#### Scenario: Estado inicial sem PDF
- **WHEN** a página carrega sem PDF compilado
- **THEN** a terceira coluna exibe mensagem "Clique em Compilar para ver o PDF"
