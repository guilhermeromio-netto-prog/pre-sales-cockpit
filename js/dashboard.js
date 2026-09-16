'use strict';
window.PSC = window.PSC || {};

(function (PSC) {
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

  function renderList() {
    const { q, esc } = PSC.ui;
    const list = PSC.projects.filtered();
    const root = q('#project-list');
    if (!root) return;
    q('#portfolio-count').textContent = `${list.length} projeto${list.length === 1 ? 'o' : 's'}`;
    if (!list.length) {
      root.innerHTML =
        '<div class="empty-state"><h3>Nenhum projeto encontrado</h3><p>Ajuste os filtros ou crie um novo projeto.</p></div>';
      return;
    }
    root.innerHTML = list
      .map(
        (p) => `<article class="project-card" data-open="${esc(p.id)}">
        <div class="pc-top">
          <div>
            <h3>${esc(p.nome)}</h3>
            <p class="muted">${esc(p.cliente || 'Sem cliente')}</p>
          </div>
          <span class="badge ${priorityClass(p.prioridade)}">${esc(p.prioridade)}</span>
        </div>
        <p class="pc-obj">${esc(p.objetivo || 'Sem objetivo definido')}</p>
        <div class="pc-meta">
          <span><b>Etapa</b> ${esc(p.etapa)}</span>
          <span><b>Status</b> ${esc(p.status)}</span>
          <span><b>Resp.</b> ${esc(p.responsavel || '—')}</span>
        </div>
        <div class="pc-actions">
          <button type="button" class="btn-open" data-open="${esc(p.id)}">Abrir</button>
          <button type="button" class="btn-ghost" data-edit="${esc(p.id)}">Editar</button>
          <button type="button" class="btn-danger-ghost" data-del="${esc(p.id)}">Excluir</button>
        </div>
        <small class="muted">Atualizado: ${esc(formatDate(p.updatedAt))}</small>
      </article>`
      )
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
        }
      };
    });
  }

  function renderKpis() {
    const { q } = PSC.ui;
    const all = PSC.state.getProjetos();
    const ativos = all.filter((p) => !['Encerrado', 'Perdido'].includes(p.etapa) && p.status !== 'Cancelado');
    const criticos = all.filter((p) => p.prioridade === 'Crítica' || p.prioridade === 'Alta');
    const bloqueados = all.filter((p) => p.status === 'Bloqueado');
    if (q('#dash-total')) q('#dash-total').textContent = String(all.length);
    if (q('#dash-ativos')) q('#dash-ativos').textContent = String(ativos.length);
    if (q('#dash-criticos')) q('#dash-criticos').textContent = String(criticos.length);
    if (q('#dash-bloqueados')) q('#dash-bloqueados').textContent = String(bloqueados.length);
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
      if (!el || el.dataset.wired) return;
      el.dataset.wired = '1';
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
    const { q, ETAPAS, STATUS_OPTS, PRIORIDADES, esc } = PSC.ui;
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
  }

  function renderPortfolio() {
    fillFilterSelects();
    wireFilters();
    renderKpis();
    renderList();
  }

  PSC.dashboard = {
    renderPortfolio,
    renderList,
    renderKpis,
    openMetaModal,
    closeMetaModal,
    submitMeta
  };
})(window.PSC);
