Claro. Abaixo está um MD completo para entregar ao Manus, já estruturado como especificação funcional + técnica do aplicativo. A ideia é ele não apenas “fazer uma tela bonita”, mas construir o Cockpit de Pré-Vendas como sistema operacional da demanda, desde a entrada do projeto até proposta, execução e handover.

PRE-SALES COCKPIT

Especificação Funcional, Técnica e de Produto

Versão: 1.0
Objetivo: Construção de aplicação funcional para gestão de demandas, projetos e processos de pré-vendas.

---

1. VISÃO DO PRODUTO

O Pre-Sales Cockpit será uma aplicação para centralizar, organizar e acompanhar todas as demandas de pré-vendas.

A aplicação deve funcionar como uma camada de gestão entre:

Microsoft Planner
      ↓
Importação / Sincronização
      ↓
PRE-SALES COCKPIT
      ↓
┌─────────────────────────────┐
│ Demanda                     │
│ Escopo                      │
│ Premissas                   │
│ Riscos                      │
│ Cotação                     │
│ Precificação                │
│ Proposta                    │
│ Negociação                  │
│ Aprovação                   │
│ Execução                    │
│ Handover                    │
└─────────────────────────────┘
      ↓
Dashboard Executivo

O sistema deve permitir que o gestor tenha uma visão rápida de:

- O que está acontecendo.
- Quem é responsável.
- Em qual etapa está cada projeto.
- O que está bloqueado.
- Quais projetos estão em risco.
- Quais projetos precisam de escopo.
- Quais precisam de cotação.
- Quais precisam de pricing.
- Quais propostas estão em negociação.
- Quais foram aprovados.
- Quais estão em execução.
- Quais precisam de handover.
- Qual o valor potencial da carteira.
- Onde existem pendências ou inconsistências.

---

2. PRINCÍPIO CENTRAL

O sistema deve garantir rastreabilidade:

DEMANDA
   ↓
ESCOPO
   ↓
PREMISSAS
   ↓
COTAÇÃO
   ↓
CUSTO
   ↓
MARGEM
   ↓
PREÇO
   ↓
PROPOSTA
   ↓
NEGOCIAÇÃO
   ↓
APROVAÇÃO
   ↓
EXECUÇÃO
   ↓
HANDOVER

Nenhum dado financeiro deve ser tratado como definitivo sem premissas suficientes.

O sistema deve sinalizar:

- dados ausentes;
- premissas não preenchidas;
- escopo incompleto;
- cotação inexistente;
- preço estimado;
- margem insuficiente;
- riscos;
- informações conflitantes.

---

3. OBJETIVO DO MVP

O MVP deve permitir:

1. Importar projetos do Microsoft Planner via CSV.
2. Visualizar todos os projetos.
3. Pesquisar projetos.
4. Filtrar projetos.
5. Abrir detalhes.
6. Editar projetos.
7. Criar novos projetos.
8. Gerenciar etapas.
9. Gerenciar status.
10. Gerenciar prioridades.
11. Registrar escopo.
12. Registrar fora de escopo.
13. Registrar premissas.
14. Registrar riscos.
15. Registrar dados financeiros.
16. Calcular estimativas.
17. Visualizar KPIs.
18. Persistir dados.
19. Fazer backup.
20. Exportar dados.
21. Preparar proposta.
22. Preparar handover.

---

4. TECNOLOGIA

Front-end

Preferencialmente:

- HTML5
- CSS3
- JavaScript moderno

Pode utilizar framework somente se houver benefício claro.

Caso seja utilizado:

- React
- Vite
- biblioteca de componentes

A arquitetura deve continuar simples e sustentável.

---

5. PERSISTÊNCIA

O sistema não pode depender exclusivamente da memória da página.

Para MVP local:

localStorage

Deve existir uma camada de abstração:

storageService

Para permitir futura migração para:

- Supabase
- Firebase
- PostgreSQL
- SQL Server
- Dataverse
- SharePoint
- API própria

O código não deve espalhar chamadas diretas ao "localStorage" por toda a aplicação.

---

6. MODELO DE DADOS

Cada projeto deve possuir estrutura semelhante a:

