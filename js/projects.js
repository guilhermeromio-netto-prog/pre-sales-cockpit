'use strict';
window.PSC = window.PSC || {};

(function (PSC) {
  function save() {
    PSC.storageService.save(PSC.state.persistable());
    PSC.ui.setSavedLabel();
  }

  function enrichNilkoIfPresent(projetos) {
    const nilko = projetos.find((p) => /nilko/i.test(p.nome + ' ' + (p.cliente || '') + ' ' + (p._sourcePasta || '')));
    if (nilko && PSC.defaults.createNilkoOps) {
      nilko.ops = Object.assign(PSC.defaults.createNilkoOps(), {
        pastaOneDrive: (nilko.ops && nilko.ops.pastaOneDrive) || '',
        plannerTaskId: (nilko.ops && nilko.ops.plannerTaskId) || '',
        artefatos: (nilko.ops && nilko.ops.artefatos) || []
      });
      nilko.cliente = 'Nilko Tecnologia Ltda.';
      nilko.nome = 'Nilko — Starlink Mobile';
      nilko.etapa = nilko.etapa || 'Precificação';
      nilko.status = nilko.status === 'Concluído' ? 'Em andamento' : nilko.status;
      nilko.prioridade = 'Alta';
    }
    return projetos;
  }

  function cloneCarteiraSeed() {
    if (!PSC.CARTEIRA_SEED || !Array.isArray(PSC.CARTEIRA_SEED.projetos)) {
      return [PSC.defaults.createNilkoSeedProject()];
    }
    const raw = JSON.parse(JSON.stringify(PSC.CARTEIRA_SEED));
    const projetos = enrichNilkoIfPresent(raw.projetos);
    return { projetos: projetos, projetoAtivoId: raw.projetoAtivoId || (projetos[0] && projetos[0].id) || null };
  }

  function ensureSeed() {
    if (PSC.state.getProjetos().length === 0) {
      const seed = cloneCarteiraSeed();
      if (Array.isArray(seed)) {
        PSC.state.setProjetos(seed);
      } else {
        PSC.state.hydrate(seed);
      }
      save();
    }
  }

  /** Substitui o portfólio pela carteira cruzada OneDrive × Planner. */
  function importCarteiraCruzada() {
    const seed = cloneCarteiraSeed();
    if (Array.isArray(seed)) {
      PSC.state.hydrate({ projetos: seed, projetoAtivoId: seed[0] ? seed[0].id : null });
    } else {
      PSC.state.hydrate(seed);
    }
    save();
    return PSC.state.getProjetos().length;
  }

  function create(meta) {
    const p = PSC.defaults.createProject(meta || {});
    PSC.state.getProjetos().push(p);
    save();
    return p;
  }

  function updateMeta(id, meta) {
    const p = PSC.state.getProjetoById(id);
    if (!p) return null;
    ['nome', 'cliente', 'objetivo', 'etapa', 'status', 'prioridade', 'responsavel'].forEach((k) => {
      if (meta[k] !== undefined) p[k] = meta[k];
    });
    PSC.state.touch(p);
    save();
    return p;
  }

  function remove(id) {
    const list = PSC.state.getProjetos();
    const i = list.findIndex((p) => p.id === id);
    if (i < 0) return false;
    list.splice(i, 1);
    if (PSC.state.getState().projetoAtivoId === id) {
      PSC.state.setAtivoId(null);
    }
    save();
    return true;
  }

  function open(id) {
    const p = PSC.state.getProjetoById(id);
    if (!p) return null;
    PSC.state.setAtivoId(id);
    save();
    return p;
  }

  function closeActive() {
    PSC.state.setAtivoId(null);
    save();
  }

  function markDirty() {
    const p = PSC.state.getAtivo();
    PSC.state.touch(p);
    save();
  }

  function filtered() {
    const st = PSC.state.getState();
    const q = (st.ui.search || '').trim().toLowerCase();
    return PSC.state.getProjetos().filter((p) => {
      if (st.ui.filtroEtapa && p.etapa !== st.ui.filtroEtapa) return false;
      if (st.ui.filtroStatus && p.status !== st.ui.filtroStatus) return false;
      if (st.ui.filtroPrioridade && p.prioridade !== st.ui.filtroPrioridade) return false;
      if (!q) return true;
      const hay = [p.nome, p.cliente, p.objetivo, p.responsavel, p.etapa, p.status]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }

  function backup() {
    const json = PSC.storageService.exportJSON(PSC.state.persistable());
    PSC.ui.dl(new Blob([json], { type: 'application/json' }), 'PreSales_Cockpit_Backup.json');
  }

  function restore(text) {
    const data = PSC.storageService.parseBackup(text);
    PSC.state.hydrate(data);
    save();
  }

  function resetAll() {
    PSC.storageService.clear();
    PSC.state.hydrate({ projetos: [], projetoAtivoId: null });
    ensureSeed();
  }

  PSC.projects = {
    save,
    ensureSeed,
    importCarteiraCruzada,
    create,
    updateMeta,
    remove,
    open,
    closeActive,
    markDirty,
    filtered,
    backup,
    restore,
    resetAll
  };
})(window.PSC);
