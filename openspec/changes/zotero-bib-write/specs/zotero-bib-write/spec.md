## ADDED Requirements

### Requirement: Escrita automática de entrada BibTeX ao inserir citação
O sistema SHALL escrever a entrada BibTeX da referência Zotero no arquivo `.bib` alvo do projeto sempre que o usuário inserir uma citação via painel Zotero.

#### Scenario: Inserção com arquivo .bib detectado via \bibliography
- **WHEN** o usuário clica em uma referência no painel Zotero
- **WHEN** o root file contém `\bibliography{nome}` não comentado
- **THEN** a entrada BibTeX é appendada ao arquivo `nome.bib` do projeto
- **THEN** o toast exibe "\\cite{key} inserido → nome.bib atualizado"

#### Scenario: Entrada já existente no .bib
- **WHEN** o usuário insere uma citação cujo citekey já existe no `.bib` alvo
- **THEN** nenhuma escrita ocorre (sem duplicata)
- **THEN** o toast exibe "\\cite{key} inserido (já estava no .bib)"

#### Scenario: Projeto sem .bib detectado — fallback para único .bib
- **WHEN** o `\bibliography{}` está comentado ou ausente no root file
- **WHEN** há exatamente um arquivo `.bib` no projeto
- **THEN** a entrada é escrita nesse único arquivo `.bib`

#### Scenario: Projeto sem nenhum .bib — criação de zotero-refs.bib
- **WHEN** nenhum arquivo `.bib` é encontrado no projeto
- **THEN** o sistema cria `zotero-refs.bib` no projeto com a entrada
- **THEN** o toast exibe "\\cite{key} inserido → zotero-refs.bib criado"
- **THEN** o novo arquivo aparece na file tree
