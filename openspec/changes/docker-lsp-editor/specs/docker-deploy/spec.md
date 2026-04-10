## ADDED Requirements

### Requirement: Dockerfile multi-stage
O sistema SHALL ter um `Dockerfile` com build multi-stage: stage de build (Node.js + esbuild) e stage de runtime (Python 3 + TeX Live full).

#### Scenario: Build da imagem
- **WHEN** o usuário executa `docker build`
- **THEN** o stage de build instala dependências npm e gera `scripts/editor-bundle.js`
- **THEN** o stage de runtime copia o bundle e todos os arquivos da aplicação
- **THEN** a imagem final contém Python 3, TeX Live full e o bundle, sem Node.js

#### Scenario: pdflatex disponível no container
- **WHEN** o usuário compila um projeto LaTeX
- **THEN** `pdflatex` e `bibtex` estão disponíveis no PATH do container
- **THEN** a compilação produz o PDF corretamente

### Requirement: docker-compose com network=host
O sistema SHALL ter um `docker-compose.yml` com `network_mode: host` para que o container compartilhe a rede do host.

#### Scenario: Acesso ao Zotero BBT
- **WHEN** o container está rodando com `network_mode: host`
- **THEN** `localhost:23119` no container resolve para o Zotero BBT do host
- **THEN** o proxy `/bbt-proxy` do `server.py` funciona sem alterações de código

#### Scenario: Acesso via browser do host
- **WHEN** o container está rodando
- **THEN** o browser do host acessa a aplicação em `http://localhost:8765`

### Requirement: Inicialização com um comando
O sistema SHALL ser inicializável com `docker compose up --build` sem pré-requisitos além do Docker instalado.

#### Scenario: Primeiro uso
- **WHEN** o usuário executa `docker compose up --build` pela primeira vez
- **THEN** a imagem é construída com TeX Live full e bundle do editor
- **THEN** o servidor inicia na porta 8765