{
  id,
  nome,
  cliente,
  objetivo,

  etapa,
  status,
  prioridade,

  responsavel,

  escopo: [],
  foraEscopo: [],
  premissas: [],
  riscos: [],

  financeiro: {
    horas,
    taxa,
    custosDiretos,
    custosIndiretos,
    contingencia,
    margem,
    impostos,
    desconto,
    custoBase,
    custoTotal,
    precoEstimado,
    precoFinal,
    margemEfetiva
  },

  proposta: {
    status,
    versao,
    dataEnvio,
    validade,
    observacoes
  },

  handover: {
    status,
    responsavel,
    dataPrevista,
    dataRealizada,
    checklist: []
  },

  createdAt,
  updatedAt
}

---

7. ETAPAS DO PROJETO

Taxonomia oficial:

1. Prospecção
2. Qualificação
3. Descoberta
4. Escopo
5. Precificação
6. Proposta enviada
7. Negociação
8. Aprovado
9. Em execução
10. Handover
11. Encerrado
12. Perdido

Aliases devem ser normalizados.

Exemplos:

pricing → Precificação
proposta → Proposta enviada
execução → Em execução
lost → Perdido

Caso a etapa não seja reconhecida:

Descoberta

E gerar alerta:

Etapa não reconhecida. Normalizada para Descoberta.

---

8. STATUS

Status oficiais:

- Não iniciado
- Em análise
- Em andamento
- Bloqueado
- Em risco
- Concluído
- Cancelado

Se não informado:

Em análise

---

9. PRIORIDADE

Prioridades:

- Baixa
- Média
- Alta
- Crítica

Se não informada:

Média

---

10. DASHBOARD EXECUTIVO

O dashboard deve apresentar pelo menos:

KPIs

Projetos
Em andamento
Em risco
Bloqueados
Precificação pendente
Propostas enviadas
Em negociação
Aprovados
Em execução

Também:

Valor potencial da carteira
Valor aprovado
Valor em negociação

---

11. VISÃO POR ETAPA

Criar visualização tipo Kanban:

PROSPECÇÃO
     ↓
QUALIFICAÇÃO
     ↓
DESCOBERTA
     ↓
ESCOPO
     ↓
PRECIFICAÇÃO
     ↓
PROPOSTA
     ↓
NEGOCIAÇÃO
     ↓
APROVADO
     ↓
EXECUÇÃO
     ↓
HANDOVER

Cada card deve mostrar:

- projeto;
- cliente;
- responsável;
- prioridade;
- status;
- valor estimado;
- alertas.

---

12. VISÃO DE PROJETOS

A aplicação deve possuir uma visão em cards ou tabela.

Cada projeto deve apresentar de forma compacta:

Cliente
Projeto
Objetivo
Etapa
Status
Prioridade
Responsável
Valor
Riscos
Pendências
Última atualização

O usuário deve conseguir abrir os detalhes sem sair do cockpit.

---

13. DETALHE DO PROJETO

A página/modal de projeto deve ser organizada em abas.

ABA 1 — OVERVIEW

Mostrar:

- Cliente
- Projeto
- Objetivo
- Responsável
- Etapa
- Status
- Prioridade
- Última atualização

---

14. ABA — ESCOPO

Campos:

Escopo

Lista de entregáveis.

Exemplo:

Dashboard
Integração API
Conectividade
Monitoramento
Implantação

Fora do escopo

Exemplo:

Desenvolvimento de hardware
Suporte 24x7
Integrações não especificadas

---

15. ABA — PREMISSAS

Lista de premissas.

Exemplo:

Cliente disponibilizará API.
Infraestrutura será fornecida pelo cliente.
SIM/eSIM será fornecido pelo fornecedor.
Prazo depende de homologação.

Cada premissa pode ter:

- descrição;
- responsável;
- status.

---

16. ABA — RISCOS

Cada risco deve conter:

Descrição
Probabilidade
Impacto
Mitigação
Responsável
Status

Classificação:

Baixo
Médio
Alto
Crítico

---

17. ABA — FINANCEIRO

O sistema deve apresentar:

Horas
Taxa média
Custos diretos
Custos indiretos
Contingência
Margem
Impostos
Desconto

Calcular:

Custo Base
Custo Total
Preço Estimado
Preço Final
Margem Efetiva

