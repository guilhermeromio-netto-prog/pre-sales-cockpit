'use strict';
window.PSC = window.PSC || {};

(function (PSC) {
  function uid() {
    return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  /** Empty operational payload for a new project. */
  function createEmptyOps() {
    return {
      tasks: [],
      bom: [],
      quotes: [],
      prices: [],
      rules: [
        ['Plano de dados', true, 'Declarar se a franquia é individual ou pool, tratamento no limite, upgrade, top-up e momento de eficácia.'],
        ['Plataforma', true, 'Declarar se está incluída, opcional ou fora do escopo; listar somente funcionalidades confirmadas.'],
        ['Suporte', true, 'Definir janela, canais, níveis, responsabilidades e escalonamento. Suporte remoto não equivale a manutenção de campo.'],
        ['SLA', true, 'Usar apenas percentual, métrica, exclusões, apuração e créditos formalmente aplicáveis à oferta.'],
        ['Garantia e RMA', true, 'Distinguir garantia do fabricante, triagem, logística reversa, spare, substituição e atendimento de campo.'],
        ['Faturamento', true, 'Definir início do OTC e MRC, pro rata, vencimento, aceite e linhas de faturamento.'],
        ['Reajuste', true, 'Incluir índice, periodicidade e marco conforme aprovação contratual.'],
        ['Tributos', true, 'Separar telecom, outsourcing e revenda; validar UF, contribuinte, impostos e frete.'],
        ['Rescisão e multa', true, 'Usar somente cláusula validada, com aviso prévio, permanência e base de cálculo.'],
        ['Validade, vigência e prazo', true, 'Separar validade da proposta, duração contratual, início, entrega, ativação e dependências.'],
        ['Confidencialidade', true, 'Manter redação padrão do template aprovado.'],
        ['Limitações técnicas', true, 'Desempenho depende de cobertura, visada, ambiente, congestionamento e políticas do fornecedor.'],
        ['Exclusões', true, 'Listar VPN, integrações, obras, instalação, manutenção de campo e acessórios não precificados.']
      ],
      checks: {},
      lastProgress: '',
      blocker: '',
      nextGate: '',
      workDate: '',
      checkpoint: '',
      dayNotes: '',
      client: '',
      cnpj: '',
      requester: '',
      crm: '',
      address: '',
      need: '',
      customerTerm: '',
      success: '',
      terminal: 'PENDING VALIDATION',
      mobility: 'PENDING VALIDATION',
      plan: '50 GB individual',
      platform: 'PENDING VALIDATION',
      install: 'PENDING VALIDATION',
      support: 'PENDING VALIDATION',
      fQty: 1,
      fGross: 0,
      fWeight: 0,
      fVolumes: 1,
      fExtraGross: 0,
      fExtraWeight: 0,
      fExtraVolumes: 0,
      fCarrier: 0,
      fFactor: 1.3,
      fEvidence: '',
      months: 24,
      years: 2,
      techRisk: '',
      commRisk: '',
      priceFile: '',
      priceVersion: '',
      submitted: '',
      gmOfficial: '',
      npv: '',
      dcf: '',
      tcvGross: '',
      tcvNet: '',
      oe: '',
      approver: '',
      decision: 'PENDING VALIDATION',
      approvedDate: '',
      approvalEvidence: '',
      proposalNo: '',
      commercial: 'CAPEX + SERVIÇO',
      validity: 30,
      leadTime: '',
      termination: '',
      riskNotes: '',
      pricingFilename: ''
    };
  }

  /** Seed from current Nilko cockpit defaults — nothing lost. */
  function createNilkoOps() {
    const ops = createEmptyOps();
    Object.assign(ops, {
      tasks: [
        ['08:30', 'Consolidar cotações', 'Starlink, plano, mochila, plataforma, estoque e lead time', false],
        ['09:15', 'Fechar BoM', 'Modelo, acessórios, autonomia, mobilidade e suporte', false],
        ['09:40', 'Simular frete', 'Gross R$ 20 mil; 20 kg; 2 volumes + acessórios', false],
        ['10:00', 'Preencher pricing', 'Contract 24; Duration 2; Underlay, Governance, Overlay e Logística', false],
        ['10:40', 'Submeter approval', 'Registrar versão e indicadores oficiais', false],
        ['11:10', 'Adaptar proposta', 'SLA, suporte, garantia, RMA, regras e exclusões', false],
        ['11:40', 'Reconciliar', 'Pricing x Proposta e limpeza de referências', false],
        ['12:00', 'Entrega interna', 'Proposta com pricing aprovado e cotações realizadas', false]
      ],
      bom: [
        ['OVERLAY', 'Starlink Móvel Mini', 2, 'Revenda', 'OTC', 'Validar'],
        ['UNDERLAY', 'Plano individual 50 GB', 2, 'Telco as a Service', 'MRC', 'Validar'],
        ['UNDERLAY', 'Fee TAC Starlink', 2, 'Telco as a Service', 'MRC', 'Aplicabilidade'],
        ['GOVERNANCE', 'Plataforma de monitoramento', 2, 'Serviço / Outsourcing', 'MRC', 'Validar'],
        ['OVERLAY', 'Mochila / bateria 6h', 1, 'Revenda', 'OTC', 'Validar'],
        ['LOGÍSTICA', 'Frete Pinhais, PR', 1, 'Logística', 'OTC', 'Recalcular']
      ],
      quotes: [
        { supplier: 'Starlink / canal', item: '2 kits + 2 planos de 50 GB', cost: '', stock: '', lead: '', validity: '', warranty: '', evidence: '' },
        { supplier: 'Fornecedor de acessórios', item: '1 mochila/bateria de 6 horas', cost: '', stock: '', lead: '', validity: '', warranty: '', evidence: '' },
        { supplier: 'Telekom', item: 'Plataforma, suporte e governança', cost: '', stock: 'N/A', lead: '', validity: '', warranty: 'N/A', evidence: '' }
      ],
      prices: [
        ['UNDERLAY', 'Plano individual 50 GB', 'Telco as a Service', 'MRC', '', 2, 'N', 'Validar', 30],
        ['UNDERLAY', 'Fee TAC Starlink', 'Telco as a Service', 'MRC', '', 2, 'N', 'Validar', 30],
        ['GOVERNANCE', 'Plataforma', 'Serviço / Outsourcing', 'MRC', '', 2, 'N', 'Validar', 30],
        ['GOVERNANCE', 'NOC / suporte', 'Serviço / Outsourcing', 'MRC', '', 2, 'N', 'Validar', 30],
        ['OVERLAY', 'Starlink Mini', 'Revenda', 'OTC', '', 2, 'N', 'Validar', 30],
        ['OVERLAY', 'Mochila / bateria 6h', 'Revenda', 'OTC', '', 1, 'N', 'Validar', 30],
        ['LOGÍSTICA', 'Frete Pinhais, PR', 'Logística', 'OTC', '', 1, 'N', 'Validar', 30]
      ],
      lastProgress: 'Escopo baseline documentado e responsabilidade de Pré-Vendas assumida por Guilherme.',
      blocker: 'Custos, estoque, lead time, parâmetros e aprovação formal ainda não consolidados.',
      nextGate: 'Cotação completa e válida para preenchimento e aprovação do pricing.',
      workDate: '2026-09-15',
      client: 'Nilko Tecnologia Ltda.',
      cnpj: '75.086.785/0001-66',
      requester: 'Valdemir Vera',
      address: 'Av. Maringá, 1900, Pinhais, PR, CEP 83325-360',
      need: 'Conectividade para equipes de campo em regiões sem cobertura 3G/4G/5G, suportando ordens de serviço, geolocalização, suporte e acesso remoto, fotos e vídeos.',
      customerTerm: 'Segunda quinzena de setembro de 2026, confirmar',
      success: 'Conectividade portátil, monitoramento por terminal, upgrade de franquia e autonomia aproximada de 6 horas.',
      plan: '50 GB individual',
      fQty: 2,
      fGross: 10000,
      fWeight: 10,
      fVolumes: 1,
      fFactor: 1.3,
      months: 24,
      years: 2,
      commercial: 'CAPEX + SERVIÇO',
      validity: 30,
      riskNotes: 'Estoque não confirmado; lead time não confirmado; autonomia não comprovada; 50 GB pode ser insuficiente; pricing sem aprovação; frete provisório; referências herdadas.',
      pricingFilename: 'Pricing TC_ PLANO DE DADOS 50GB plano indiv para 2 antenamini e mochila - PRECO GERAL STARLINK_ CAPEX e SERVIÇO.xlsx'
    });
    return ops;
  }

  function createProject(meta, ops) {
    const now = new Date().toISOString();
    return {
      id: uid(),
      nome: meta.nome || 'Novo projeto',
      cliente: meta.cliente || '',
      objetivo: meta.objetivo || '',
      etapa: meta.etapa || 'Prospecção',
      status: meta.status || 'Em análise',
      prioridade: meta.prioridade || 'Média',
      responsavel: meta.responsavel || '',
      ops: ops || createEmptyOps(),
      createdAt: now,
      updatedAt: now
    };
  }

  function createNilkoSeedProject() {
    return createProject(
      {
        nome: 'Nilko — Starlink Mobile',
        cliente: 'Nilko Tecnologia Ltda.',
        objetivo: 'Conectividade Starlink Mobile para equipes de campo (2 kits + planos 50 GB + mochila).',
        etapa: 'Precificação',
        status: 'Em análise',
        prioridade: 'Alta',
        responsavel: 'Guilherme Netto'
      },
      createNilkoOps()
    );
  }

  PSC.defaults = {
    uid,
    createEmptyOps,
    createNilkoOps,
    createProject,
    createNilkoSeedProject
  };
})(window.PSC);
