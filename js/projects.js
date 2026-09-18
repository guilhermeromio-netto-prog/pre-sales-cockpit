'use strict';
window.PSC = window.PSC || {};

(function (PSC) {
  function save() {
    PSC.storageService.save(PSC.state.persistable());
    PSC.ui.setSavedLabel();
  }

  function enrichNilkoIfPresent(projetos) {
    const nilko = projetos.find((p) => {
      const hay = [p.nome, p.cliente, p._sourcePasta, p.ops && p.ops.pastaOneDrive, p.ops && p.ops.sourceFolder]
        .filter(Boolean)
        .join(' ');
      return /nilko/i.test(hay);
    });
    if (nilko && PSC.defaults.createNilkoOps) {
      const prev = nilko.ops || {};
      nilko.ops = Object.assign(PSC.defaults.createNilkoOps(), {
        pastaOneDrive: prev.pastaOneDrive || '',
        plannerTaskId: prev.plannerTaskId || '',
        plannerTaskIds: Array.isArray(prev.plannerTaskIds) ? prev.plannerTaskIds : [],
        artefatos: Array.isArray(prev.artefatos) ? prev.artefatos : [],
        fileCount: prev.fileCount || 0,
        checklistResumo: prev.checklistResumo || '',
        notasResumo: prev.notasResumo || '',
        matchStatus: prev.matchStatus || 'match',
        revisarMatch: !!prev.revisarMatch,
        matchConfianca: prev.matchConfianca || 'media',
        matchHits: Array.isArray(prev.matchHits) ? prev.matchHits : [],
        sourceFolder: prev.sourceFolder || ''
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

  function chartsHelper() {
    if (PSC.charts) return PSC.charts;
    return {
      isBloqueadoLike: (p) =>
        !!p && (p.status === 'Bloqueado' || p.status === 'Em risco'),
      readinessPct: () => 0
    };
  }

  function matchesTriage(p, chip) {
    const charts = chartsHelper();
    if (!chip || chip === 'todos') return true;
    if (chip === 'bloqueados') return charts.isBloqueadoLike(p);
    if (chip === 'alta') return p.prioridade === 'Alta' || p.prioridade === 'Crítica';
    if (chip === 'ready50') return charts.readinessPct(p) < 50;
    if (chip === 'blocker') {
      const b = p.ops && String(p.ops.blocker || '').trim();
      return !!b;
    }
    return true;
  }

  const PRIO_RANK = { Crítica: 0, Alta: 1, Média: 2, Media: 2, Baixa: 3 };

  function sortedList(list, sortBy) {
    const charts = chartsHelper();
    const etapaRank = (PSC.ui && PSC.ui.ETAPAS) || [];
    const key = sortBy || 'prioridade';
    const arr = list.slice();
    arr.sort((a, b) => {
      if (key === 'readiness') {
        return charts.readinessPct(a) - charts.readinessPct(b) || (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
      }
      if (key === 'etapa') {
        const ia = etapaRank.indexOf(a.etapa);
        const ib = etapaRank.indexOf(b.etapa);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
      }
      if (key === 'nome') {
        return (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
      }
      if (key === 'atualizado') {
        const ta = a.updatedAt ? Date.parse(a.updatedAt) : 0;
        const tb = b.updatedAt ? Date.parse(b.updatedAt) : 0;
        return tb - ta || (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
      }
      // default: prioridade then readiness ascending
      const pa = PRIO_RANK[a.prioridade] != null ? PRIO_RANK[a.prioridade] : 9;
      const pb = PRIO_RANK[b.prioridade] != null ? PRIO_RANK[b.prioridade] : 9;
      if (pa !== pb) return pa - pb;
      return charts.readinessPct(a) - charts.readinessPct(b) || (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
    });
    return arr;
  }

  function filtered() {
    const st = PSC.state.getState();
    const q = (st.ui.search || '').trim().toLowerCase();
    const chip = st.ui.triageChip || 'todos';
    const list = PSC.state.getProjetos().filter((p) => {
      if (st.ui.filtroEtapa && p.etapa !== st.ui.filtroEtapa) return false;
      if (st.ui.filtroStatus && p.status !== st.ui.filtroStatus) return false;
      if (st.ui.filtroPrioridade && p.prioridade !== st.ui.filtroPrioridade) return false;
      if (!matchesTriage(p, chip)) return false;
      if (!q) return true;
      const hay = [
        p.nome,
        p.cliente,
        p.objetivo,
        p.responsavel,
        p.etapa,
        p.status,
        p._sourcePasta,
        p.ops && p.ops.sourceFolder,
        p.ops && p.ops.pastaOneDrive,
        Array.isArray(p.ops && p.ops.artefatos) ? p.ops.artefatos.join(' ') : ''
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
    return sortedList(list, st.ui.sortBy || 'prioridade');
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

  /** Atualiza o portfólio a partir de um JSON (Backup ou carteira com .projetos). */
  function atualizarCarteiraDeJSON(text) {
    const data = PSC.storageService.parseBackup(text);
    const projetos = enrichNilkoIfPresent(data.projetos);
    PSC.state.hydrate({
      version: data.version || 1,
      projetos: projetos,
      projetoAtivoId: data.projetoAtivoId || null
    });
    save();
    return PSC.state.getProjetos().length;
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
    atualizarCarteiraDeJSON,
    resetAll
  };
})(window.PSC);