---

18. REGRA FINANCEIRA

Nunca apresentar preço como definitivo se houver dados incompletos.

Quando faltarem informações:

PRECIFICAÇÃO PENDENTE

O sistema deve mostrar quais dados estão faltando.

Exemplo:

Pricing pendente

[!] Horas não informadas
[!] Custos diretos não informados
[!] Cotação de fornecedor pendente

---

19. ALERTA DE MARGEM

Se margem abaixo de 20%:

Margem abaixo do recomendado.

Se desconto reduzir margem efetiva abaixo de 20%:

Desconto compromete a margem.

Esses alertas devem aparecer no:

- projeto;
- dashboard;
- financeiro.

---

20. COTAÇÕES

Criar estrutura para futuras cotações.

Cada fornecedor:

Fornecedor
Produto
Descrição
Quantidade
Custo unitário
Custo total
Moeda
Validade
Data da cotação
Contato
Observações

Status:

- Solicitada
- Recebida
- Em análise
- Aprovada
- Expirada

---

21. PROPOSTA

A aplicação deve permitir controlar:

Status da proposta
Versão
Data de envio
Validade
Valor
Observações

Status:

- Não iniciada
- Em elaboração
- Em revisão
- Enviada
- Negociação
- Aprovada
- Perdida

Futuras versões poderão gerar PDF automaticamente.

---

22. HANDOVER

O handover deve possuir checklist.

Exemplo:

[ ] Escopo validado
[ ] Proposta aprovada
[ ] Contrato aprovado
[ ] Dados técnicos consolidados
[ ] Arquitetura documentada
[ ] Fornecedores definidos
[ ] Custos confirmados
[ ] Responsáveis definidos
[ ] Cronograma definido
[ ] Cliente informado
[ ] Kickoff realizado

Status:

Não iniciado
Em preparação
Pronto
Realizado

---

23. IMPORTAÇÃO CSV

A principal origem inicial da base será:

Microsoft Planner

O usuário exportará o Planner em CSV.

O cockpit deve importar essa base.

---

24. BOTÃO IMPORTAR CSV

Interface:

[ Importar CSV ]

Também permitir drag & drop.

Aceitar:

.csv

---

25. DETECÇÃO DE DELIMITADOR

Detectar:

;
,
TAB

O delimitador deve ser determinado pela primeira linha.

Priorizar:

;

quando houver empate ou padrão compatível com CSV brasileiro.

---

26. CODIFICAÇÃO

Suportar:

UTF-8
UTF-8 BOM

Tratar corretamente:

ç
ã
á
é
õ

---

27. MAPEAMENTO DE CABEÇALHOS

Normalizar:

Nome do Projeto

para:

nome

Remover:

- espaços;
- acentos;
- caracteres especiais;
- diferenças entre maiúsculas/minúsculas.

---

28. ALIASES

Nome

nome
projeto
project
name
titulo

Cliente

cliente
client
empresa

Objetivo

objetivo
descricao
purpose

Etapa

etapa
fase
stage

Status

status
situacao

Prioridade

prioridade
priority

Responsável

responsavel
owner
gestor

Escopo

escopo
scope
entregas

Fora do escopo

fora_escopo
foradoescopo
fora

Premissas

premissas
assumptions
assuncoes
premissa

Riscos

riscos
risco
risks

Financeiro

horas
horas_estimadas
hours

taxa
taxa_media
valor_hora
rate

custos_diretos
custos_indiretos

contingencia
reserva

margem
margin

impostos
tributos

desconto
discount

---

29. CAMPOS OBRIGATÓRIOS

Obrigatórios:

nome
cliente

Se faltar:

linha rejeitada

Log:

Linha 27
Motivo:
Nome e cliente são obrigatórios.

---

30. CAMPOS RECOMENDADOS

Se ausentes:

objetivo
etapa
status
responsavel
escopo
premissas

O projeto ainda deve ser importado.

Mas deve receber pendência.

---

31. DEDUPLICAÇÃO

Critério principal:

nome + cliente

Se existir:

ATUALIZAR

Manter:

ID existente

Se não existir:

CRIAR

---

32. CONFLITO DE ID

