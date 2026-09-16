'use strict';
window.PSC = window.PSC || {};

(function (PSC) {
  function loadOrSeed() {
    const data = PSC.storageService.load();
    if (data && Array.isArray(data.projetos) && data.projetos.length) {
      PSC.state.hydrate(data);
    } else {
      PSC.state.hydrate({ projetos: [], projetoAtivoId: null });
      PSC.projects.ensureSeed();
    }
  }

  function showPortfolio() {
    PSC.projects.closeActive();
    PSC.ui.setAppMode('portfolio');
    PSC.ui.showView('portfolio');
    PSC.dashboard.renderPortfolio();
    PSC.ui.q('#header-title').textContent = 'Portfólio de Pré-Vendas';
    PSC.ui.q('#header-sub').textContent = 'T•PRESALES | Multi-projeto offline';
  }

  function openProject(id) {
    const p = PSC.projects.open(id);
    if (!p) return;
    PSC.ui.setAppMode('project');
    PSC.ops.mountProject();
    PSC.ui.showView('dashboard');
    PSC.ui.q('#header-title').textContent = 'Cockpit de Pré-Vendas';
    PSC.ui.q('#header-sub').textContent = p.nome + ' · ' + (p.cliente || '');
  }

  function wireNav() {
    const { qa, showView } = PSC.ui;
    qa('nav button[data-target]').forEach((b) => {
      b.onclick = () => {
        const target = b.dataset.target;
        if (target === 'portfolio') {
          showPortfolio();
          return;
        }
        if (!PSC.state.getAtivo()) {
          showPortfolio();
          return;
        }
        showView(target);
      };
    });
  }

  function wireGlobal() {
    const { q } = PSC.ui;
    q('#btn-back-portfolio').onclick = () => showPortfolio();
    q('#btn-new-project').onclick = () => PSC.dashboard.openMetaModal(null);
    q('#meta-form').onsubmit = (e) => PSC.dashboard.submitMeta(e);
    q('#meta-cancel').onclick = () => PSC.dashboard.closeMetaModal();
    q('#meta-modal-backdrop').onclick = () => PSC.dashboard.closeMetaModal();

    q('#save').onclick = () => {
      PSC.projects.save();
      PSC.ui.setSavedLabel();
    };
    q('#backup').onclick = () => PSC.projects.backup();
    q('#restore').onclick = () => q('#restore-file').click();
    q('#restore-file').onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          PSC.projects.restore(String(reader.result));
          alert('Backup restaurado com sucesso.');
          showPortfolio();
        } catch (err) {
          alert('Falha ao restaurar: ' + (err.message || err));
        }
        e.target.value = '';
      };
      reader.readAsText(file);
    };
    const btnImport = q('#btn-import-carteira');
    if (btnImport) {
      btnImport.onclick = () => {
        if (
          !confirm(
            'Substituir o portfólio atual pela carteira cruzada OneDrive × Planner (16/09/2026)? Faça backup antes se precisar.'
          )
        ) {
          return;
        }
        const n = PSC.projects.importCarteiraCruzada();
        alert('Carteira importada: ' + n + ' projetos.');
        showPortfolio();
      };
    }
    q('#reset').onclick = () => {
      if (
        confirm(
          'Restaurar o portfólio padrão (carteira cruzada OneDrive × Planner) e apagar todos os dados deste navegador?'
        )
      ) {
        PSC.projects.resetAll();
        showPortfolio();
      }
    };
    q('#print').onclick = () => print();
    PSC.ops.wireProjectActions();
  }

  function init() {
    loadOrSeed();
    wireNav();
    wireGlobal();
    if (PSC.state.getAtivo()) {
      openProject(PSC.state.getAtivo().id);
    } else {
      showPortfolio();
    }
  }

  PSC.app = { init, openProject, showPortfolio };

  document.addEventListener('DOMContentLoaded', init);
})(window.PSC);
