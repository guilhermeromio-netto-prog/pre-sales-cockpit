# Sistema Pre-Sales Cockpit (T•PRESALES) — pacote completo

## O que é
Cockpit multi-projeto offline (HTML/CSS/JS) para pré-vendas: **visualizador consolidado + simulador** para apresentar e montar PTC. Dados no `localStorage` do navegador.

## Repositório
- GitHub: https://github.com/guilhermeromio-netto-prog/pre-sales-cockpit
- Cópia local: `Documents/pre-sales-cockpit`

## Como abrir
```bash
cd ~/Documents/pre-sales-cockpit
python3 -m http.server 8765
# abrir http://127.0.0.1:8765/index.html
```

## Estrutura do código
```
index.html          — UI (Portfólio + abas do projeto)
styles.css
js/
  app.js            — boot, navegação, botões
  state.js          — fonte única: state.projetos
  storage.js        — localStorage (storageService)
  defaults.js       — modelo de projeto + ops vazios + seed Nilko
  projects.js       — CRUD, filtros, backup, atualizar carteira, reset
  carteira-seed.js  — PSC.CARTEIRA_SEED (carteira embutida)
  ops.js / finance.js / dashboard.js / ui.js
data/
  carteira-cruzada-2026-09-16.json
  carteira-atualizada-diario-2026-09-16.json
  PreSales_Cockpit_Carteira_Completa.json   — JSON completo para Atualizar carteira
docs/SPEC-v1.0.md
README.md
SISTEMA.md          — este guia
```

## Abas por projeto
Dashboard · Calendário · Discovery · Solution Design · Cotação · Frete · Pricing · Approval · Proposta · Regras · Riscos · Gates

## Fluxo de dados (oficial)
1. **Backup JSON** — baixa o estado atual do navegador.
2. **Atualizar carteira** — escolhe um JSON (`PreSales_Cockpit_Carteira_Completa.json` ou um Backup) e substitui o portfólio local.
3. **Reset (seed)** — volta ao seed embutido (`js/carteira-seed.js`), não ao último backup.

## JSON canônico a manter atualizado
Sempre sincronizar estes dois caminhos quando houver alteração de projeto:
- `Documents/PreSales_Cockpit_Carteira_Completa.json`
- `Documents/pre-sales-cockpit/data/PreSales_Cockpit_Carteira_Completa.json`

## Memórias diárias (ponte)
- Pasta: `Documents/memorias-diarias` (`AAAA/MM-mes/AAAA-MM-DD.md`)
- O Cockpit **não** lê a pasta sozinho.
- Fluxo: memória do dia → assistente gera/atualiza o JSON da carteira → **Atualizar carteira** no app.
- Regra: mesmo cliente ≠ mesmo projeto (ex.: Grupo GPS DIA×Azul vs PoC MRS).

## Carteira atual
- ~53 projetos (OneDrive × Planner + PoC GPS/MRS + enriquecimento das memórias 10/11/14).
- Projetos com abas mais completas: Nilko, Electrolux, TBG, Motiva, RD Saúde, WABTEC, Minebea, STIHL, PoC GPS/MRS, DIA GPS×Azul, Owens, Dahruj.

## Link público (GitHub Pages)

Após o deploy: https://guilhermeromio-netto-prog.github.io/pre-sales-cockpit/

Repo: https://github.com/guilhermeromio-netto-prog/pre-sales-cockpit

No site público use **Atualizar carteira** com o JSON (também em `data/PreSales_Cockpit_Carteira_Completa.json` no repo) se o seed embutido estiver desatualizado.