Se o CSV apresentar ID existente, mas:

nome diferente
ou
cliente diferente

gerar:

Possível inconsistência de identificação.

Não sobrescrever silenciosamente.

---

33. MODOS DE IMPORTAÇÃO

Disponibilizar:

Adicionar

Cria novos e atualiza duplicados.

Atualizar existentes

Somente atualiza registros existentes.

Substituir tudo

Remove a base atual e importa o CSV.

Exigir confirmação explícita.

---

34. BACKUP

Antes de qualquer importação:

backup automático

Criar cópia da base.

Formato:

JSON

Nome:

backup_YYYYMMDD_HHMMSS.json

---

35. LOG DE IMPORTAÇÃO

Mostrar:

Importação concluída

Linhas lidas: 48
Importados: 41
Atualizados: 5
Ignorados: 2
Alertas: 9
Pendências: 7

Permitir visualizar detalhes.

---

36. PREVIEW

Antes da importação definitiva:

Mostrar:

- primeiras 10–20 linhas;
- colunas reconhecidas;
- colunas desconhecidas;
- registros válidos;
- registros inválidos;
- duplicidades.

Fluxo:

Selecionar CSV
      ↓
Processar
      ↓
Preview
      ↓
Validação
      ↓
Confirmação
      ↓
Backup
      ↓
Importação

---

37. COLUNAS DESCONHECIDAS

Não devem quebrar a importação.

Exemplo:

Data de conclusão
Bucket
Labels
Criado por

Se não houver uso no modelo atual:

Coluna ignorada

Mas registrar no log.

---

38. LISTAS

Campos:

escopo
foraEscopo
premissas
riscos

Suportar:

Item A|Item B|Item C

Converter para:

[
  "Item A",
  "Item B",
  "Item C"
]

---

39. VALORES MONETÁRIOS

Aceitar:

120
180.50
180,50
R$ 1.234,56

Normalizar:

R$ 1.234,56

para:

1234.56

---

40. PERCENTUAIS

Aceitar:

15
15%
15,5%

Normalizar para número:

15
15.5

---

41. MODELO CSV

Disponibilizar botão:

[ Modelo CSV ]

Formato:

id;nome;cliente;objetivo;etapa;status;prioridade;responsavel;escopo;fora_escopo;premissas;riscos;horas;taxa;custos_diretos;custos_indiretos;contingencia;margem;impostos;desconto

---

42. EXPORTAÇÃO

Disponibilizar:

[ Exportar base ]

Formato mínimo:

JSON

Futuro:

CSV
Excel
PDF

---

43. PERSISTÊNCIA

Ao alterar qualquer projeto:

salvar automaticamente

O usuário não deve perder dados ao:

- atualizar página;
- fechar navegador;
- reabrir aplicação.

---

44. RECUPERAÇÃO

Criar mecanismo:

Backup
Restaurar backup

O usuário deve conseguir recuperar uma versão anterior.

---

45. INTERFACE

A interface deve parecer um produto SaaS corporativo moderno.

Não deve parecer:

- planilha;
- protótipo acadêmico;
- sistema antigo.

Deve transmitir:

Tecnologia
Controle
Clareza
Inteligência
Confiabilidade

---

46. DESIGN

Direção visual:

- dark mode;
- azul tecnológico;
- roxo discreto;
- gradientes;
- cards;
- glass effect moderado;
- bordas suaves;
- sombras;
- microanimações;
- indicadores visuais;
- tipografia moderna.

Evitar excesso de efeitos.

O visual deve continuar profissional para apresentação a diretores.

---

47. DASHBOARD VISUAL

Utilizar:

KPI Cards
Gráficos
Kanban
Timeline
Alertas

Exemplo:

┌────────────┐ ┌────────────┐ ┌────────────┐
│ 48         │ │ 13         │ │ 4          │
│ Projetos   │ │ Negociação │ │ Em risco   │
└────────────┘ └────────────┘ └────────────┘

---

48. ALERTAS

Criar central de alertas.

Exemplos:

Pricing pendente
Margem baixa
Escopo incompleto
Risco crítico
Proposta vencendo
Handover pendente
Projeto sem responsável

---

49. FILTROS

Filtros por:

