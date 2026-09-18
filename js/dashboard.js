'use strict';
window.PSC = window.PSC || {};

(function (PSC) {
  const CHIP_KEY = 'pscTriageChip';
  const VIEW_KEY = 'pscListView';
  const SORT_KEY = 'pscSortBy';
  const CHARTS_COLLAPSE_KEY = 'pscChartsCollapsed';

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

  function getListView() {
    const st = PSC.state.getState();
    return st.ui.listView || 'cards';
  }

  function setListView(view) {
    const st = PSC.state.getState();
    st.ui.listView = view === 'table' ? 'table' : 'cards';
    try {
      localStorage.setItem(VIEW_KEY, st.ui.listView);
    } catch (_) {}
  }

  function restorePrefs() {
    const st = PSC.state.getState();
    try {
      const chip = sessionStorage.getItem(CHIP_KEY);
      if (chip) st.ui.triageChip = chip;
    } catch (_) {}
    try {
      const view = localStorage.getItem(VIEW_KEY);
      if (view === 'cards' || view === 'table') st.ui.listView = view;
    } catch (_) {}
    try {
      const sort = sessionStorage.getItem(SORT_KEY);
      if (sort) st.ui.sortBy = sort;
    } catch (_) {}
  }

  function bindListActions(root) {
    if (!root) return;
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

  function emptyStateHtml(hasAnyProjects) {
    if (!hasAnyProjects) {
      return `<div class="empty-state empty-first-run">
        <h3>Nenhum projeto na carteira</h3>
        <p>Carregue a carteira completa publicada no site ou importe um JSON de backup.</p>
        <div class="empty-actions">
          <button type="button" class="btn-open" id="btn-empty-carregar">Carregar carteira completa</button>
          <button type="button" class="btn-ghost" id="btn-empty-file">Atualizar de arquivo…</button>
        </div>
        <p class="muted empty-help">No celular, use <b>Carregar carteira completa</b> para baixar os projetos hospedados no GitHub Pages.</p>
      </div>`;
    }
    return `<div class="empty-state"><h3>Nenhum projeto encontrado</h3><p>Ajuste os filtros, chips de triagem ou a busca.</p></div>`;
  }

  function wireEmptyActions(root) {
    const loadBtn = root.querySelector('#btn-empty-carregar');
    if (loadBtn) {
      loadBtn.onclick = () => {
        const main = PSC.ui.q('#btn-carregar-completa');
        if (main) main.click();
      };
    }
    const fileBtn = root.querySelector('#btn-empty-file');
    if (fileBtn) {
      fileBtn.onclick = () => {
        const main = PSC.ui.q('#btn-atualizar-carteira');
        if (main) main.click();
      };
    }
  }

  function cardHtml(p) {
    const { esc } = PSC.ui;
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
  }

  function tableHtml(list) {
    const { esc } = PSC.ui;
    const rows = list
      .map((p) => {
        const ops = p.ops || {};
        const ready = chartsApi().readinessPct(p);
        const blocker = trunc(ops.blocker, 40);
        const nextGate = trunc(ops.nextGate, 40);
        const label = trunc(p.cliente || p.nome, 28);
        const name = trunc(p.nome, 36);
        return `<tr>
          <td class="td-name"><b title="${esc(p.nome)}">${esc(name)}</b><small class="muted">${esc(label)}</small></td>
          <td><span class="badge ${statusClass(p.status)}">${esc(p.status)}</span></td>
          <td>${esc(trunc(p.etapa, 18))}</td>
          <td class="td-ready">${ready}%</td>
          <td title="${esc(ops.nextGate || '')}">${esc(nextGate || '—')}</td>
          <td class="${blocker ? 'td-blocker' : ''}" title="${esc(ops.blocker || '')}">${esc(blocker || '—')}</td>
          <td><button type="button" class="btn-open btn-table-open" data-open="${esc(p.id)}">Abrir</button></td>
        </tr>`;
      })
      .join('');
    return `<div class="project-table-wrap">
      <table class="project-table">
        <thead>
          <tr>
            <th>Cliente / Nome</th>
            <th>Status</th>
            <th>Etapa</th>
            <th>Ready%</th>
            <th>Próximo gate</th>
            <th>Bloqueador</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }

  function renderList() {
    const { q } = PSC.ui;
    const list = PSC.projects.filtered();
    const root = q('#project-list');
    if (!root) return;
    if (q('#portfolio-count')) q('#portfolio-count').textContent = `${list.length}`;
    const allCount = PSC.state.getProjetos().length;
    const view = getListView();
    root.classList.toggle('project-grid', view === 'cards');
    root.classList.toggle('project-table-host', view === 'table');

    if (!list.length) {
      root.innerHTML = emptyStateHtml(allCount > 0);
      wireEmptyActions(root);
      return;
    }

    if (view === 'table') {
      root.innerHTML = tableHtml(list);
    } else {
      root.innerHTML = list.map(cardHtml).join('');
    }
    bindListActions(root);
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

  function syncChipButtons() {
    const { qa } = PSC.ui;
    const chip = PSC.state.getState().ui.triageChip || 'todos';
    qa('.triage-chip').forEach((b) => {
      b.classList.toggle('active', b.dataset.chip === chip);
    });
  }

  function syncViewButtons() {
    const { q } = PSC.ui;
    const view = getListView();
    const cards = q('#view-cards');
    const table = q('#view-table');
    if (cards) cards.classList.toggle('active', view === 'cards');
    if (table) table.classList.toggle('active', view === 'table');
  }

  function syncSortSelect() {
    const { q } = PSC.ui;
    const el = q('#filtro-ordenar');
    const sort = PSC.state.getState().ui.sortBy || 'prioridade';
    if (el && el.value !== sort) el.value = sort;
  }

  function isNarrow() {
    return window.matchMedia && window.matchMedia('(max-width: 700px)').matches;
  }

  function applyChartsCollapsed(collapsed) {
    const { q } = PSC.ui;
    const wrap = q('#charts-wrap');
    const btn = q('#btn-toggle-charts');
    if (!wrap || !btn) return;
    wrap.classList.toggle('charts-collapsed', collapsed);
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    btn.textContent = collapsed ? 'Mostrar gráficos' : 'Ocultar gráficos';
  }

  function initChartsCollapse() {
    const { q } = PSC.ui;
    const btn = q('#btn-toggle-charts');
    if (!btn || btn.dataset.wired) return;
    btn.dataset.wired = '1';
    let collapsed = false;
    try {
      const saved = localStorage.getItem(CHARTS_COLLAPSE_KEY);
      if (saved === '1') collapsed = true;
      else if (saved === '0') collapsed = false;
      else collapsed = isNarrow();
    } catch (_) {
      collapsed = isNarrow();
    }
    applyChartsCollapsed(collapsed);
    btn.onclick = () => {
      const next = !q('#charts-wrap').classList.contains('charts-collapsed');
      applyChartsCollapsed(next);
      try {
        localStorage.setItem(CHARTS_COLLAPSE_KEY, next ? '1' : '0');
      } catch (_) {}
    };
  }

  function wireFilters() {
    const { q, qa } = PSC.ui;
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

    const sortEl = q('#filtro-ordenar');
    if (sortEl && !sortEl.dataset.wired) {
      sortEl.dataset.wired = '1';
      sortEl.onchange = () => {
        st.ui.sortBy = sortEl.value || 'prioridade';
        try {
          sessionStorage.setItem(SORT_KEY, st.ui.sortBy);
        } catch (_) {}
        renderList();
      };
    }

    qa('.triage-chip').forEach((b) => {
      if (b.dataset.wired) return;
      b.dataset.wired = '1';
      b.onclick = () => {
        st.ui.triageChip = b.dataset.chip || 'todos';
        try {
          sessionStorage.setItem(CHIP_KEY, st.ui.triageChip);
        } catch (_) {}
        syncChipButtons();
        renderList();
      };
    });

    const setView = (view) => {
      setListView(view);
      syncViewButtons();
      renderList();
    };
    const cardsBtn = q('#view-cards');
    const tableBtn = q('#view-table');
    if (cardsBtn && !cardsBtn.dataset.wired) {
      cardsBtn.dataset.wired = '1';
      cardsBtn.onclick = () => setView('cards');
    }
    if (tableBtn && !tableBtn.dataset.wired) {
      tableBtn.dataset.wired = '1';
      tableBtn.onclick = () => setView('table');
    }

    const stickyLoad = q('#btn-carregar-sticky');
    if (stickyLoad && !stickyLoad.dataset.wired) {
      stickyLoad.dataset.wired = '1';
      stickyLoad.onclick = () => {
        const main = q('#btn-carregar-completa');
        if (main) main.click();
      };
    }
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
    restorePrefs();
    fillFilterSelects();
    wireFilters();
    initChartsCollapse();
    syncChipButtons();
    syncViewButtons();
    syncSortSelect();
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
