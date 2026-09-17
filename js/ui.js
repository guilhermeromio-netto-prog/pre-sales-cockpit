'use strict';
window.PSC = window.PSC || {};

(function (PSC) {
  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  function money(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  const q = (s, root) => (root || document).querySelector(s);
  const qa = (s, root) => [...(root || document).querySelectorAll(s)];

  function dl(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function setSavedLabel(msg) {
    const el = q('#saved');
    if (el) el.textContent = msg || ('Salvo ' + new Date().toLocaleTimeString('pt-BR'));
  }

  function showView(id) {
    qa('.view').forEach((v) => v.classList.toggle('active', v.id === id));
    qa('nav button[data-target]').forEach((b) =>
      b.classList.toggle('active', b.dataset.target === id)
    );
    window.scrollTo(0, 0);
  }

  function setAppMode(mode) {
    document.body.dataset.mode = mode;
    const portfolioNav = q('#nav-portfolio');
    const projectNav = q('#nav-project');
    if (portfolioNav) portfolioNav.hidden = mode !== 'portfolio';
    if (projectNav) projectNav.hidden = mode !== 'project';
    const back = q('#btn-back-portfolio');
    if (back) back.hidden = mode !== 'project';
    const projectTools = q('#project-toolbar');
    if (projectTools) projectTools.hidden = mode !== 'project';
    const portfolioTools = q('#portfolio-toolbar');
    if (portfolioTools) portfolioTools.hidden = mode !== 'portfolio';
    const stripProject = q('#strip-project');
    if (stripProject) stripProject.hidden = mode !== 'project';
  }

  PSC.ui = {
    esc,
    money,
    q,
    qa,
    dl,
    setSavedLabel,
    showView,
    setAppMode,
    ETAPAS: [
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
    ],
    STATUS_OPTS: ['Em análise', 'Em andamento', 'Bloqueado', 'Em risco', 'Concluído', 'Cancelado'],
    PRIORIDADES: ['Baixa', 'Média', 'Alta', 'Crítica']
  };
})(window.PSC);
