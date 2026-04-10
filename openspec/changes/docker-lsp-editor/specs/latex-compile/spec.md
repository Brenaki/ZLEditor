## MODIFIED Requirements

### Requirement: Compilação via pdflatex local
O servidor SHALL compilar o projeto LaTeX usando o motor escolhido pelo usuário e retornar o PDF resultante. O motor padrão é `pdflatex`; projetos que usam `fontspec` ou fontes customizadas requerem `xelatex` ou `lualatex`.

#### Scenario: Compilação bem-sucedida
- **WHEN** o usuário clica em "Compilar"
- **THEN** todos os arquivos do projeto são enviados para `POST /compile` com o campo `engine` (pdflatex | xelatex | lualatex)
- **THEN** o servidor executa `{engine}` + bibtex + `{engine}` × 2 em diretório temporário
- **THEN** o PDF é retornado e exibido no viewer inline

#### Scenario: Erro de compilação
- **WHEN** o motor LaTeX encontra um erro
- **THEN** o servidor retorna status 422 com o log de compilação
- **THEN** um modal é aberto automaticamente exibindo o log
- **THEN** o usuário pode copiar o log via botão "Copiar log"

#### Scenario: Engine não instalado
- **WHEN** o servidor não encontra o executável do engine selecionado
- **THEN** retorna status 500 com mensagem indicando qual engine está faltando

## ADDED Requirements

### Requirement: Seletor de motor LaTeX
O sistema SHALL oferecer um seletor de motor LaTeX na toolbar (pdflatex, xelatex, lualatex).

#### Scenario: Projeto com fontspec
- **WHEN** o usuário seleciona `xelatex` ou `lualatex` no seletor
- **THEN** a compilação usa o motor escolhido
- **THEN** projetos com `\usepackage{fontspec}` compilam sem o erro "fontspec requires XeTeX or LuaTeX"

#### Scenario: Padrão pdflatex
- **WHEN** nenhum motor foi selecionado explicitamente
- **THEN** `pdflatex` é usado por padrão
- **THEN** projetos simples sem fontspec continuam funcionando sem mudanças
