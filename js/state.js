'use strict';
window.PSC = window.PSC || {};

(function (PSC) {
  /** Single source of truth. Views never keep their own project copies. */
  const state = {
    projetos: [],
    projetoAtivoId: null,
    ui: {
      search: '',
      filtroEtapa: '',
      filtroStatus: '',
      filtroPrioridade: ''
    }
  };

  function getState() {
    return state;
  }

  function getProjetos() {
    return state.projetos;
  }

  function getProjetoById(id) {
    return state.projetos.find((p) => p.id === id) || null;
  }

  function getAtivo() {
    if (!state.projetoAtivoId) return null;
    return getProjetoById(state.projetoAtivoId);
  }

  /** Operational payload of the active project (live reference). */
  function getOps() {
    const p = getAtivo();
    return p ? p.ops : null;
  }

  function setProjetos(list) {
    state.projetos = list;
  }

  function setAtivoId(id) {
    state.projetoAtivoId = id;
  }

  function touch(projeto) {
    if (projeto) projeto.updatedAt = new Date().toISOString();
  }

  function persistable() {
    return {
      version: 1,
      projetos: state.projetos,
      projetoAtivoId: state.projetoAtivoId
    };
  }

  function hydrate(data) {
    state.projetos = Array.isArray(data.projetos) ? data.projetos : [];
    state.projetoAtivoId = data.projetoAtivoId || null;
    if (state.projetoAtivoId && !getProjetoById(state.projetoAtivoId)) {
      state.projetoAtivoId = null;
    }
  }

  PSC.state = {
    getState,
    getProjetos,
    getProjetoById,
    getAtivo,
    getOps,
    setProjetos,
    setAtivoId,
    touch,
    persistable,
    hydrate
  };
})(window.PSC);
