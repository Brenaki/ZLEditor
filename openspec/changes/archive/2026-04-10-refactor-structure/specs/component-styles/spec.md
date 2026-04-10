## ADDED Requirements

### Requirement: Arquivo base com custom properties
O sistema SHALL fornecer `styles/base.css` como fonte única de tokens de design.

#### Scenario: Import centralizado
- **WHEN** `index.html` carrega os estilos
- **THEN** apenas `styles/base.css` é importado diretamente no HTML
- **THEN** `base.css` importa todos os demais arquivos CSS via `@import`

#### Scenario: Todos os tokens definidos em base.css
- **WHEN** qualquer componente precisa de cor, raio, fonte ou espaçamento
- **THEN** existe uma custom property correspondente em `base.css`

### Requirement: CSS de componentes isolados
O sistema SHALL ter um arquivo CSS por componente de UI reutilizável.

#### Scenario: Componente button isolado
- **WHEN** `styles/components/button.css` é carregado
- **THEN** todos os estilos de botão (primário, secundário, ghost) estão nesse arquivo
- **THEN** nenhum outro arquivo CSS define estilos de `.btn`