Cliente
Projeto
Responsável
Etapa
Status
Prioridade
Data

Busca global deve pesquisar:

nome
cliente
objetivo
responsável
escopo
riscos
premissas

---

50. RESPONSIVIDADE

O sistema deve funcionar em:

- desktop;
- notebook;
- tablet;
- celular.

Prioridade de uso:

Desktop > Tablet > Mobile

---

51. ACESSIBILIDADE

Implementar:

- HTML semântico;
- labels;
- contraste adequado;
- navegação por teclado;
- foco visível;
- aria-label quando necessário;
- botões reais;
- mensagens compreensíveis.

---

52. PERFORMANCE

Evitar:

- bibliotecas desnecessárias;
- renderização excessiva;
- manipulação DOM desnecessária;
- listeners duplicados.

Para bases maiores:

100
500
1000+

a aplicação deve continuar utilizável.

---

53. SEGURANÇA

Nunca exibir no dashboard:

- senhas;
- tokens;
- API keys;
- credenciais;
- secrets.

Se CSV possuir dados sensíveis:

ALERTA:
Dados potencialmente sensíveis identificados.

Não exibir valores sensíveis no preview/log.

---

54. ARQUITETURA JAVASCRIPT

Separar responsabilidades.

Sugestão:

/js
  app.js
  state.js
  storage.js
  csv-import.js
  csv-parser.js
  normalization.js
  validation.js
  finance.js
  dashboard.js
  projects.js
  proposal.js
  handover.js
  ui.js

Não colocar todo o sistema em um único arquivo JS.

---

55. SERVIÇOS

Criar módulos:

StorageService
ProjectService
CsvImportService
FinanceService
ValidationService
BackupService
DashboardService

---

56. EVENTOS

Após alteração de dados:

stateChanged

deve atualizar:

dashboard
projects
filters
financial
proposal
handover
alerts

---

57. PRINCÍPIO DE SINGLE SOURCE OF TRUTH

Deve existir uma única fonte de verdade:

state.projetos

Dashboard não deve possuir cópia independente dos projetos.

Pricing não deve possuir cópia independente.

Proposal não deve possuir cópia independente.

Todos devem derivar do mesmo estado.

---

58. RASTREABILIDADE

Cada projeto deve manter:

createdAt
updatedAt

Futuro:

changeHistory[]

Exemplo:

{
  date,
  user,
  field,
  oldValue,
  newValue
}

---

59. MICROFLUXO DE PROJETO

Ao criar projeto:

Projeto criado
     ↓
Qualificação
     ↓
Descoberta
     ↓
Escopo
     ↓
Pricing
     ↓
Proposta
     ↓
Negociação
     ↓
Aprovado
     ↓
Handover

O sistema deve indicar visualmente onde o projeto está.

---

60. GOVERNANÇA

Cada projeto deve responder:

O que é?
Para quem?
Por quê?
Quem é responsável?
Qual o escopo?
O que não está incluído?
Quais premissas?
Quais riscos?
Quanto custa?
Quanto vale?
Qual margem?
Qual status?
Qual próximo passo?

---

61. NEXT ACTION

Cada projeto deve possuir:

Próximo passo
Responsável
Data limite

Exemplo:

Próximo passo:
Enviar cotação de conectividade

Responsável:
Pré-vendas

Deadline:
20/09/2026

Isso deve aparecer no card do projeto.

---

62. VISÃO EXECUTIVA

Criar uma visão:

EXECUTIVE VIEW

Com:

- total de projetos;
- pipeline;
- valor potencial;
- riscos;
- gargalos;
- propostas;
- aprovações;
- projetos críticos.

---

63. VISÃO OPERACIONAL

Criar:

OPERATIONS VIEW

Foco:

- tarefas;
- pendências;
- responsáveis;
- próximos passos;
- prazos;
- bloqueios.

---

64. IMPORTAÇÃO DO PLANNER

O sistema deve considerar que o Planner é a fonte operacional inicial.

O CSV poderá conter campos específicos do Planner que não fazem parte do modelo.

Esses campos não devem quebrar a importação.

Futuro:

Planner API
     ↓
Sync automático

---

65. FUTURA INTEGRAÇÃO

Arquitetura deve permitir posteriormente:

