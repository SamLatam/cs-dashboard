// Extracted verbatim from index.html (lines ~6472-6932, "FAQ CS & ANYMARKET
// & ANYTOOLS")
//
// FAQ_DATA and `faqOpen` are module-level state that sit physically between
// renderPredicciones (index.html:6468) and renderFaq (index.html:6880) in the
// source — they are consumed only by renderFaq/toggleFaq/filterFaq below (and,
// cross-file, by renderCapacitacion's embedded FAQ viewer in
// ../ui/capacitacion.js), so they live here and are exported for that
// cross-file use.

const FAQ_DATA = [
  {
    cat: '🏪 AnyMarket — Plataforma y funcionamiento',
    items: [
      {
        q: '¿Qué es AnyMarket y qué problema resuelve?',
        a: `<strong>AnyMarket es un hub de integración multicanal</strong> que conecta el catálogo, stock y pedidos de un vendedor con múltiples marketplaces (Mercado Libre, Falabella, Ripley, Paris, Walmart, Amazon, etc.) desde un único panel.<br><br>
        El problema que resuelve: sin AnyMarket, un vendedor que opera en 5 marketplaces necesita gestionar 5 sistemas distintos — catálogo, precios, stock y pedidos por separado en cada uno. AnyMarket centraliza todo, elimina errores de stock cruzado y automatiza la sincronización en tiempo real.`
      },
      {
        q: '¿Cómo funciona la sincronización de stock en AnyMarket?',
        a: `AnyMarket sincroniza el stock en <strong>tiempo real o por polling</strong> según la configuración del marketplace. Cuando un pedido entra en cualquier canal, el stock se descuenta automáticamente en todos los demás para evitar sobreventa.<br><br>
        <strong>Puntos críticos a monitorear:</strong><br>
        - Errores de transmisión que dejan el stock desincronizado.<br>
        - Marketplaces con polling lento (mayor riesgo de sobreventa).<br>
        - SKUs con múltiples variantes mal mapeadas.`
      }
    ]
  }
];

let faqOpen = new Set();

function renderFaq() {
  const pg = document.getElementById('page-faq');
  if (!pg) return;

  const cats = FAQ_DATA.map((cat, ci) => {
    const items = cat.items.map((item, ii) => {
      const key = `${ci}-${ii}`;
      const isOpen = faqOpen.has(key);
      return `<div class="faq-item${isOpen?' open':''}" id="faq-${key}">
        <div class="faq-q" onclick="toggleFaq('${key}')">
          <span>${item.q}</span>
          <span class="faq-arrow">▼</span>
        </div>
        <div class="faq-a">${item.a}</div>
      </div>`;
    }).join('');
    return `<div class="faq-cat">
      <div class="faq-cat-title"><span>${cat.cat}</span></div>
      ${items}
    </div>`;
  }).join('');

  pg.innerHTML = `<div style="max-width:820px">
    <input class="faq-search" id="faqSearch" placeholder="🔍 Buscar en FAQ… (Repricing, churn, stock, NPS, Kits…)" oninput="filterFaq(this.value)">
    <div id="faqContent">${cats}</div>
  </div>`;
}

function toggleFaq(key) {
  const el = document.getElementById('faq-' + key);
  if (!el) return;
  if (faqOpen.has(key)) { faqOpen.delete(key); el.classList.remove('open'); }
  else { faqOpen.add(key); el.classList.add('open'); }
}

function filterFaq(q) {
  const term = q.toLowerCase().trim();
  const cont = document.getElementById('faqContent');
  if (!term) { renderFaq(); document.getElementById('faqSearch').value = q; return; }
  let html = '';
  FAQ_DATA.forEach((cat, ci) => {
    const matched = cat.items.filter(item =>
      item.q.toLowerCase().includes(term) || item.a.toLowerCase().includes(term)
    );
    if (!matched.length) return;
    const items = matched.map((item, ii) => `<div class="faq-item open">
      <div class="faq-q"><span>${item.q}</span><span class="faq-arrow">▼</span></div>
      <div class="faq-a">${item.a}</div>
    </div>`).join('');
    html += `<div class="faq-cat"><div class="faq-cat-title">${cat.cat}</div>${items}</div>`;
  });
  cont.innerHTML = html || '<div style="color:var(--text3);padding:32px 0;text-align:center">Sin resultados para "' + q + '"</div>';
}

// renderFaq's template calls toggleFaq('...') via onclick="", and both
// renderGuia/renderCapacitacion embed <input oninput="filterFaq(this.value)">
// — both must be reachable from global scope.
if (typeof window !== 'undefined') {
  window.toggleFaq = toggleFaq;
  window.filterFaq = filterFaq;
}

export { FAQ_DATA, renderFaq, toggleFaq, filterFaq };
