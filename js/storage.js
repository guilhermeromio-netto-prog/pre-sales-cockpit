'use strict';
window.PSC = window.PSC || {};

(function (PSC) {
  const KEY = 'preSalesCockpitV1';

  const storageService = {
    key: KEY,
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (e) {
        console.warn('Falha ao ler storage', e);
        return null;
      }
    },
    save(data) {
      localStorage.setItem(KEY, JSON.stringify(data));
    },
    clear() {
      localStorage.removeItem(KEY);
    },
    exportJSON(data) {
      return JSON.stringify(data, null, 2);
    },
    parseBackup(text) {
      const data = JSON.parse(text);
      if (!data || !Array.isArray(data.projetos)) {
        throw new Error('Backup inválido: falta array projetos');
      }
      return data;
    }
  };

  PSC.storageService = storageService;
})(window.PSC);