Microsoft Planner
Microsoft Graph
SharePoint
Teams
Power Automate
CRM
ERP
ERP financeiro
APIs de fornecedores

Não implementar tudo no MVP.

Preparar arquitetura.

---

66. EXPERIÊNCIA DE IMPORTAÇÃO

O usuário deve perceber:

Arquivo recebido
      ↓
Analisando
      ↓
Mapeando
      ↓
Validando
      ↓
Detectando duplicidades
      ↓
Pronto

Utilizar progress indicator.

---

67. MENSAGENS

Evitar "alert()" sempre que possível.

Utilizar:

toast
modal
inline feedback
status badge

Exemplo:

Importação concluída
41 novos projetos
5 atualizados
2 rejeitados

---

68. LOG

Log deve possuir:

Timestamp
Arquivo
Linhas
Novos
Atualizados
Ignorados
Erros
Alertas

Permitir:

Exportar log

---

69. BACKUP

Nunca executar:

Substituir tudo

sem:

backup
+
confirmação

---

70. RECUPERAÇÃO DE ERRO

Se importação falhar:

rollback

O estado anterior deve permanecer intacto.

---

71. TRANSAÇÃO DE IMPORTAÇÃO

O processo deve ser:

Ler
 ↓
Validar
 ↓
Criar cópia da base
 ↓
Preparar nova base
 ↓
Aplicar alterações
 ↓
Validar estado
 ↓
Persistir

Se houver erro crítico:

restaurar estado anterior

---

72. DADOS FINANCEIROS

O sistema deve diferenciar:

Estimativa
Cotação
Custo confirmado
Preço calculado
Preço aprovado

Não tratar estimativa como valor fechado.

---

73. STATUS FINANCEIRO

Criar indicador:

Não iniciado
Estimativa
Em cotação
Pricing em análise
Pricing aprovado

---

74. STATUS DE ESCOPO

Criar indicador:

Não definido
Em descoberta
Parcial
Validado
Congelado

---

75. STATUS DE HANDOVER

Não iniciado
Em preparação
Pendente
Pronto
Realizado

---

76. CHECKLIST DE QUALIDADE

Antes de considerar projeto pronto para proposta:

[ ] Cliente identificado
[ ] Objetivo definido
[ ] Escopo definido
[ ] Fora de escopo definido
[ ] Premissas registradas
[ ] Riscos registrados
[ ] Responsável definido
[ ] Fornecedores avaliados
[ ] Custos levantados
[ ] Pricing realizado
[ ] Margem validada
[ ] Proposta preparada

---

77. CHECKLIST DE HANDOVER

Antes de entregar para execução:

[ ] Escopo final
[ ] Premissas finais
[ ] Arquitetura
[ ] BOM / equipamentos
[ ] Fornecedores
[ ] Valores
[ ] Contrato
[ ] SLA
[ ] Responsáveis
[ ] Cronograma
[ ] Riscos
[ ] Pendências
[ ] Critérios de aceite

---

78. CRITÉRIOS DE ACEITE DO MVP

O aplicativo será considerado funcional quando:

Base

- [ ] Criar projeto
- [ ] Editar projeto
- [ ] Excluir projeto
- [ ] Persistir projeto
- [ ] Reabrir aplicação mantendo dados

Dashboard

- [ ] KPIs
- [ ] filtros
- [ ] busca
- [ ] atualização automática

CSV

- [ ] importar CSV
- [ ] detectar delimitador
- [ ] interpretar UTF-8
- [ ] mapear cabeçalhos
- [ ] normalizar dados
- [ ] validar nome
- [ ] validar cliente
- [ ] detectar duplicidades
- [ ] atualizar existentes
- [ ] criar novos
- [ ] backup
- [ ] log
- [ ] preview
- [ ] modelo CSV

Projeto

- [ ] overview
- [ ] escopo
- [ ] premissas
- [ ] riscos
- [ ] financeiro
- [ ] proposta
- [ ] handover

---

79. CRITÉRIOS DE QUALIDADE

O código entregue deve ser:

- legível;
- modular;
- comentado quando necessário;
- responsivo;
- acessível;
- seguro;
- performático;
- sustentável.

Não entregar um protótipo visual que não funcione.
