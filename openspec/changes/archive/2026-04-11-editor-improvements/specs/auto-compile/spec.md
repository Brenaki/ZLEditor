## ADDED Requirements

### Requirement: Toggle de compilação automática
O sistema SHALL oferecer um toggle na toolbar que, quando ativo, compila o projeto automaticamente após 2 segundos de inatividade no editor.

#### Scenario: Auto-compile ativado e usuário para de digitar
- **WHEN** o toggle de auto-compile está ativo
- **WHEN** o usuário edita um arquivo `.tex` e para de digitar por 2 segundos
- **THEN** a compilação é iniciada automaticamente
- **THEN** o PDF é atualizado ao término da compilação

#### Scenario: Auto-compile não dispara em arquivo .bib
- **WHEN** o toggle de auto-compile está ativo
- **WHEN** o arquivo ativo no editor é um `*.bib`
- **THEN** nenhuma compilação automática é disparada ao editar esse arquivo

#### Scenario: Auto-compile com compilação já em progresso
- **WHEN** o toggle está ativo e uma compilação já está em andamento
- **WHEN** o timer de 2 segundos expira
- **THEN** nenhuma nova compilação é enfileirada (a compilação em progresso continua)

#### Scenario: Estado do toggle persiste entre sessões
- **WHEN** o usuário ativa o toggle e recarrega a página
- **THEN** o toggle permanece no estado ativo
