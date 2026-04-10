## ADDED Requirements

### Requirement: Compilação via pdflatex local
O servidor SHALL compilar o projeto LaTeX e retornar o PDF resultante.

#### Scenario: Compilação bem-sucedida
- **WHEN** o usuário clica em "Compilar"
- **THEN** todos os arquivos do projeto são enviados para `POST /compile`
- **THEN** o servidor executa pdflatex + bibtex + pdflatex × 2 em diretório temporário
- **THEN** o PDF é retornado e exibido no viewer inline

#### Scenario: Erro de compilação
- **WHEN** pdflatex encontra um erro
- **THEN** o servidor retorna status 422 com o log de compilação
- **THEN** um modal é aberto automaticamente exibindo o log
- **THEN** o usuário pode copiar o log via botão "Copiar log"

#### Scenario: pdflatex não instalado
- **WHEN** o servidor não encontra o executável pdflatex
- **THEN** retorna status 500 com mensagem clara
- **THEN** a UI exibe instrução: "Instale texlive: sudo pacman -S texlive-basic"
