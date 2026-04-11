## Why

O ZLEditor roda via `launch.sh` e exige Python no PATH do usuário — uma barreira de entrada alta para quem só quer um editor LaTeX local. Empacotar a aplicação como um executável nativo permite distribuí-la na aba **Releases** do GitHub, tornando a instalação de um clique possível em qualquer plataforma.

## What Changes

- Novo arquivo `app.py` como ponto de entrada do executável: orquestra servidor, verificação de LaTeX, abertura do browser e system tray
- Ícone do ZLEditor gerado programaticamente via Pillow (documento + lápis) — sem asset externo
- Dialog nativo (`tkinter.messagebox`) exibido ao usuário caso `pdflatex` não seja encontrado no PATH, com instruções por plataforma
- Processo roda em background sem janela de terminal; controle via ícone na bandeja do sistema (menu "Abrir" / "Sair")
- Pipeline de CI/CD via GitHub Actions que gera três binários em paralelo (`windows.exe`, `linux`, `macos`) a cada tag `v*` e publica na GitHub Release automaticamente
- `launch.sh` permanece inalterado para usuários que preferem linha de comando

## Capabilities

### New Capabilities

- `desktop-launcher`: Ponto de entrada executável que inicia o servidor, verifica dependências, abre o browser padrão e mantém um ícone na bandeja do sistema
- `latex-detection`: Verificação da presença de `pdflatex` no PATH com dialog de aviso nativo por plataforma
- `release-pipeline`: GitHub Actions workflow para build cross-platform (Windows, Linux, macOS) e publicação automática de releases

### Modified Capabilities

## Impact

- Novas dependências de build: `pyinstaller`, `pystray`, `Pillow` (apenas em dev/CI — não chegam ao usuário final)
- `server.py` não muda; continua sendo o servidor HTTP
- `package.json` / JS não mudam
- O JS bundle precisa ser pré-construído antes do `pyinstaller` empacotar os assets estáticos
