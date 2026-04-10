## 1. Script de lançamento

- [x] 1.1 Criar `launch.sh` que verifica se a porta 8765 está livre
- [x] 1.2 Sobe `python3 -m http.server 8765` em background no diretório do projeto
- [x] 1.3 Abre Firefox em `http://localhost:8765/zotero_latex_tool.html`
- [x] 1.4 Aguarda o Firefox encerrar e mata o servidor HTTP
- [x] 1.5 Tornar `launch.sh` executável (`chmod +x`)

## 2. Correção do método JSON-RPC

- [x] 2.1 Testar o método `item.search` contra a API do Better BibTeX em `localhost:23119`
- [x] 2.2 Se `item.search` não existir, substituir pelo método correto (ex: `item.export` ou endpoint alternativo)
- [x] 2.3 Verificar o mapeamento dos campos retornados pela API para os campos usados na ferramenta (`key`, `title`, `author`, `year`, etc.)
