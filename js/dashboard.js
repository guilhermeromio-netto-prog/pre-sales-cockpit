'use strict';
window.PSC = window.PSC || {};

(function (PSC) {
  /** Fallback if js/charts.js failed to load (cache/rede no celular). */
  function chartsApi() {
    if (PSC.charts) return PSC.charts;
    return {
      isAtivo: (p) =>
        !!p && !['Encerrado', 'Perdido'].includes(p.etapa) && p.status !== 'Cancelado',
      isBloqueadoLike: (p) =>
        !!p && (p.status === 'Bloqueado' || p.status === 'Em risco'),
      readinessPct: () => 0,
      countBy: () => [],
      sortEtapa: (items) => items || [],
      hbars: () => {},
      donut: () => {},
      stack: () => {},
      meters: () => {},
      readinessBuckets: () => [],
      statusColor: () => '#475569',
      gateStates: () => []
    };
  }

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('pt-BR');
    } catch {
      return iso;
    }
  }

  function priorityClass(p) {
    if (p === 'Crítica') return 'prio-critica';
    if (p === 'Alta') return 'prio-alta';
    if (p === 'Baixa') return 'prio-baixa';
    return 'prio-media';
  }

  function statusClass(s) {
    if (s === 'Bloqueado') return 'st-bloqueado';
    if (s === 'Em risco') return 'st-risco';
    if (s === 'Concluído') return 'st-concluido';
    if (s === 'Cancelado') return 'st-cancelado';
    if (s === 'Em andamento') return 'st-andamento';
    return 'st-analise';
  }

  function trunc(s, n) {
    const t = String(s || '').trim();
    if (!t) return '';
    return t.length > n ? t.slice(0, n - 1) + '…' : t;
  }

  function renderList() {
    const { q, esc } = PSC.ui;
    const list = PSC.projects.filtered();
    const root = q('#project-list');
    if (!root) return;
    q('#portfolio-count').textContent = `${list.length}`;
    if (!list.length) {
      root.innerHTML =
        '<div class="empty-state"><h3>Nenhum projeto encontrado</h3><p>Ajuste os filtros ou crie um novo projeto.</p></div>';
      return;
    }
    root.innerHTML = list
      .map((p) => {
        const ops = p.ops || {};
        const pasta = ops.sourceFolder || ops.pastaOneDrive || p._sourcePasta || '';
        const arts = Array.isArray(ops.artefatos) ? ops.artefatos : [];
        const files = ops.fileCount || 0;
        const review = !!ops.revisarMatch || ops.matchStatus === 'sem_match' || ops.matchStatus === 'incerto';
        const reviewLabel =
          ops.matchStatus === 'sem_match'
            ? 'Revisar · sem Planner'
            : ops.matchStatus === 'incerto'
              ? 'Revisar · incerto'
              : 'Revisar match';
        const ready = chartsApi().readinessPct(p);
        const readyClass = ready >= 70 ? 'ready-hi' : ready >= 40 ? 'ready-mid' : 'ready-lo';
        const blocker = trunc(ops.blocker, 72);
        const nextGate = trunc(ops.nextGate, 72);
        const indicators = [
          pasta ? `<span class="chip chip-folder" title="${esc(ops.pastaOneDrive || pasta)}">📁 ${esc(trunc(pasta, 28))}</span>` : '',
          files ? `<span class="chip">${files} arq.</span>` : '',
          arts.length
            ? `<span class="chip chip-arts">${esc(trunc(arts.slice(0, 3).join(' · '), 36))}</span>`
            : '',
          review ? `<span class="chip chip-warn">${esc(reviewLabel)}</span>` : ''
        ]
          .filter(Boolean)
          .join('');
        return `<article class="project-card compact${review ? ' needs-review' : ''}" data-open="${esc(p.id)}">
        <div class="pc-top">
          <div class="pc-title">
            <h3>${esc(p.nome)}</h3>
            <p class="muted">${esc(p.cliente || 'Sem cliente')}</p>
          </div>
          <div class="pc-badges">
            <span class="badge ${statusClass(p.status)}">${esc(p.status)}</span>
            <span class="badge ${priorityClass(p.prioridade)}">${esc(p.prioridade)}</span>
          </div>
        </div>
        <div class="pc-ready ${readyClass}">
          <div class="pc-ready-top"><span>Readiness</span><b>${ready}%</b></div>
          <div class="pc-ready-track"><div class="pc-ready-fill" style="width:${ready}%"></div></div>
        </div>
        <div class="pc-meta dense">
          <span><b>Etapa</b> ${esc(p.etapa)}</span>
          <span><b>Resp.</b> ${esc(trunc(p.responsavel || '—', 24))}</span>
        </div>
        <div class="pc-ops">
          <div class="pc-ops-row"><b>Próx. gate</b><span title="${esc(ops.nextGate || '')}">${esc(nextGate || '—')}</span></div>
          <div class="pc-ops-row ${blocker ? 'has-blocker' : ''}"><b>Bloqueador</b><span title="${esc(ops.blocker || '')}">${esc(blocker || '—')}</span></div>
        </div>
        ${indicators ? `<div class="pc-indicators">${indicators}</div>` : ''}
        <div class="pc-actions">
          <button type="button" class="btn-open" data-open="${esc(p.id)}">Abrir</button>
          <button type="button" class="btn-ghost" data-edit="${esc(p.id)}">Editar</button>
          <button type="button" class="btn-danger-ghost" data-del="${esc(p.id)}">Excluir</button>
          <small class="muted pc-updated">${esc(formatDate(p.updatedAt))}</small>
        </div>
      </article>`;
      })
      .join('');

    root.querySelectorAll('[data-open]').forEach((el) => {
      el.onclick = (e) => {
        e.stopPropagation();
        PSC.app.openProject(el.dataset.open);
      };
    });
    root.querySelectorAll('[data-edit]').forEach((el) => {
      el.onclick = (e) => {
        e.stopPropagation();
        PSC.dashboard.openMetaModal(el.dataset.edit);
      };
    });
    root.querySelectorAll('[data-del]').forEach((el) => {
      el.onclick = (e) => {
        e.stopPropagation();
        const p = PSC.state.getProjetoById(el.dataset.del);
        if (!p) return;
        if (confirm(`Excluir o projeto "${p.nome}"? Esta ação não pode ser desfeita neste navegador.`)) {
          PSC.projects.remove(p.id);
          renderList();
          renderKpis();
          renderPortfolioCharts();
        }
      };
    });
  }

  function renderKpis() {
    const { q } = PSC.ui;
    const all = PSC.state.getProjetos();
    const charts = chartsApi();
    const ativos = all.filter((p) => charts.isAtivo(p));
    const criticos = all.filter((p) => p.prioridade === 'Crítica' || p.prioridade === 'Alta');
    const bloqueados = all.filter((p) => charts.isBloqueadoLike(p));
    const avgReady = all.length
      ? Math.round(all.reduce((s, p) => s + charts.readinessPct(p), 0) / all.length)
      : 0;
    if (q('#dash-total')) q('#dash-total').textContent = String(all.length);
    if (q('#dash-ativos')) q('#dash-ativos').textContent = String(ativos.length);
    if (q('#dash-criticos')) q('#dash-criticos').textContent = String(criticos.length);
    if (q('#dash-bloqueados')) q('#dash-bloqueados').textContent = String(bloqueados.length);
    if (q('#dash-readiness')) q('#dash-readiness').textContent = avgReady + '%';
  }

  function renderPortfolioCharts() {
    const { q } = PSC.ui;
    const charts = chartsApi();
    const all = PSC.state.getProjetos();
    if (!q('#portfolio-charts')) return;

    const byStatus = charts.countBy(all, (p) => p.status).map((x) => ({
      ...x,
      color: charts.statusColor(x.label)
    }));
    charts.donut(q('#chart-status'), byStatus, { title: 'Por status', centerLabel: 'projetos' });

    const byEtapa = charts.sortEtapa(charts.countBy(all, (p) => p.etapa));
    charts.hbars(q('#chart-etapa'), byEtapa, { title: 'Por etapa', labelW: 112, barMax: 140 });

    const bloqueados = all.filter((p) => charts.isBloqueadoLike(p)).length;
    const ativosLivres = all.filter((p) => charts.isAtivo(p) && !charts.isBloqueadoLike(p)).length;
    const encerrados = all.filter((p) => !charts.isAtivo(p)).length;
    charts.stack(
      q('#chart-blocked'),
      [
        { label: 'Ativos', value: ativosLivres, color: '#16845b' },
        { label: 'Bloqueados / risco', value: bloqueados, color: '#c92736' },
        { label: 'Encerrados / perdidos', value: encerrados, color: '#94a3b8' }
      ],
      { title: 'Bloqueados vs ativos' }
    );

    charts.hbars(q('#chart-readiness'), charts.readinessBuckets(all), {
      title: 'Readiness',
      labelW: 72,
      barMax: 150
    });

    const byPrio = ['Crítica', 'Alta', 'Média', 'Baixa']
      .map((label) => ({
        label,
        value: all.filter((p) => p.prioridade === label).length,
        color:
          label === 'Crítica'
            ? '#c92736'
            : label === 'Alta'
              ? '#df9700'
              : label === 'Baixa'
                ? '#16845b'
                : '#5b6abf'
      }))
      .filter((x) => x.value > 0);
    charts.donut(q('#chart-prioridade'), byPrio, { title: 'Prioridade', centerLabel: 'prio' });
  }

  function fillFilterSelects() {
    const { q, ETAPAS, STATUS_OPTS, PRIORIDADES } = PSC.ui;
    const fill = (sel, opts, label) => {
      const el = q(sel);
      if (!el) return;
      el.innerHTML =
        `<option value="">${label}</option>` +
        opts.map((o) => `<option value="${o}">${o}</option>`).join('');
    };
    fill('#filtro-etapa', ETAPAS, 'Todas as etapas');
    fill('#filtro-status', STATUS_OPTS, 'Todos os status');
    fill('#filtro-prioridade', PRIORIDADES, 'Todas as prioridades');
  }

  function wireFilters() {
    const { q } = PSC.ui;
    const st = PSC.state.getState();
    const bind = (sel, key) => {
      const el = q(sel);
      if (!el || (el.dataset && el.dataset.wired)) return;
      if (el.dataset) el.dataset.wired = '1';
      el.oninput = () => {
        st.ui[key] = el.value;
        renderList();
      };
    };
    bind('#search-projects', 'search');
    bind('#filtro-etapa', 'filtroEtapa');
    bind('#filtro-status', 'filtroStatus');
    bind('#filtro-prioridade', 'filtroPrioridade');
  }

  function openMetaModal(id) {
    const { q, ETAPAS, STATUS_OPTS, PRIORIDADES } = PSC.ui;
    const modal = q('#meta-modal');
    const form = q('#meta-form');
    if (!modal || !form) return;
    const p = id ? PSC.state.getProjetoById(id) : null;
    q('#meta-modal-title').textContent = p ? 'Editar projeto' : 'Novo projeto';
    form.dataset.id = p ? p.id : '';
    form.nome.value = p ? p.nome : '';
    form.cliente.value = p ? p.cliente : '';
    form.objetivo.value = p ? p.objetivo : '';
    form.responsavel.value = p ? p.responsavel : '';
    const fillSel = (name, opts, val) => {
      form[name].innerHTML = opts.map((o) => `<option value="${o}" ${o === val ? 'selected' : ''}>${o}</option>`).join('');
    };
    fillSel('etapa', ETAPAS, p ? p.etapa : 'Prospecção');
    fillSel('status', STATUS_OPTS, p ? p.status : 'Em análise');
    fillSel('prioridade', PRIORIDADES, p ? p.prioridade : 'Média');
    modal.hidden = false;
  }

  function closeMetaModal() {
    const modal = PSC.ui.q('#meta-modal');
    if (modal) modal.hidden = true;
  }

  function submitMeta(e) {
    e.preventDefault();
    const form = e.target;
    const meta = {
      nome: form.nome.value.trim() || 'Novo projeto',
      cliente: form.cliente.value.trim(),
      objetivo: form.objetivo.value.trim(),
      etapa: form.etapa.value,
      status: form.status.value,
      prioridade: form.prioridade.value,
      responsavel: form.responsavel.value.trim()
    };
    const id = form.dataset.id;
    if (id) {
      PSC.projects.updateMeta(id, meta);
    } else {
      PSC.projects.create(meta);
    }
    closeMetaModal();
    renderList();
    renderKpis();
    renderPortfolioCharts();
  }

  function renderPortfolio() {
    fillFilterSelects();
    wireFilters();
    renderKpis();
    renderPortfolioCharts();
    renderList();
  }

  PSC.dashboard = {
    renderPortfolio,
    renderList,
    renderKpis,
    renderPortfolioCharts,
    openMetaModal,
    closeMetaModal,
    submitMeta
  };
})(window.PSC);
