## ADDED Requirements

### Requirement: Verificação de LaTeX no PATH
O sistema SHALL verificar a presença de `pdflatex` no PATH do sistema antes de abrir o browser.

#### Scenario: LaTeX encontrado
- **WHEN** `pdflatex` está disponível no PATH
- **THEN** o sistema continua a inicialização normalmente sem exibir nenhum aviso

#### Scenario: LaTeX não encontrado
- **WHEN** `pdflatex` não está disponível no PATH
- **THEN** o sistema exibe um dialog de aviso nativo via `tkinter.messagebox` antes de abrir o browser

---

### Requirement: Dialog de aviso com instruções por plataforma
O sistema SHALL exibir instruções de instalação do LaTeX específicas para a plataforma detectada.

#### Scenario: Aviso no Windows
- **WHEN** LaTeX não é encontrado e o sistema operacional é Windows
- **THEN** o dialog menciona MiKTeX (miktex.org) como opção de instalação

#### Scenario: Aviso no Linux
- **WHEN** LaTeX não é encontrado e o sistema operacional é Linux
- **THEN** o dialog menciona `sudo apt install texlive-full` como comando de instalação

#### Scenario: Aviso no macOS
- **WHEN** LaTeX não é encontrado e o sistema operacional é macOS
- **THEN** o dialog menciona MacTeX (tug.org/mactex) como opção de instalação

---

### Requirement: Usuário pode continuar sem LaTeX
O dialog de aviso SHALL oferecer a opção de continuar usando o editor sem LaTeX instalado.

#### Scenario: Continuar sem LaTeX
- **WHEN** o usuário clica em "Continuar mesmo assim" no dialog de aviso
- **THEN** o sistema abre o browser normalmente; compilação ficará indisponível

#### Scenario: Fechar ao ver aviso
- **WHEN** o usuário clica em "Fechar" no dialog de aviso
- **THEN** o processo encerra sem abrir o browser
