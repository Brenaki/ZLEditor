## 1. Preparação e dependências

- [ ] 1.1 Adicionar `pystray` e `Pillow` ao `requirements-build.txt` (ou documentar como deps de dev/CI)
- [ ] 1.2 Adicionar script `npm run build` ao `package.json` se ainda não existir (para o CI poder rodar)
- [ ] 1.3 Verificar que `editor-bundle.js` é gerado corretamente via `npx esbuild` antes de prosseguir

## 2. Implementar `app.py` — ponto de entrada do executável

- [ ] 2.1 Criar `app.py` com a função `generate_icon()` que desenha documento + lápis via Pillow e retorna `PIL.Image`
- [ ] 2.2 Implementar `check_latex()` usando `shutil.which('pdflatex')` e detectar plataforma via `sys.platform`
- [ ] 2.3 Implementar dialog de aviso LaTeX com `tkinter.messagebox.askokcancel()` com mensagem por plataforma (Windows/Linux/macOS)
- [ ] 2.4 Implementar `start_server()` que inicia `server.py` em `threading.Thread(daemon=True)`
- [ ] 2.5 Implementar `wait_for_server()` que faz GET em `http://localhost:8765` com retry até 10 segundos
- [ ] 2.6 Implementar verificação de porta ocupada antes de subir o servidor; exibir dialog de erro se necessário
- [ ] 2.7 Implementar abertura do browser via `webbrowser.open('http://localhost:8765')`
- [ ] 2.8 Implementar system tray com `pystray.Icon`, menu "Abrir ZLEditor" e "Sair"
- [ ] 2.9 Conectar tudo no `main()`: icon → check_latex → start_server → wait → browser → tray.run()

## 3. Configuração do PyInstaller

- [ ] 3.1 Criar `ZLEditor.spec` com `--onefile`, `--noconsole`, e `--add-data` para todos os assets estáticos (HTML, CSS, JS, scripts, styles)
- [ ] 3.2 Garantir que `app.py` localiza os assets via `sys._MEIPASS` quando rodando como executável empacotado
- [ ] 3.3 Testar build local: `pyinstaller ZLEditor.spec` e verificar que o binário gerado sobe o servidor e abre o browser

## 4. GitHub Actions workflow

- [ ] 4.1 Criar `.github/workflows/release.yml` com trigger em `push: tags: ['v*']`
- [ ] 4.2 Configurar `strategy.matrix` com `os: [windows-latest, ubuntu-latest, macos-latest]`
- [ ] 4.3 Adicionar step de `npm install` + `npm run build` em cada runner
- [ ] 4.4 Adicionar step de `pip install pyinstaller pystray pillow`
- [ ] 4.5 Adicionar step de `pyinstaller ZLEditor.spec` com nome de saída por plataforma
- [ ] 4.6 Configurar upload dos binários como artefatos e publicação na GitHub Release via `softprops/action-gh-release`

## 5. Documentação e polish

- [ ] 5.1 Atualizar `README.md` com seção "Download" apontando para GitHub Releases
- [ ] 5.2 Documentar no README que LaTeX deve ser instalado separadamente (com links por plataforma)
- [ ] 5.3 Documentar workaround para macOS Gatekeeper (`xattr -cr ZLEditor-macos` ou via Preferências de Segurança)
- [ ] 5.4 Documentar que antivírus no Windows pode exibir falso positivo (comportamento esperado do PyInstaller)
