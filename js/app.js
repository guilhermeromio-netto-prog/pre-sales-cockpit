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
    // Carrega a carteira completa publicada junto com o site (sem arquivo no aparelho).
    q('#btn-carregar-completa').onclick = async () => {
      const url = 'data/PreSales_Cockpit_Carteira_Completa.json';
      try {
        const btn = q('#btn-carregar-completa');
        btn.disabled = true;
        btn.textContent = 'Carregando…';
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const text = await res.text();
        const n = PSC.projects.atualizarCarteiraDeJSON(text);
        alert('Carteira completa carregada: ' + n + ' projetos.');
        showPortfolio();
      } catch (err) {
        alert('Falha ao carregar carteira do site: ' + (err.message || err));
      } finally {
        const btn = q('#btn-carregar-completa');
        btn.disabled = false;
        btn.textContent = 'Carregar carteira completa';
      }
    };
    // Escolher JSON no aparelho (Backup baixado ou carteira) e atualizar o portfólio local.
    q('#btn-atualizar-carteira').onclick = () => q('#carteira-file').click();
    q('#carteira-file').onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const n = PSC.projects.atualizarCarteiraDeJSON(String(reader.result));
          alert('Carteira atualizada: ' + n + ' projetos.\nArquivo: ' + file.name);
          showPortfolio();
        } catch (err) {
          alert('Falha ao atualizar carteira: ' + (err.message || err));
        }
        e.target.value = '';
      };
      reader.readAsText(file);
    };
    q('#reset').onclick = () => {
      if (
        confirm(
          'Voltar ao seed embutido do app (carteira padrão) e apagar os dados deste navegador? Faça Backup JSON antes se precisar.'
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
