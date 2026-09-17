'use strict';
window.PSC = window.PSC || {};

(function (PSC) {
  const COLORS = [
    '#e20074',
    '#182239',
    '#16845b',
    '#df9700',
    '#c92736',
    '#5b6abf',
    '#0e7490',
    '#7c3aed',
    '#b45309',
    '#475569'
  ];

  const ETAPA_ORDER = [
    'Prospecção',
    'Qualificação',
    'Descoberta',
    'Escopo',
    'Precificação',
    'Proposta enviada',
    'Negociação',
    'Aprovado',
    'Em execução',
    'Handover',
    'Encerrado',
    'Perdido'
  ];

  function colorAt(i) {
    return COLORS[i % COLORS.length];
  }

  function statusColor(status) {
    const map = {
      'Em análise': '#5b6abf',
      'Em andamento': '#e20074',
      Bloqueado: '#c92736',
      'Em risco': '#df9700',
      Concluído: '#16845b',
      Cancelado: '#70717e'
    };
    return map[status] || '#475569';
  }

  /** Readiness 0–100 from checks when present; otherwise from real ops/meta fields. */
  function readinessPct(p) {
    const ops = (p && p.ops) || {};
    const checks = ops.checks || {};
    const keys = Object.keys(checks).filter((k) => !String(k).startsWith('gate'));
    if (keys.length) {
      const done = keys.filter((k) => checks[k]).length;
      return Math.round((done / keys.length) * 100);
    }

    const pts = [];
    pts.push(p.cliente || ops.client || ops.address ? 1 : 0);
    pts.push(ops.need || p.objetivo ? 1 : 0);
    pts.push(ops.terminal && ops.terminal !== 'PENDING VALIDATION' ? 1 : 0);
    pts.push(ops.mobility && ops.mobility !== 'PENDING VALIDATION' ? 1 : 0);
    pts.push(ops.platform && ops.platform !== 'PENDING VALIDATION' ? 1 : 0);
    pts.push(Array.isArray(ops.bom) && ops.bom.length ? 1 : 0);
    const quotes = Array.isArray(ops.quotes) ? ops.quotes : [];
    pts.push(quotes.length && quotes.some((q) => q.cost || q.evidence) ? 1 : 0);
    pts.push(quotes.length && quotes.every((q) => q.evidence) ? 1 : 0);
    pts.push(+ops.fCarrier > 0 ? 1 : 0);
    const prices = Array.isArray(ops.prices) ? ops.prices : [];
    pts.push(prices.some((v) => +v[4] > 0) ? 1 : 0);
    pts.push(ops.decision === 'Aprovado' ? 1 : 0);
    pts.push(ops.lastProgress ? 1 : 0);
    pts.push(ops.nextGate ? 1 : 0);
    pts.push(ops.blocker && String(ops.blocker).trim() ? 0 : 1);

    const et = p.etapa || '';
    if (et === 'Perdido') {
      pts.push(0);
    } else {
      const idx = ETAPA_ORDER.indexOf(et);
      pts.push(idx >= 0 ? (idx + 1) / ETAPA_ORDER.length : 0.3);
    }

    const sum = pts.reduce((a, b) => a + b, 0);
    return Math.round((sum / pts.length) * 100);
  }

  function countBy(list, keyFn) {
    const map = new Map();
    list.forEach((item) => {
      const k = keyFn(item) || '—';
      map.set(k, (map.get(k) || 0) + 1);
    });
    return [...map.entries()].map(([label, value]) => ({ label, value }));
  }

  function sortEtapa(items) {
    return items.slice().sort((a, b) => {
      const ia = ETAPA_ORDER.indexOf(a.label);
      const ib = ETAPA_ORDER.indexOf(b.label);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  }

  function emptyMsg(el, msg) {
    el.innerHTML = `<p class="chart-empty">${msg || 'Sem dados'}</p>`;
  }

  /** Horizontal bar chart (SVG). items: [{label, value, color?}] */
  function hbars(el, items, opts) {
    if (!el) return;
    const o = opts || {};
    const data = (items || []).filter((x) => x.value > 0);
    if (!data.length) {
      emptyMsg(el, o.empty);
      return;
    }
    const max = Math.max(...data.map((x) => x.value), 1);
    const rowH = o.rowH || 22;
    const labelW = o.labelW || 108;
    const barMax = o.barMax || 160;
    const h = data.length * rowH + 8;
    const w = labelW + barMax + 36;
    const esc = PSC.ui.esc;
    const rows = data
      .map((d, i) => {
        const bw = Math.max(2, Math.round((d.value / max) * barMax));
        const y = i * rowH + 4;
        const c = d.color || colorAt(i);
        return `<g>
          <text x="0" y="${y + 12}" class="chart-label">${esc(d.label)}</text>
          <rect x="${labelW}" y="${y + 2}" width="${bw}" height="14" rx="3" fill="${c}"/>
          <text x="${labelW + bw + 6}" y="${y + 13}" class="chart-val">${d.value}</text>
        </g>`;
      })
      .join('');
    el.innerHTML = `<svg class="chart-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.title || 'Gráfico')}">${rows}</svg>`;
  }

  /** Donut chart. items: [{label, value, color?}] */
  function donut(el, items, opts) {
    if (!el) return;
    const o = opts || {};
    const data = (items || []).filter((x) => x.value > 0);
    if (!data.length) {
      emptyMsg(el, o.empty);
      return;
    }
    const total = data.reduce((s, x) => s + x.value, 0) || 1;
    const cx = 54;
    const cy = 54;
    const r = 40;
    const stroke = 14;
    const c = 2 * Math.PI * r;
    let offset = 0;
    const esc = PSC.ui.esc;
    const arcs = data
      .map((d, i) => {
        const len = (d.value / total) * c;
        const col = d.color || colorAt(i);
        const dash = `${len} ${c - len}`;
        const node = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="${stroke}"
          stroke-dasharray="${dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"/>`;
        offset += len;
        return node;
      })
      .join('');
    const legend = data
      .map((d, i) => {
        const col = d.color || colorAt(i);
        const pct = Math.round((d.value / total) * 100);
        return `<li><span class="swatch" style="background:${col}"></span>${esc(d.label)} <b>${d.value}</b> <small>${pct}%</small></li>`;
      })
      .join('');
    el.innerHTML = `<div class="donut-wrap">
      <svg class="chart-svg donut" viewBox="0 0 108 108" role="img" aria-label="${esc(o.title || 'Distribuição')}">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#eee" stroke-width="${stroke}"/>
        ${arcs}
        <text x="${cx}" y="${cy - 2}" text-anchor="middle" class="donut-center">${total}</text>
        <text x="${cx}" y="${cy + 12}" text-anchor="middle" class="donut-sub">${esc(o.centerLabel || 'total')}</text>
      </svg>
      <ul class="chart-legend">${legend}</ul>
    </div>`;
  }

  /** Compact stack / segmented bar. */
  function stack(el, items, opts) {
    if (!el) return;
    const o = opts || {};
    const data = (items || []).filter((x) => x.value > 0);
    if (!data.length) {
      emptyMsg(el, o.empty);
      return;
    }
    const total = data.reduce((s, x) => s + x.value, 0) || 1;
    const esc = PSC.ui.esc;
    const segs = data
      .map((d, i) => {
        const pct = (d.value / total) * 100;
        const col = d.color || colorAt(i);
        return `<span class="stack-seg" style="width:${pct}%;background:${col}" title="${esc(d.label)}: ${d.value}"></span>`;
      })
      .join('');
    const legend = data
      .map((d, i) => {
        const col = d.color || colorAt(i);
        return `<li><span class="swatch" style="background:${col}"></span>${esc(d.label)} <b>${d.value}</b></li>`;
      })
      .join('');
    el.innerHTML = `<div class="stack-bar">${segs}</div><ul class="chart-legend flat">${legend}</ul>`;
  }

  /** Mini progress bars list (label + pct). */
  function meters(el, items, opts) {
    if (!el) return;
    const o = opts || {};
    const data = items || [];
    if (!data.length) {
      emptyMsg(el, o.empty);
      return;
    }
    const esc = PSC.ui.esc;
    el.innerHTML = data
      .map((d) => {
        const pct = Math.max(0, Math.min(100, Math.round(d.value || 0)));
        const col = d.color || (pct >= 70 ? '#16845b' : pct >= 40 ? '#df9700' : '#e20074');
        return `<div class="meter">
          <div class="meter-top"><span>${esc(d.label)}</span><b>${pct}%</b></div>
          <div class="meter-track"><div class="meter-fill" style="width:${pct}%;background:${col}"></div></div>
        </div>`;
      })
      .join('');
  }

  function gateStates(ops) {
    const o = ops || {};
    const quotes = Array.isArray(o.quotes) ? o.quotes : [];
    const prices = Array.isArray(o.prices) ? o.prices : [];
    return [
      { label: 'Discovery', done: !!(o.address || o.need || o.client) },
      { label: 'BoM', done: Array.isArray(o.bom) && o.bom.length > 0 },
      { label: 'Cotação', done: quotes.length > 0 && quotes.every((v) => v.evidence) },
      { label: 'Frete', done: +o.fCarrier > 0 },
      { label: 'Pricing', done: prices.some((v) => +v[4] > 0) },
      { label: 'Approval', done: o.decision === 'Aprovado' },
      { label: 'Proposta', done: !!(o.proposalNo || o.commercial) },
      {
        label: 'Liberação',
        done: o.decision === 'Aprovado' && !!(o.approvalEvidence || o.approvedDate)
      }
    ];
  }

  function readinessBuckets(list) {
    const buckets = [
      { label: '0–24%', min: 0, max: 24, value: 0, color: '#c92736' },
      { label: '25–49%', min: 25, max: 49, value: 0, color: '#df9700' },
      { label: '50–74%', min: 50, max: 74, value: 0, color: '#5b6abf' },
      { label: '75–100%', min: 75, max: 100, value: 0, color: '#16845b' }
    ];
    list.forEach((p) => {
      const r = readinessPct(p);
      const b = buckets.find((x) => r >= x.min && r <= x.max);
      if (b) b.value += 1;
    });
    return buckets;
  }

  function isAtivo(p) {
    return !['Encerrado', 'Perdido'].includes(p.etapa) && p.status !== 'Cancelado';
  }

  function isBloqueadoLike(p) {
    return p.status === 'Bloqueado' || p.status === 'Em risco';
  }

  PSC.charts = {
    COLORS,
    ETAPA_ORDER,
    colorAt,
    statusColor,
    readinessPct,
    countBy,
    sortEtapa,
    hbars,
    donut,
    stack,
    meters,
    gateStates,
    readinessBuckets,
    isAtivo,
    isBloqueadoLike
  };
})(window.PSC);
