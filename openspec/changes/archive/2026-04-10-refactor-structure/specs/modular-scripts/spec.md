## ADDED Requirements

### Requirement: Módulos JS com responsabilidade única
O sistema SHALL organizar o JavaScript em módulos ES separados por responsabilidade, sem funções globais.

#### Scenario: Serviço Zotero isolado
- **WHEN** o usuário clica em "Conectar"
- **THEN** apenas `ZoteroService.js` realiza a chamada de rede ao `/bbt-proxy`
- **THEN** os dados retornados são mapeados para objetos de referência e devolvidos ao caller

#### Scenario: Geração de BibTeX pura
- **WHEN** uma referência é selecionada
- **THEN** `utils/bibtex.js` gera o texto BibTeX sem acessar DOM ou rede
- **THEN** o resultado é uma string retornada ao componente UI

#### Scenario: Bootstrap via app.js
- **WHEN** a página carrega
- **THEN** `app.js` instancia serviços e componentes, conectando callbacks entre eles
- **THEN** nenhum outro módulo importa diretamente outro componente UI

### Requirement: Estilos divididos por componente
O sistema SHALL organizar o CSS em arquivos separados por componente e layout, com tokens centralizados.

#### Scenario: Tokens CSS centralizados
- **WHEN** qualquer componente precisa de uma cor, raio ou fonte
- **THEN** usa uma custom property definida em `styles/base.css`
- **THEN** nenhum valor hardcoded de cor aparece fora de `base.css`

#### Scenario: Estética Shadcn-inspired aplicada
- **WHEN** a página é carregada
- **THEN** a tipografia usa a fonte Inter
- **THEN** bordas são sutis (0.5px–1px), sem sombras pesadas
- **THEN** o espaçamento segue escala de 4px
