'use strict';
window.PSC = window.PSC || {};

(function (PSC) {
  function calcFreight(ops) {
    const qty = +ops.fQty || 0;
    return {
      declared: qty * (+ops.fGross || 0) + (+ops.fExtraGross || 0),
      weight: qty * (+ops.fWeight || 0) + (+ops.fExtraWeight || 0),
      volumes: qty * (+ops.fVolumes || 0) + (+ops.fExtraVolumes || 0),
      pricingUnit: (+ops.fCarrier || 0) * (+ops.fFactor || 1.3)
    };
  }

  function calcPricing(ops) {
    let oc = 0,
      mc = 0,
      os = 0,
      ms = 0;
    (ops.prices || []).forEach((r) => {
      const c = (+r[4] || 0) * (+r[5] || 0);
      const sell = ((+r[4] || 0) / (1 - (+r[8] || 0) / 100 || 1)) * (+r[5] || 0);
      if (r[3] === 'OTC') {
        oc += c;
        os += sell;
      } else {
        mc += c;
        ms += sell;
      }
    });
    const months = +ops.months || 24;
    const cost = oc + mc * months;
    const sales = os + ms * months;
    return {
      otcCost: oc,
      mrcCost: mc,
      tcv: sales,
      gm: sales ? ((sales - cost) / sales) * 100 : 0
    };
  }

  function renderFinance() {
    const ops = PSC.state.getOps();
    if (!ops) return;
    const { money, q } = PSC.ui;
    const f = calcFreight(ops);
    if (q('#fDeclared')) q('#fDeclared').textContent = money(f.declared);
    if (q('#fWeightTotal')) q('#fWeightTotal').textContent = f.weight + ' kg';
    if (q('#fVolumeTotal')) q('#fVolumeTotal').textContent = String(f.volumes);
    if (q('#fPricing')) q('#fPricing').textContent = money(f.pricingUnit);
    const p = calcPricing(ops);
    if (q('#otcCost')) q('#otcCost').textContent = money(p.otcCost);
    if (q('#mrcCost')) q('#mrcCost').textContent = money(p.mrcCost);
    if (q('#tcv')) q('#tcv').textContent = money(p.tcv);
    if (q('#gm')) q('#gm').textContent = p.gm.toFixed(1) + '%';
  }

  PSC.finance = { calcFreight, calcPricing, renderFinance };
})(window.PSC);
