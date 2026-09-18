'use strict';
window.PSC = window.PSC || {};

(function (PSC) {
  const STALE_DAYS = 7;
  const ATTENTION_MAX = 10;
  const EMPTY_MARKERS = new Set([
    '',
    '—',
    '-',
    '–',
    'n/a',
    'na',
    'pending',
    'pending validation',
    'sem bloqueio',
    'sem bloqueio ativo',
    'sem bloqueio ativo.',
    'nenhum',
    'none',
    'n.a.',
    'n.a'
  ]);

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
      statusColor: () => '#475569',
      colorAt: () => '#e20074',
      ETAPA_ORDER: []
    };
  }

  function esc(v) {
    return PSC.ui && PSC.ui.esc ? PSC.ui.esc(v) : String(v ?? '');
  }

  function trunc(s, n) {
    const t = String(s || '').trim();
    if (!t) return '';
    return t.length > n ? t.slice(0, n - 1) + '…' : t;
  }

  /** Text counts as real only if trimmed length > 2 and not a placeholder. */
  function isMeaningfulText(v) {
    const t = String(v == null ? '' : v).trim();
    if (t.length <= 2) return false;
    const key = t.toLowerCase().replace(/\s+/g, ' ');
    if (EMPTY_MARKERS.has(key)) return false;
    if (/^pending(\s+validation)?\.?$/i.test(key)) return false;
    if (/^sem bloqueio/i.test(key)) return false;
    return true;
  }

  function hasRealBlocker(p) {
    return isMeaningfulText(p && p.ops && p.ops.blocker);
  }

  function hasRealNextGate(p) {
    return isMeaningfulText(p && p.ops && p.ops.nextGate);
  }

  function hasRealLastProgress(p) {
    return isMeaningfulText(p && p.ops && p.ops.lastProgress);
  }

  function daysSinceUpdated(p) {
    if (!p || !p.updatedAt) return Infinity;
    const t = Date.parse(p.updatedAt);
    if (!Number.isFinite(t)) return Infinity;
    return (Date.now() - t) / (1000 * 60 * 60 * 24);
  }

  function isStale(p) {
    if (!p) return false;
    if (!hasRealLastProgress(p)) return true;
    return daysSinceUpdated(p) >= STALE_DAYS;
  }

  function isAtenção(p, charts) {
    if (!p || !charts.isAtivo(p)) return false;
    if (charts.isBloqueadoLike(p)) return true;
    if ((p.prioridade === 'Crítica' || p.prioridade === 'Alta') && hasRealBlocker(p)) return true;
    return false;
  }

  function statusClass(s) {
    if (s === 'Bloqueado') return 'st-bloqueado';
    if (s === 'Em risco') return 'st-risco';
    if (s === 'Concluído') return 'st-concluido';
    if (s === 'Cancelado') return 'st-cancelado';
    if (s === 'Em andamento') return 'st-andamento';
    return 'st-analise';
  }

  function attentionScore(p, charts) {
    let score = 0;
    if (p.status === 'Bloqueado') score += 45;
    else if (p.status === 'Em risco') score += 35;
    if (p.prioridade === 'Crítica') score += 28;
    else if (p.prioridade === 'Alta') score += 16;
    if (hasRealBlocker(p)) score += 22;
    const ready = charts.readinessPct(p);
    if (ready < 30) score += 18;
    else if (ready < 50) score += 10;
    if (isStale(p)) score += 14;
    if (!hasRealNextGate(p)) score += 4;
    return score;
  }

  function compute(allProjects) {
    const charts = chartsApi();
    const all = Array.isArray(allProjects) ? allProjects : [];
    const ativos = all.filter((p) => charts.isAtivo(p));
    const atencao = ativos.filter((p) => isAtenção(p, charts));
    const bloqueados = ativos.filter((p) => charts.isBloqueadoLike(p));
    const comGate = ativos.filter((p) => hasRealNextGate(p));
    const stale = ativos.filter((p) => isStale(p));
    const avgReady = ativos.length
      ? Math.round(ativos.reduce((s, p) => s + charts.readinessPct(p), 0) / ativos.length)
      : 0;
    const encerrados = all.filter((p) => !charts.isAtivo(p)).length;

    const ranked = ativos
      .map((p) => ({ p, score: attentionScore(p, charts) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || charts.readinessPct(a.p) - charts.readinessPct(b.p))
      .slice(0, ATTENTION_MAX);

    const byEtapa = charts.sortEtapa(charts.countBy(ativos, (p) => p.etapa || '—'));

    const pulse =
      `${ativos.length} em pipeline · ${atencao.length} pedem decisão · ` +
      `readiness médio ${avgReady}% · ${stale.length} sem atualização há ${STALE_DAYS}+ dias` +
      (encerrados ? ` · ${encerrados} encerrados/perdidos` : '') +
      '.';

    return {
      ativos,
      atencao,
      bloqueados,
      comGate,
      stale,
      avgReady,
      encerrados,
      ranked,
      byEtapa,
      pulse,
      kpis: {
        pipeline: ativos.length,
        atencao: atencao.length,
        bloqueados: bloqueados.length,
        gates: comGate.length,
        readiness: avgReady,
        stale: stale.length
      }
    };
  }

  function renderKpis(host, stats, activeChip) {
    if (!host) return;
    const chip = activeChip || 'todos';
    const cards = [
      {
        chip: 'pipeline',
        label: 'Em pipeline',
        value: String(stats.kpis.pipeline),
        tip: 'Ativos (fora Encerrado / Perdido / Cancelado)',
        accent: 'magenta'
      },
      {
        chip: 'atencao',
        label: 'Atenção',
        value: String(stats.kpis.atencao),
        tip: 'Bloqueado, Em risco ou Alta/Crítica com bloqueador real',
        accent: stats.kpis.atencao ? 'warn' : ''
      },
      {
        chip: 'bloqueados',
        label: 'Bloqueados',
        value: String(stats.kpis.bloqueados),
        tip: 'Status Bloqueado ou Em risco',
        accent: stats.kpis.bloqueados ? 'danger' : ''
      },
      {
        chip: 'gates',
        label: 'Gates / próximos',
        value: String(stats.kpis.gates),
        tip: 'Ativos com próximo gate preenchido (não vazio / n/a / pending)',
        accent: ''
      },
      {
        chip: 'ready50',
        label: 'Readiness médio',
        value: stats.kpis.readiness + '%',
        tip: 'Média só dos ativos · clique filtra readiness < 50%',
        accent: stats.kpis.readiness < 50 ? 'warn' : 'ok'
      },
      {
        chip: 'stale',
        label: 'Sem movimento',
        value: String(stats.kpis.stale),
        tip: `Ativos sem lastProgress útil ou updatedAt há ${STALE_DAYS}+ dias`,
        accent: stats.kpis.stale ? 'muted' : ''
      }
    ];
    host.innerHTML = cards
      .map(
        (c) => `<button type="button" class="dir-kpi ${c.accent ? 'dir-kpi-' + c.accent : ''} ${
          chip === c.chip ? 'active' : ''
        }" data-dir-chip="${c.chip}" title="${esc(c.tip)}">
        <small>${esc(c.label)}</small>
        <b>${esc(c.value)}</b>
        <span class="dir-kpi-tip">${esc(c.tip)}</span>
      </button>`
      )
      .join('');
  }

  function renderPulse(el, stats) {
    if (!el) return;
    el.textContent = stats.pulse;
  }

  function renderAttention(host, stats) {
    if (!host) return;
    const charts = chartsApi();
    if (!stats.ranked.length) {
      host.innerHTML = `<div class="dir-empty">
        <strong>Fila limpa</strong>
        <p>Nenhum ativo pedindo olhos agora. Pipeline saudável no momento.</p>
      </div>`;
      return;
    }
    host.innerHTML =
      `<div class="dir-attn-head"><span>Fila de atenção</span><small>top ${stats.ranked.length} · ordenado por urgência</small></div>` +
      `<ul class="dir-attn-list">` +
      stats.ranked
        .map(({ p }) => {
          const ops = p.ops || {};
          const ready = charts.readinessPct(p);
          const blocker = hasRealBlocker(p) ? trunc(ops.blocker, 64) : '';
          const gate = hasRealNextGate(p) ? trunc(ops.nextGate, 56) : '';
          const title = [p.cliente, p.nome].filter(Boolean).join(' · ') || p.nome || 'Projeto';
          return `<li class="dir-attn-row" data-open="${esc(p.id)}">
            <div class="dir-attn-main">
              <div class="dir-attn-title">${esc(title)}</div>
              <div class="dir-attn-meta">
                <span class="badge ${statusClass(p.status)}">${esc(p.status || '—')}</span>
                <span class="dir-ready">${ready}%</span>
                ${p.prioridade ? `<span class="dir-prio">${esc(p.prioridade)}</span>` : ''}
              </div>
              <div class="dir-attn-snips">
                ${
                  blocker
                    ? `<span class="dir-snip dir-snip-block" title="${esc(ops.blocker)}"><b>Bloqueio</b> ${esc(blocker)}</span>`
                    : ''
                }
                ${
                  gate
                    ? `<span class="dir-snip" title="${esc(ops.nextGate)}"><b>Gate</b> ${esc(gate)}</span>`
                    : '<span class="dir-snip dir-snip-muted"><b>Gate</b> —</span>'
                }
              </div>
            </div>
            <button type="button" class="dir-open" data-open="${esc(p.id)}">Abrir</button>
          </li>`;
        })
        .join('') +
      `</ul>`;
  }

  function renderFunnel(host, stats) {
    if (!host) return;
    const charts = chartsApi();
    const items = (stats.byEtapa || []).filter((x) => x.value > 0);
    const enc = stats.encerrados || 0;
    if (!items.length) {
      host.innerHTML = `<div class="dir-empty compact"><p>Sem ativos no funil.</p>${
        enc ? `<small>${enc} encerrados/perdidos fora do funil</small>` : ''
      }</div>`;
      return;
    }
    const max = Math.max(...items.map((x) => x.value), 1);
    const rows = items
      .map((d, i) => {
        const pct = Math.max(8, Math.round((d.value / max) * 100));
        const c = charts.colorAt ? charts.colorAt(i) : '#e20074';
        return `<div class="dir-funnel-row" title="${esc(d.label)}: ${d.value}">
          <span class="dir-funnel-label">${esc(d.label)}</span>
          <span class="dir-funnel-track"><span class="dir-funnel-bar" style="width:${pct}%;background:${c}"></span></span>
          <span class="dir-funnel-val">${d.value}</span>
        </div>`;
      })
      .join('');
    host.innerHTML = `<div class="dir-funnel-head"><span>Funil comercial</span><small>ativos por etapa${
      enc ? ` · ${enc} encerrados/perdidos fora` : ''
    }</small></div><div class="dir-funnel-body">${rows}</div>`;
  }

  function bindPanel(root, stats) {
    if (!root || root.dataset.dirWired) return;
    root.dataset.dirWired = '1';
    root.addEventListener('click', (e) => {
      const kpi = e.target.closest('[data-dir-chip]');
      if (kpi && root.contains(kpi)) {
        e.preventDefault();
        const chip = kpi.dataset.dirChip || 'todos';
        if (PSC.dashboard && PSC.dashboard.applyTriageChip) {
          PSC.dashboard.applyTriageChip(chip);
        }
        return;
      }
      const openBtn = e.target.closest('[data-open]');
      if (openBtn && root.contains(openBtn)) {
        e.preventDefault();
        e.stopPropagation();
        const id = openBtn.dataset.open;
        if (id && PSC.app && PSC.app.openProject) PSC.app.openProject(id);
      }
    });
  }

  function render(allProjects) {
    const { q } = PSC.ui || {};
    if (!q) return compute(allProjects);
    const panel = q('#diretoria-panel');
    if (!panel) return compute(allProjects);

    const stats = compute(allProjects);
    const chip = (PSC.state && PSC.state.getState().ui.triageChip) || 'todos';

    renderKpis(q('#dir-kpis'), stats, chip);
    renderPulse(q('#dir-pulse'), stats);
    renderAttention(q('#dir-attention'), stats);
    renderFunnel(q('#dir-funnel'), stats);
    bindPanel(panel, stats);

    // Keep legacy KPI ids in sync if still present
    if (q('#dash-total')) q('#dash-total').textContent = String((allProjects || []).length);
    if (q('#dash-ativos')) q('#dash-ativos').textContent = String(stats.kpis.pipeline);
    if (q('#dash-bloqueados')) q('#dash-bloqueados').textContent = String(stats.kpis.bloqueados);
    if (q('#dash-readiness')) q('#dash-readiness').textContent = stats.kpis.readiness + '%';
    if (q('#dash-criticos')) {
      const crit = (allProjects || []).filter(
        (p) => p.prioridade === 'Crítica' || p.prioridade === 'Alta'
      ).length;
      q('#dash-criticos').textContent = String(crit);
    }

    return stats;
  }

  PSC.diretoria = {
    render,
    compute,
    isMeaningfulText,
    hasRealBlocker,
    hasRealNextGate,
    isStale,
    isAtenção,
    isAtencao: isAtenção,
    STALE_DAYS
  };
})(window.PSC);
