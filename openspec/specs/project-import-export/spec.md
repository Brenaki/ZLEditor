## ADDED Requirements

### Requirement: Importar projeto LaTeX via .zip
O sistema SHALL permitir importar um projeto LaTeX completo a partir de um arquivo .zip.

#### Scenario: Import bem-sucedido
- **WHEN** o usuário clica em "Importar .zip" e seleciona um arquivo
- **THEN** todos os arquivos do zip são extraídos para o ProjectStore
- **THEN** arquivos binários (imagens) são armazenados como base64
- **THEN** o arquivo `main.tex` é definido como raiz (se existir)
- **THEN** `main.tex` é aberto no editor automaticamente

#### Scenario: Export do projeto
- **WHEN** o usuário clica em "Salvar .zip"
- **THEN** todos os arquivos do ProjectStore são empacotados em um .zip
- **THEN** o download é iniciado automaticamente como `projeto.zip`

### Requirement: Autosave em localStorage
O sistema SHALL salvar automaticamente o projeto no localStorage e restaurar ao carregar.

#### Scenario: Autosave acionado
- **WHEN** o usuário edita qualquer arquivo
- **THEN** após 2 segundos de inatividade, o projeto é salvo no localStorage

#### Scenario: Restauração ao carregar
- **WHEN** a página carrega e existe um projeto salvo no localStorage
- **THEN** um modal pergunta "Restaurar sessão anterior de [data/hora]?"
- **THEN** se o usuário confirmar, o projeto é restaurado
- **THEN** se o usuário recusar, o dado é removido do localStorage
