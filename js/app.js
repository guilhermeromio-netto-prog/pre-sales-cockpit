'use strict';
window.PSC = window.PSC || {};

(function (PSC) {
  const SKIP_AUTO_KEY = 'pscSkipAutoCarteira';
  const CARTEIRA_URL = 'data/PreSales_Cockpit_Carteira_Completa.json';

  function setStripStatus(msg) {
    const el = PSC.ui.q('#strip-status');
    if (el) el.textContent = msg || '';
  }

  function loadOrSeed() {
    const data = PSC.storageService.load();
    if (data && Array.isArray(data.projetos) && data.projetos.length) {
      PSC.state.hydrate(data);
      setStripStatus('Carteira v1.1 · ' + data.projetos.length + ' projetos');
    } else {
      PSC.state.hydrate({ projetos: [], projetoAtivoId: null });
      // Não chama ensureSeed aqui: maybeAutoLoadCarteira busca a carteira completa
      // (ou faz seed se o fetch falhar / Reset pediu para pular).
    }
  }

  function showPortfolio() {
    PSC.projects.closeActive();
    PSC.ui.setAppMode('portfolio');
    PSC.ui.showView('portfolio');
    PSC.dashboard.renderPortfolio();
    PSC.ui.q('#header-title').textContent = 'Portfólio de Pré-Vendas';
    PSC.ui.q('#header-sub').textContent = 'T•PRESALES | Multi-projeto offline · v1.1';
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
        if (PSC.ops && PSC.ops.updateSituationStrip) PSC.ops.updateSituationStrip();
      };
    });
  }

  async function carregarCarteiraCompleta({ silent } = {}) {
    const { q } = PSC.ui;
    const btn = q('#btn-carregar-completa');
    const sticky = q('#btn-carregar-sticky');
    const label = btn ? btn.textContent : '';
    try {
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Carregando…';
      }
      if (sticky) sticky.disabled = true;
      setStripStatus('Carregando carteira…');
      const res = await fetch(CARTEIRA_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      const n = PSC.projects.atualizarCarteiraDeJSON(text);
      try {
        sessionStorage.removeItem(SKIP_AUTO_KEY);
      } catch (_) {}
      try {
        showPortfolio();
      } catch (renderErr) {
        console.error(renderErr);
      }
      setStripStatus('Carteira v1.1 · ' + n + ' projetos');
      if (!silent) alert('Carteira completa carregada: ' + n + ' projetos.');
      return n;
    } catch (err) {
      setStripStatus('Falha ao carregar carteira');
      if (!silent) alert('Falha ao carregar carteira do site: ' + (err.message || err));
      throw err;
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = label || 'Carregar carteira completa';
      }
      if (sticky) sticky.disabled = false;
    }
  }

  async function maybeAutoLoadCarteira() {
    if (PSC.state.getProjetos().length > 0) {
      setStripStatus('Carteira v1.1 · ' + PSC.state.getProjetos().length + ' projetos');
      return;
    }
    let skip = false;
    try {
      skip = sessionStorage.getItem(SKIP_AUTO_KEY) === '1';
    } catch (_) {}
    if (skip) {
      PSC.projects.ensureSeed();
      showPortfolio();
      setStripStatus('Carteira v1.1 · ' + PSC.state.getProjetos().length + ' projetos (seed)');
      return;
    }
    try {
      await carregarCarteiraCompleta({ silent: true });
    } catch (err) {
      console.warn('Auto-load carteira falhou; usando seed.', err);
      PSC.projects.ensureSeed();
      showPortfolio();
      setStripStatus(
        'Carteira v1.1 · ' + PSC.state.getProjetos().length + ' projetos (seed local)'
      );
    }
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
    q('#btn-carregar-completa').onclick = () => {
      carregarCarteiraCompleta({ silent: false }).catch(() => {});
    };
    q('#btn-atualizar-carteira').onclick = () => q('#carteira-file').click();
    q('#carteira-file').onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const n = PSC.projects.atualizarCarteiraDeJSON(String(reader.result));
          try {
            sessionStorage.removeItem(SKIP_AUTO_KEY);
          } catch (_) {}
          try {
            showPortfolio();
          } catch (renderErr) {
            console.error(renderErr);
          }
          setStripStatus('Carteira v1.1 · ' + n + ' projetos');
          alert('Carteira atualizada: ' + n + ' projetos.\nArquivo: ' + file.name);
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
        try {
          sessionStorage.setItem(SKIP_AUTO_KEY, '1');
        } catch (_) {}
        PSC.projects.resetAll();
        showPortfolio();
        setStripStatus(
          'Carteira v1.1 · ' + PSC.state.getProjetos().length + ' projetos (seed)'
        );
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
      setStripStatus('Carteira v1.1 · ' + PSC.state.getProjetos().length + ' projetos');
    } else {
      showPortfolio();
      maybeAutoLoadCarteira();
    }
  }

  PSC.app = { init, openProject, showPortfolio, carregarCarteiraCompleta, setStripStatus };

  document.addEventListener('DOMContentLoaded', init);
})(window.PSC);
