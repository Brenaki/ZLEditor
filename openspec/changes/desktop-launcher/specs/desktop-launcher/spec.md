## ADDED Requirements

### Requirement: Executável inicia o servidor em background
O sistema SHALL iniciar o `server.py` em uma thread daemon ao ser executado, sem abrir janela de terminal.

#### Scenario: Servidor sobe com sucesso
- **WHEN** o usuário executa o binário do ZLEditor
- **THEN** o servidor HTTP sobe na porta 8765 em background, sem janela de terminal visível

#### Scenario: Porta já está em uso
- **WHEN** o usuário executa o binário e a porta 8765 já está ocupada
- **THEN** o sistema exibe um dialog nativo informando que a porta está em uso e encerra

---

### Requirement: Browser padrão é aberto automaticamente
O sistema SHALL abrir o browser padrão do sistema apontando para `http://localhost:8765` após o servidor estar pronto.

#### Scenario: Servidor pronto antes de abrir o browser
- **WHEN** o servidor responde com 200 OK em `http://localhost:8765`
- **THEN** o sistema abre o browser padrão com essa URL

#### Scenario: Servidor não fica pronto em tempo hábil
- **WHEN** o servidor não responde após 10 segundos de tentativas
- **THEN** o sistema exibe um dialog de erro e encerra

---

### Requirement: Ícone na bandeja do sistema
O sistema SHALL exibir um ícone na bandeja do sistema enquanto estiver rodando.

#### Scenario: Ícone aparece ao iniciar
- **WHEN** o executável inicia com sucesso
- **THEN** um ícone (documento + lápis) aparece na bandeja do sistema

#### Scenario: Menu da bandeja — Abrir
- **WHEN** o usuário clica em "Abrir ZLEditor" no menu do ícone da bandeja
- **THEN** o browser padrão é aberto (ou focado) em `http://localhost:8765`

#### Scenario: Menu da bandeja — Sair
- **WHEN** o usuário clica em "Sair" no menu do ícone da bandeja
- **THEN** o ícone é removido, o servidor é encerrado e o processo termina

---

### Requirement: Ícone gerado programaticamente
O sistema SHALL gerar o ícone da bandeja via Pillow em memória, sem depender de arquivos de imagem externos.

#### Scenario: Ícone criado sem arquivo externo
- **WHEN** o executável inicia
- **THEN** o ícone é gerado como `PIL.Image` em memória e passado diretamente ao pystray
