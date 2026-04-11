## Context

O ZLEditor é uma aplicação web local: `server.py` (Python HTTP) serve os assets estáticos e expõe endpoints `/compile` e `/bbt-proxy`. O usuário acessa via browser. Hoje o ponto de entrada é `launch.sh`, que requer Python no PATH e abre o Firefox hardcoded.

O objetivo é empacotar essa stack num único executável por plataforma, sem alterar `server.py` nem o frontend.

## Goals / Non-Goals

**Goals:**
- Executável único por plataforma (Windows `.exe`, Linux binário, macOS binário)
- Sem terminal visível; controle via system tray
- Verificação de LaTeX com dialog nativo antes de abrir o browser
- Ícone gerado em código (sem asset externo)
- Pipeline CI/CD que publica releases automaticamente no GitHub

**Non-Goals:**
- Empacotar LaTeX dentro do executável (inviável — texlive-full > 1 GB)
- Instalador com wizard (NSIS, Inno Setup, .pkg) — binário simples é suficiente para v1
- Auto-update do executável
- Suporte a múltiplas instâncias simultâneas

## Decisions

### D1 — PyInstaller como empacotador

**Escolha:** PyInstaller com `--onefile --noconsole`

**Alternativas consideradas:**
- *Nuitka*: gera código C, binários menores e mais rápidos, mas compilação muito mais lenta em CI e setup mais complexo
- *cx_Freeze*: produz um diretório, não um único arquivo — pior UX para distribuição
- *Tauri*: excelente, mas exigiria reescrever o servidor em Rust ou manter um sidecar Python; complexidade desproporcional para v1

**Rationale:** PyInstaller é a solução mais direta para empacotar um servidor Python existente. `--onefile` entrega um único arquivo para o usuário. `--noconsole` oculta o terminal no Windows.

---

### D2 — `app.py` como ponto de entrada separado

**Escolha:** Criar `app.py` novo; `server.py` não muda.

**Rationale:** Separar responsabilidades. `server.py` continua funcional via `launch.sh` para usuários avançados. `app.py` orquestra: inicia o servidor em thread daemon, verifica LaTeX, abre browser, sobe tray.

**Sequência de inicialização:**
```
app.py
  │
  ├─ generate_icon()          → PIL.Image (documento + lápis)
  ├─ check_latex()            → shutil.which('pdflatex')
  │   └─ se ausente: tkinter.messagebox.showwarning(...)
  ├─ threading.Thread(target=run_server, daemon=True).start()
  ├─ wait_for_server()        → GET http://localhost:8765 até 200 OK
  ├─ webbrowser.open(URL)
  └─ pystray.Icon(...).run()  → bloqueia até "Sair"
```

---

### D3 — Ícone gerado via Pillow em runtime

**Escolha:** Pillow desenha o ícone em memória; passa `PIL.Image` diretamente ao pystray.

**Rationale:** Evita asset externo no repo. Pillow já é dependência obrigatória do pystray. Funciona cross-platform sem conversão de formato.

**Design do ícone (64×64):**
- Fundo transparente
- Folha branca com canto superior direito dobrado (polígono cinza claro)
- Borda cinza escura
- Lápis amarelo diagonal (retângulo + triângulo na ponta + borracha)

---

### D4 — Dialog de aviso LaTeX via `tkinter.messagebox`

**Escolha:** `tkinter.messagebox.showwarning()` com mensagem por plataforma.

**Alternativas consideradas:**
- Página `/setup` no browser: exige abrir browser mesmo sem LaTeX — confuso
- `plyer.notification`: dep extra, notificações são não-bloqueantes (fácil de ignorar)

**Rationale:** `tkinter` está na stdlib (zero dep extra). O dialog é bloqueante — o usuário lê antes do browser abrir. Botões "Continuar" / "Fechar" dão controle explícito.

**Mensagem:**
```
Título: LaTeX não encontrado
Corpo:  O ZLEditor precisa do LaTeX para compilar documentos.

        Windows → instale MiKTeX (miktex.org)
        Linux   → sudo apt install texlive-full
        macOS   → instale MacTeX (tug.org/mactex)

        Você pode continuar e usar o editor, mas a compilação
        não funcionará até o LaTeX ser instalado.
[Continuar mesmo assim]   [Fechar]
```

---

### D5 — GitHub Actions: matrix build + release automática

**Escolha:** `strategy.matrix` com `windows-latest`, `ubuntu-latest`, `macos-latest`. Release publicada via `softprops/action-gh-release` na tag `v*`.

**Rationale:** Cada runner produz o binário nativo da plataforma — não há cross-compilation envolvida. PyInstaller não suporta cross-compile. O JS bundle (`editor-bundle.js`) é construído uma vez no runner Linux antes de empacotar.

**Fluxo do workflow:**
```
on: push tags v*
  └─ job: build (matrix: 3 OSes)
      ├─ checkout
      ├─ npm install + npm run build   (apenas linux runner)
      ├─ pip install pyinstaller pystray pillow
      ├─ pyinstaller app.py --onefile --noconsole --add-data ...
      └─ upload artifact → Release
```

**Nota:** O `editor-bundle.js` precisa ser commitado no repo (ou gerado em cada runner). Recomendado: cada runner roda `npm run build` localmente antes do PyInstaller para garantir consistência.

---

### D6 — Porta fixa vs. dinâmica

**Escolha:** Manter porta 8765 (fixada em `server.py`).

**Rationale:** Alterar para porta dinâmica exigiria passar a porta para o frontend em runtime — complexidade desnecessária para v1. Se a porta estiver ocupada, exibir mensagem de erro clara antes de tentar subir.

## Risks / Trade-offs

| Risco | Mitigação |
|-------|-----------|
| Antivírus Windows flagging o `.exe` (falso positivo comum com PyInstaller) | Documentar no README; não há solução técnica sem code signing |
| macOS Gatekeeper bloqueia binários não assinados | Instruir usuário a usar `xattr -cr ZLEditor-macos` ou ir em Preferências → Segurança |
| Porta 8765 já em uso | Verificar antes de subir; exibir erro via `tkinter.messagebox` |
| `pystray` no Linux requer `libappindicator` ou `libayatana-appindicator` | Documentar dependência; pode não funcionar em distros minimalistas sem desktop |
| Tamanho do binário (~70-100 MB) | Aceitável para uma release; sem mitigação planejada para v1 |

## Open Questions

- Nenhuma — todas as decisões foram tomadas durante a fase de exploração.
