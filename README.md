# T•PRESALES — Pre-Sales Cockpit

Cockpit multi-projeto offline de pré-vendas (HTML/CSS/JS), com marca Magenta **T•PRESALES**. Interface em **pt-BR**.

## Como abrir

1. Clone ou baixe este repositório.
2. Abra `index.html` no Chrome ou Edge (`file://`), **ou** sirva a pasta com um servidor estático, por exemplo:

```bash
npx --yes serve .
# ou
python3 -m http.server 8080
```

3. Não é necessário build, Node nem backend.

## O que funciona (MVP)

- **Portfólio**: lista de projetos com busca e filtros (etapa, status, prioridade).
- **CRUD**: criar, abrir, editar metadados e excluir (com confirmação).
- **Cockpit operacional por projeto**: ao abrir um projeto, as abas Dashboard, Calendário, Discovery, Solution Design, Cotação, Frete, Pricing, Approval, Proposta, Regras, Riscos e Gates ficam vinculadas **somente** àquele projeto.
- **Seed Nilko**: na primeira carga é criado o projeto amostra “Nilko — Starlink Mobile” com o conteúdo operacional do cockpit anterior (nada perdido).
- **Persistência**: auto-save via `localStorage` (chave `preSalesCockpitV1`).
- **Backup / Restore** JSON do portfólio completo e **Reset** com confirmação.
- Valores monetários em formato **pt-BR**; conteúdo do usuário escapado no HTML.

## Arquitetura

```
index.html
styles.css
js/
  ui.js          — helpers (esc, money, navegação)
  storage.js     — storageService (único ponto de localStorage)
  state.js       — fonte única: state.projetos (+ projetoAtivoId)
  defaults.js    — payload operacional vazio + seed Nilko
  projects.js    — CRUD, filtros, backup/restore/reset
  finance.js     — frete e pricing
  ops.js         — abas operacionais ligadas ao projeto ativo
  dashboard.js   — portfólio / modal de metadados
  app.js         — bootstrap
docs/
  SPEC-v1.0.md
```

- **Fonte única de verdade**: `state.projetos`. As views não mantêm cópias duplicadas do projeto.
- **Payload operacional** aninhado em `projeto.ops` (tasks, bom, quotes, frete, prices, approval, proposal, rules, risks, checks, etc.).
- **Etapas**: Prospecção, Qualificação, Descoberta, Escopo, Precificação, Proposta enviada, Negociação, Aprovado, Em execução, Handover, Encerrado, Perdido.
- **Defaults de metadados**: status `Em análise`, prioridade `Média`.

## Isolamento entre projetos

Criar um segundo projeto e alternar entre ele e o seed Nilko **não** deve misturar dados operacionais: cada projeto possui seu próprio objeto `ops`.

## Próximo passo

- Importação de projetos via **CSV do Microsoft Planner** (fora do escopo deste MVP).

## Importante

Ferramenta de apoio operacional. **Não** substitui o precificador oficial nem aprovações de Pricing, Comercial, Fiscal, Jurídico, Produto ou Operações.

## Carteira cruzada (16/09/2026)

O portfólio padrão agora nasce com **52 projetos** cruzados entre:
- pastas em `Documents/OneDrive_1_16-09-2026`
- export Planner `GERENCIAMENTO - PRÉ-VENDA`

Arquivos:
- `data/carteira-cruzada-2026-09-16.json`
- `js/carteira-seed.js`

No app, use **Importar carteira cruzada** para substituir o portfólio local por essa base (faça Backup JSON antes). O projeto Nilko mantém o ops operacional completo (BoM, pricing, cotações).

Se você já abriu o app antes e só vê a Nilko, clique em **Importar carteira cruzada** ou limpe o `localStorage` / use Reset.

