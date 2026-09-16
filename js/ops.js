'use strict';
window.PSC = window.PSC || {};

(function (PSC) {
  const checklist = {
    discovery: [
      'Modelo exato do terminal',
      'Uso parado, móvel ou ambos',
      'Dispositivos simultâneos',
      'Ferramenta de acesso remoto',
      'Funcionalidades da plataforma',
      'Endereço de entrega',
      'Suporte, SLA, garantia e RMA',
      'Política de upgrade'
    ],
    quotation: [
      'Fornecedor e contato',
      'Part number e composição',
      'Custos e tributos',
      'Estoque escrito',
      'Lead time',
      'Validade',
      'Garantia e RMA',
      'Peso, dimensões e volumes',
      'Frete e condição de entrega',
      'Evidência salva'
    ],
    reconcile: [
      'Cliente e CNPJ',
      'Quantidade e modelo',
      'Plano e plataforma',
      'OTC, MRC e vigência',
      'Frete uma única vez',
      'SLA, suporte e RMA',
      'Validade, reajuste e rescisão',
      'Arquivo aprovado registrado',
      'Sem referências herdadas',
      'Evidência de aprovação'
    ]
  };

  function dirty() {
    PSC.projects.markDirty();
  }

  function bindScalars() {
    const ops = PSC.state.getOps();
    if (!ops) return;
    const { q, qa } = PSC.ui;
    qa('[data-k]').forEach((e) => {
      const k = e.dataset.k;
      if (ops[k] !== undefined && ops[k] !== null) e.value = ops[k];
      else ops[k] = e.value;
      e.oninput = () => {
        ops[k] = e.value;
        dirty();
        PSC.finance.renderFinance();
        renderGaps();
        renderProposal();
        updateHeader();
      };
    });
  }

  function renderTasks() {
    const ops = PSC.state.getOps();
    const { q, qa, esc } = PSC.ui;
    if (!ops || !q('#tasks')) return;
    q('#tasks').innerHTML = ops.tasks
      .map(
        (r, i) =>
          `<div class="task ${r[3] ? 'done' : ''}"><input type="time" data-task="${i},0" value="${esc(r[0])}"><div><input data-task="${i},1" value="${esc(r[1])}"><textarea data-task="${i},2">${esc(r[2])}</textarea></div><label><input type="checkbox" data-done="${i}" ${r[3] ? 'checked' : ''}> Done</label></div>`
      )
      .join('');
    qa('[data-task]').forEach((e) => {
      e.oninput = () => {
        const [i, j] = e.dataset.task.split(',');
        ops.tasks[i][j] = e.value;
        dirty();
        renderToday();
      };
    });
    qa('[data-done]').forEach((e) => {
      e.onchange = () => {
        ops.tasks[+e.dataset.done][3] = e.checked;
        dirty();
        renderTasks();
        renderToday();
        renderProgress();
      };
    });
    renderToday();
  }

  function renderToday() {
    const ops = PSC.state.getOps();
    const { q, esc } = PSC.ui;
    if (!ops || !q('#today')) return;
    q('#today').innerHTML =
      ops.tasks
        .filter((r) => !r[3])
        .slice(0, 5)
        .map(
          (r) =>
            `<div class="todayitem"><b>${esc(r[0])} · ${esc(r[1])}</b><small>${esc(r[2])}</small></div>`
        )
        .join('') || '<div class="todayitem"><b>Sem atividades abertas</b></div>';
  }

  function renderTable(root, data, type) {
    const { q, qa, esc } = PSC.ui;
    const el = q(root);
    if (!el) return;
    el.innerHTML = data
      .map(
        (r, i) =>
          `<tr>${r
            .map(
              (v, j) =>
                `<td><input data-${type}="${i},${j}" value="${esc(v)}" ${typeof v === 'number' ? 'type="number"' : ''}></td>`
            )
            .join('')}<td><button type="button" class="remove" data-r${type}="${i}">×</button></td></tr>`
      )
      .join('');
    qa(`[data-${type}]`).forEach((e) => {
      e.oninput = () => {
        const [i, j] = e.dataset[type].split(',');
        data[i][j] = e.type === 'number' ? e.value : e.value;
        dirty();
        PSC.finance.renderFinance();
      };
    });
    qa(`[data-r${type}]`).forEach((e) => {
      e.onclick = () => {
        data.splice(+e.dataset['r' + type], 1);
        renderTable(root, data, type);
        dirty();
        PSC.finance.renderFinance();
      };
    });
  }

  function renderQuotes() {
    const ops = PSC.state.getOps();
    const { q, qa, esc } = PSC.ui;
    if (!ops || !q('#quotes')) return;
    const labels = {
      supplier: 'Fornecedor',
      item: 'Escopo',
      cost: 'Custo',
      stock: 'Estoque',
      lead: 'Lead time',
      validity: 'Validade',
      warranty: 'Garantia / RMA',
      evidence: 'Evidência'
    };
    q('#quotes').innerHTML = ops.quotes
      .map(
        (r, i) =>
          `<article class="card quote"><div class="rulehead"><h3>Cotação ${i + 1}</h3><button type="button" class="remove" data-rquote="${i}">Remover</button></div><div class="quotegrid">${Object.entries(labels)
            .map(([k, l]) => `<label>${l}<textarea data-quote="${i},${k}">${esc(r[k])}</textarea></label>`)
            .join('')}</div></article>`
      )
      .join('');
    qa('[data-quote]').forEach((e) => {
      e.oninput = () => {
        const [i, k] = e.dataset.quote.split(',');
        ops.quotes[i][k] = e.value;
        dirty();
        renderGaps();
      };
    });
    qa('[data-rquote]').forEach((e) => {
      e.onclick = () => {
        ops.quotes.splice(+e.dataset.rquote, 1);
        renderQuotes();
        dirty();
      };
    });
  }

  function renderRules() {
    const ops = PSC.state.getOps();
    const { q, qa, esc } = PSC.ui;
    if (!ops || !q('#ruleCards')) return;
    q('#ruleCards').innerHTML = ops.rules
      .map(
        (r, i) =>
          `<article class="card rule ${r[1] ? '' : 'off'}"><div class="rulehead"><h3>${esc(r[0])}</h3><label><input type="checkbox" data-ruleon="${i}" ${r[1] ? 'checked' : ''}> Incluir</label></div><textarea data-rule="${i}">${esc(r[2])}</textarea></article>`
      )
      .join('');
    qa('[data-ruleon]').forEach((e) => {
      e.onchange = () => {
        ops.rules[+e.dataset.ruleon][1] = e.checked;
        renderRules();
        dirty();
        renderProposal();
      };
    });
    qa('[data-rule]').forEach((e) => {
      e.oninput = () => {
        ops.rules[+e.dataset.rule][2] = e.value;
        dirty();
        renderProposal();
      };
    });
  }

  function renderChecks() {
    const ops = PSC.state.getOps();
    const { qa } = PSC.ui;
    if (!ops) return;
    qa('[data-check-group]').forEach((root) => {
      const g = root.dataset.checkGroup;
      root.innerHTML = checklist[g]
        .map(
          (x, i) =>
            `<label><input type="checkbox" data-check="${g}.${i}" ${ops.checks[g + '.' + i] ? 'checked' : ''}>${x}</label>`
        )
        .join('');
    });
    qa('[data-check]').forEach((e) => {
      e.onchange = () => {
        ops.checks[e.dataset.check] = e.checked;
        dirty();
        renderProgress();
        renderGates();
      };
    });
  }

  function renderGaps() {
    const ops = PSC.state.getOps();
    const { q } = PSC.ui;
    if (!ops || !q('#gaps')) return;
    const a = [
      ['Endereço confirmado', !!ops.address],
      ['Modelo definido', ops.terminal && ops.terminal !== 'PENDING VALIDATION'],
      ['Mobilidade definida', ops.mobility && ops.mobility !== 'PENDING VALIDATION'],
      ['Plataforma definida', ops.platform && ops.platform !== 'PENDING VALIDATION'],
      ['Cotações com evidência', ops.quotes.every((x) => x.evidence)],
      ['Lead time cotado', ops.quotes.every((x) => x.lead || x.stock === 'N/A')],
      ['Frete calculado', +ops.fCarrier > 0],
      ['Pricing aprovado', ops.decision === 'Aprovado' && ops.approvalEvidence]
    ];
    q('#gaps').innerHTML = a
      .map(
        (x) =>
          `<article class="card gap ${x[1] ? 'ok' : ''}"><small>${x[1] ? 'OK' : 'PENDENTE'}</small><h3>${x[0]}</h3></article>`
      )
      .join('');
  }

  function renderGates() {
    const ops = PSC.state.getOps();
    const { q, qa, esc } = PSC.ui;
    if (!ops || !q('#gateCards')) return;
    const names = ['Discovery', 'BoM', 'Cotação', 'Frete', 'Pricing', 'Approval', 'Proposta', 'Liberação'];
    q('#gateCards').innerHTML = names
      .map((x, i) => {
        let done = false;
        if (i === 2) done = ops.quotes.every((v) => v.evidence);
        else if (i === 3) done = +ops.fCarrier > 0;
        else if (i === 4) done = ops.prices.some((v) => +v[4] > 0);
        else if (i === 5) done = ops.decision === 'Aprovado';
        return `<article class="card gate ${done ? 'done' : ''}"><small>${done ? 'DONE' : 'OPEN'}</small><h3>${i + 1}. ${x}</h3><textarea data-gatenote="${i}" placeholder="Evidência / observação">${esc(ops['gateNote' + i] || '')}</textarea></article>`;
      })
      .join('');
    qa('[data-gatenote]').forEach((e) => {
      e.oninput = () => {
        ops['gateNote' + e.dataset.gatenote] = e.value;
        dirty();
      };
    });
  }

  function renderProposal() {
    const ops = PSC.state.getOps();
    const { q, esc } = PSC.ui;
    if (!ops || !q('#proposalText')) return;
    const projeto = PSC.state.getAtivo();
    const pending = (v) =>
      v && v !== 'PENDING VALIDATION' ? esc(v) : '<span class="pending">PENDING VALIDATION</span>';
    const clientName = esc(projeto.cliente || ops.client || '');
    q('#proposalText').innerHTML = `<p><b>CONFIDENCIAL</b></p><h1>Proposta Técnica-Comercial<br><small>${clientName}</small></h1><p><b>Proposta:</b> ${pending(ops.proposalNo)}<br><b>Modelo:</b> ${pending(ops.commercial)}<br><b>Vigência:</b> ${pending(ops.months || 24)} meses<br><b>Validade:</b> ${pending(ops.validity || 30)} dias.</p><h2>1. Objetivo</h2><p>${esc(ops.need || projeto.objetivo || '')}</p><h2>2. Escopo</h2><ul>${ops.bom.map((r) => `<li>${esc(r[1])}: ${esc(r[2])}, ${esc(r[4])}.</li>`).join('')}</ul><p><b>Plano:</b> ${pending(ops.plan)}. <b>Plataforma:</b> ${pending(ops.platform)}. <b>Mobilidade:</b> ${pending(ops.mobility)}.</p><h2>3. Prazo e logística</h2><p>Prazo: ${pending(ops.leadTime)}. Destino: ${pending(ops.address)}. O frete deve ser incluído uma única vez e refletir a simulação válida.</p><h2>4. Condições e guardrails</h2>${ops.rules
      .filter((r) => r[1])
      .map((r) => `<h3>${esc(r[0])}</h3><p>${esc(r[2])}</p>`)
      .join('')}<h2>5. Aprovação</h2><p>Utilizar exclusivamente os valores da versão formalmente aprovada. Versão: ${pending(ops.priceVersion)}. Aprovador: ${pending(ops.approver)}. Evidência: ${pending(ops.approvalEvidence)}.</p><h2>6. Pendências</h2><p>Modelo, estoque, lead time, autonomia, suporte, SLA, garantia, RMA, tributos e condições comerciais permanecem sujeitos às confirmações registradas neste cockpit.</p>`;
  }

  function renderProgress() {
    const ops = PSC.state.getOps();
    const { q } = PSC.ui;
    if (!ops || !q('#progress')) return;
    const all = Object.keys(ops.checks).filter((k) => !k.startsWith('gate'));
    const done = all.filter((k) => ops.checks[k]).length;
    const pct = all.length ? Math.round((done / all.length) * 100) : 0;
    q('#progress').textContent = pct + '%';
  }

  function updateHeader() {
    const p = PSC.state.getAtivo();
    const { q, esc } = PSC.ui;
    if (!p) return;
    if (q('#project-title')) q('#project-title').textContent = p.nome;
    if (q('#project-subtitle'))
      q('#project-subtitle').textContent = `${p.cliente || '—'} · ${p.etapa} · ${p.status}`;
    if (q('#kpi-cliente')) q('#kpi-cliente').innerHTML = `<small>Cliente</small><b>${esc(p.cliente || p.ops.client || '—')}</b><span>${esc(p.ops.cnpj || '')}</span>`;
    if (q('#kpi-escopo'))
      q('#kpi-escopo').innerHTML = `<small>Objetivo</small><b>${esc((p.objetivo || p.ops.need || '—').slice(0, 60))}</b><span>${esc(p.responsavel || '')}</span>`;
    if (q('#kpi-vigencia'))
      q('#kpi-vigencia').innerHTML = `<small>Vigência</small><b>${esc(String(p.ops.months || 24))} meses</b><span>Prioridade: ${esc(p.prioridade)}</span>`;
    if (q('#kpi-destino'))
      q('#kpi-destino').innerHTML = `<small>Destino</small><b>${esc((p.ops.address || '—').split(',').slice(-2).join(',').trim() || '—')}</b><span>${esc((p.ops.address || '').slice(0, 40))}</span>`;
    if (q('#filename')) q('#filename').textContent = p.ops.pricingFilename || '—';
  }

  function mountProject() {
    const ops = PSC.state.getOps();
    if (!ops) return;
    bindScalars();
    renderTasks();
    renderTable('#bom', ops.bom, 'bom');
    renderTable('#prices', ops.prices, 'price');
    renderQuotes();
    renderRules();
    renderChecks();
    PSC.finance.renderFinance();
    renderGaps();
    renderGates();
    renderProposal();
    renderProgress();
    updateHeader();
  }

  function wireProjectActions() {
    const { q, qa, dl } = PSC.ui;
    const once = (id, fn) => {
      const el = q(id);
      if (el && !el.dataset.wired) {
        el.dataset.wired = '1';
        el.onclick = fn;
      }
    };
    once('#addTask', () => {
      const ops = PSC.state.getOps();
      ops.tasks.push(['12:30', 'Nova atividade', '', false]);
      renderTasks();
      dirty();
    });
    once('#addBom', () => {
      const ops = PSC.state.getOps();
      ops.bom.push(['OVERLAY', 'Novo item', 1, 'Revenda', 'OTC', 'Validar']);
      renderTable('#bom', ops.bom, 'bom');
      dirty();
    });
    once('#addQuote', () => {
      const ops = PSC.state.getOps();
      ops.quotes.push({
        supplier: '',
        item: '',
        cost: '',
        stock: '',
        lead: '',
        validity: '',
        warranty: '',
        evidence: ''
      });
      renderQuotes();
      dirty();
    });
    once('#addPrice', () => {
      const ops = PSC.state.getOps();
      ops.prices.push(['OVERLAY', 'Novo item', 'Revenda', 'OTC', '', 1, 'N', 'Validar', 30]);
      renderTable('#prices', ops.prices, 'price');
      dirty();
      PSC.finance.renderFinance();
    });
    once('#generate', () => renderProposal());
    once('#copyProposal', () => {
      const t = q('#proposalText');
      if (t) navigator.clipboard.writeText(t.innerText);
    });
    once('#csv', () => {
      const ops = PSC.state.getOps();
      const rows = [
        ['Bloco', 'Item', 'Service', 'Charge', 'Unit Cost', 'Qty', 'Recover', 'Tax', 'Margem'],
        ...ops.prices
      ];
      const csv =
        '\ufeff' +
        rows.map((r) => r.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(';')).join('\n');
      dl(new Blob([csv], { type: 'text/csv' }), 'Pricing_Espelho.csv');
    });
    qa('[data-copy]').forEach((b) => {
      if (b.dataset.wired) return;
      b.dataset.wired = '1';
      b.onclick = () => navigator.clipboard.writeText(q(b.dataset.copy).innerText);
    });
  }

  PSC.ops = {
    mountProject,
    wireProjectActions,
    renderProposal,
    renderGaps,
    renderProgress
  };
})(window.PSC);
