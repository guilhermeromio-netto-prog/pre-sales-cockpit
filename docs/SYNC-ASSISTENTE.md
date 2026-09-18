# Sync Assistente — Sync/Backup JSON → carteira oficial

Quando Guilherme anexar um arquivo `PreSales_Cockpit_Sync_*.json` ou `PreSales_Cockpit_Backup.json` (ou equivalente com array `projetos`), o assistente deve:

## 1. Validar
- Parsear o JSON.
- Confirmar que existe `projetos` como **array** (mesmo contrato de `parseBackup` no app).
- Rejeitar se faltar `projetos[]` ou se não for um array.

## 2. Gravar no repositório
- Copiar o conteúdo validado para:
  - `data/PreSales_Cockpit_Carteira_Completa.json` no repo `pre-sales-cockpit`
- Manter top-level compatível (`projetos` obrigatório). Campos extras (`syncMeta`, `projetoAtivoId`, `version`) podem permanecer.

## 3. Publicar
- Commit + `git push origin main`
- Se a prática atual do PWA for espelhar Pages: `git push origin main:gh-pages --force`
- Site: https://guilhermeromio-netto-prog.github.io/pre-sales-cockpit/

## 4. Espelhar caminhos no Mac (se disponíveis neste ambiente)
Quando o filesystem do Mac estiver acessível, atualizar também:
- `/Users/Guilherme.Romio-Netto/Documents/PreSales_Cockpit_Carteira_Completa.json`
- `/Users/Guilherme.Romio-Netto/Documents/pre-sales-cockpit/data/PreSales_Cockpit_Carteira_Completa.json`

Se os caminhos não existirem no ambiente do agente, pular e informar.

## 5. Responder ao usuário
Informar:
- Link do GitHub Pages
- Quantidade de projetos no JSON aplicado (`projetos.length`)
- Hash do commit / confirmação de push

## Notas
- Edições no app **não** sobem sozinhas: o usuário precisa **Exportar p/ sincronizar** e anexar o arquivo.
- **Backup JSON** é cópia de segurança; o fluxo preferido de sync é o botão **Exportar p/ sincronizar**.
