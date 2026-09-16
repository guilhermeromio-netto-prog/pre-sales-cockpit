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
- **Seed carteira cruzada**: na primeira carga (sem `localStorage`) entram os **52** projetos OneDrive × Planner (16/09/2026); o ops enriquecido da **Nilko** é mesclado sem duplicar o projeto.
- **Persistência**: auto-save via `localStorage` (chave `preSalesCockpitV1`).
- **Backup / Restore** JSON do portfólio completo e **Reset** com confirmação.
- Valores monetários em formato **pt-BR**; conteúdo do usuário escapado no HTML.

## Arquitetura

```
index.html
styles.css
js/
  ui.js            — helpers (esc, money, navegação)
  storage.js       — storageService (único ponto de localStorage)
  state.js         — fonte única: state.projetos (+ projetoAtivoId)
  defaults.js      — payload operacional vazio + seed Nilko
  carteira-seed.js — seed estático da carteira cruzada (PSC.CARTEIRA_SEED)
  projects.js      — CRUD, filtros, backup/restore/reset/import carteira
  finance.js       — frete e pricing
  ops.js           — abas operacionais ligadas ao projeto ativo
  dashboard.js     — portfólio / modal de metadados
  app.js           — bootstrap
data/
  carteira-cruzada-2026-09-16.json
docs/
  SPEC-v1.0.md
  mapa-projetos-cruzado.md
```

- **Fonte única de verdade**: `state.projetos`. As views não mantêm cópias duplicadas do projeto.
- **Payload operacional** aninhado em `projeto.ops` (tasks, bom, quotes, frete, prices, approval, proposal, rules, risks, checks, etc.).
- **Etapas**: Prospecção, Qualificação, Descoberta, Escopo, Precificação, Proposta enviada, Negociação, Aprovado, Em execução, Handover, Encerrado, Perdido.
- **Defaults de metadados**: status `Em análise`, prioridade `Média`.

## Isolamento entre projetos

Criar um segundo projeto e alternar entre ele e o seed Nilko **não** deve misturar dados operacionais: cada projeto possui seu próprio objeto `ops`.

## Próximo passo

- Validar manualmente os matches pasta ↔ Planner marcados para revisão e ajustar metadados no Cockpit.

## Importante

Ferramenta de apoio operacional. **Não** substitui o precificador oficial nem aprovações de Pricing, Comercial, Fiscal, Jurídico, Produto ou Operações.

## Carteira cruzada (16/09/2026)

Fonte: cruzamento OneDrive × Planner gerado em **16/09/2026** (America/Sao_Paulo).

- Pastas OneDrive: `Documents/OneDrive_1_16-09-2026` (**52** pastas de projeto)
- Planner: `GERENCIAMENTO - PRÉ-VENDA`
- Relatório completo: `docs/mapa-projetos-cruzado.md`
- Seed estático: `data/carteira-cruzada-2026-09-16.json` + `js/carteira-seed.js` (carregado antes de `projects.js` / `app.js`)

### Como entra no app

- **Usuário novo** (sem dados em `localStorage`): o seed da carteira cruzada é aplicado automaticamente (52 projetos).
- **Usuário com dados locais**: use **Importar carteira cruzada** (com confirmação) para substituir o portfólio. Faça **Backup JSON** antes.
- **Reset** também restaura essa carteira padrão (não só a Nilko isolada).

### Matching e validação humana

O cruzamento pasta ↔ tarefa é **fuzzy**. Alguns vínculos são incertos e **precisam de validação humana**.

- Pastas sem match confiável entram como projetos marcados para revisão (chip **Revisar match**).
- Falso positivo conhecido **RUFF CJ Distribuidora de Petroleo Lta ↔ DMA DISTRIBUIDORA SA** foi **descartado**: a pasta existe no portfólio, sem detalhes da tarefa errada.
- Cards mostram pasta/artefatos; **não** exibem notas longas/sensíveis.

### Nilko

Há **um único** projeto Nilko. O payload operacional enriquecido (BoM, pricing, cotações) é mantido/mesclado em runtime — sem duplicar a pasta `1 NILKO`.

Arquivos brutos do OneDrive **não** entram no repositório.

