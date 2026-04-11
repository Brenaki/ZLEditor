## ADDED Requirements

### Requirement: Build cross-platform via GitHub Actions
O sistema SHALL construir binários nativos para Windows, Linux e macOS em paralelo usando GitHub Actions matrix strategy.

#### Scenario: Build disparado por tag
- **WHEN** uma tag no formato `v*` é criada no repositório
- **THEN** o workflow de build é disparado automaticamente para os três sistemas operacionais

#### Scenario: Build para cada plataforma
- **WHEN** o workflow executa no runner `windows-latest`
- **THEN** é gerado `ZLEditor-windows.exe` como artefato

#### Scenario: Build Linux
- **WHEN** o workflow executa no runner `ubuntu-latest`
- **THEN** é gerado `ZLEditor-linux` como artefato

#### Scenario: Build macOS
- **WHEN** o workflow executa no runner `macos-latest`
- **THEN** é gerado `ZLEditor-macos` como artefato

---

### Requirement: JS bundle pré-construído antes do empacotamento
O sistema SHALL construir o `editor-bundle.js` via npm/esbuild antes de empacotar com PyInstaller em cada runner.

#### Scenario: Bundle construído em cada plataforma
- **WHEN** o workflow roda em qualquer runner
- **THEN** `npm install` e `npm run build` são executados antes do PyInstaller para garantir que `editor-bundle.js` esteja atualizado

---

### Requirement: Release automática no GitHub
O sistema SHALL publicar os três binários como assets de uma GitHub Release ao final do workflow.

#### Scenario: Release criada com todos os binários
- **WHEN** os três builds completam com sucesso
- **THEN** uma GitHub Release é criada (ou atualizada) com os três binários como assets para download

#### Scenario: Falha de build não publica release parcial
- **WHEN** qualquer um dos três builds falha
- **THEN** nenhuma release é publicada até que todos os builds sejam bem-sucedidos

---

### Requirement: Assets estáticos incluídos no executável
O PyInstaller SHALL incluir todos os arquivos estáticos (HTML, CSS, JS, scripts) dentro do binário gerado.

#### Scenario: App funciona sem diretório externo
- **WHEN** o usuário executa o binário em qualquer diretório
- **THEN** o servidor serve os assets estáticos corretamente sem depender de arquivos externos
