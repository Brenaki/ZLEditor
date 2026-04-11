## MODIFIED Requirements

### Requirement: Importar projeto LaTeX via .zip
O sistema SHALL permitir importar um projeto LaTeX completo a partir de um arquivo .zip, preservando a estrutura de subpastas intacta.

#### Scenario: Import bem-sucedido
- **WHEN** o usuário clica em "Importar .zip" e seleciona um arquivo
- **THEN** todos os arquivos do zip são extraídos para o ProjectStore com seus caminhos completos (ex: `Fonts/Asap-Regular.ttf`, `images/fig1.png`)
- **THEN** arquivos binários (imagens, fontes .ttf/.otf) são armazenados como base64
- **THEN** o arquivo `main.tex` é definido como raiz (se existir)
- **THEN** `main.tex` é aberto no editor automaticamente

#### Scenario: Zip com pasta raiz única
- **WHEN** o zip embrulha tudo em uma única pasta (ex: `projeto/main.tex`, `projeto/Fonts/font.ttf`)
- **THEN** a pasta raiz comum é removida do path (`projeto/` stripped)
- **THEN** os caminhos relativos internos são preservados (`Fonts/font.ttf`)

#### Scenario: Zip com arquivos na raiz
- **WHEN** o zip contém arquivos e pastas diretamente na raiz (ex: `main.tex`, `Fonts/font.ttf`)
- **THEN** nenhum segmento de path é removido
- **THEN** `Fonts/font.ttf` é armazenado como `Fonts/font.ttf`, não como `font.ttf`

#### Scenario: Export do projeto
- **WHEN** o usuário clica em "Salvar .zip"
- **THEN** todos os arquivos do ProjectStore são empacotados em um .zip mantendo a estrutura de pastas
- **THEN** o download é iniciado automaticamente como `projeto.zip`
