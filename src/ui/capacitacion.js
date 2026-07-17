// Extracted verbatim from index.html (lines ~5908-6028, "CAPACITACIÓN & VALOR")
//
// NOTE: the nav label for this page was renamed to "Expansión & Valor" and the
// in-page heading now reads "Radar de Expansión", but the underlying
// function/page-id are unchanged from the source's "Capacitación" naming —
// this was a label-only rename, so the real function name (renderCapacitacion)
// and DOM id (page-capacitacion) are preserved verbatim.
//
// CORRECTION vs task brief: the brief asked for PORTFOLIO_GAP/GRUPO_ESTRATEGICO
// to be imported into portfolio-a.js, but in the actual source those two
// consts (index.html:6936, 6960) are only referenced inside renderCapacitacion
// (this file) — renderPortfolioA uses its own unrelated local CLASS_A array.
// The import is therefore placed here instead.
//
import { PORTFOLIO_GAP, GRUPO_ESTRATEGICO } from '../domain/tiers.js';
import { PORT } from '../services/clients-repo.js';
import { FAQ_DATA } from './faq.js';

function renderCapacitacion() {
  const pg = document.getElementById('page-capacitacion');
  if (!pg) return;

  const quickWins   = PORTFOLIO_GAP.filter(x => x.gap === 1);
  const pushStrat   = PORTFOLIO_GAP.filter(x => x.gap === 2);
  const recovery    = PORTFOLIO_GAP.filter(x => x.gap >= 3);
  const grupos      = GRUPO_ESTRATEGICO || [];

  const produtos = [
    { nome:'Repricing Automático', icon:'⚡', keywords:['repricing','precio automático'] },
    { nome:'AnyTools',             icon:'🧰', keywords:['anytools'] },
    { nome:'Predize',              icon:'🤝', keywords:['predize'] },
    { nome:'TikTok Shop',          icon:'🎵', keywords:['tiktok'] },
    { nome:'Kits',                 icon:'📦', keywords:['kits','kit'] },
    { nome:'Marca Seleta',         icon:'🏷️', keywords:['marca seleta','marca selecta','brand'] },
    { nome:'QBR / EBR',            icon:'📋', keywords:['qbr','ebr','executive review'] },
    { nome:'Migración AnyMarket',  icon:'🚀', keywords:['migración','centry','migrate'] }
  ];

  const radarData = produtos.map(function(p) {
    const count = PORTFOLIO_GAP.filter(function(x) {
      const ac = (x.accion || '').toLowerCase();
      return p.keywords.some(function(k) { return ac.includes(k); });
    }).length;
    return { nome: p.nome, icon: p.icon, count: count };
  }).filter(function(p) { return p.count > 0; }).sort(function(a,b) { return b.count - a.count; });

  function kpi(valor, label, sub, color) {
    return '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px 20px;flex:1;min-width:120px;border-top:3px solid ' + color + '">' +
      '<div style="font-size:28px;font-weight:800;color:' + color + '">' + valor + '</div>' +
      '<div style="font-size:12px;font-weight:700;color:var(--text);margin-top:2px">' + label + '</div>' +
      '<div style="font-size:11px;color:var(--text3);margin-top:2px">' + sub + '</div></div>';
  }

  function grupoCard(g) {
    const names = g.ids.map(function(id) { return PORT.find(function(x){return x.id===id;})?.name||id; }).join(' · ');
    return '<div style="background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:12px;padding:18px 20px;flex:1;min-width:220px">' +
      '<div style="font-size:20px;margin-bottom:4px">' + g.icon + '</div>' +
      '<div style="font-weight:700;font-size:14px;margin-bottom:3px">' + g.nombre + '</div>' +
      '<div style="font-size:11px;color:var(--accent);font-weight:600;margin-bottom:8px">' + g.ids.length + ' cuentas · 1 reunión = múltiples upgrades</div>' +
      '<div style="font-size:12px;color:var(--text2);line-height:1.5;margin-bottom:8px">' + g.desc + '</div>' +
      '<div style="font-size:10px;color:var(--text3)">' + names + '</div></div>';
  }

  function radarBar(p) {
    const pct = Math.round((p.count / PORTFOLIO_GAP.length) * 100);
    return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">' +
      '<span style="font-size:16px;width:22px;text-align:center">' + p.icon + '</span>' +
      '<span style="font-size:13px;font-weight:600;flex:1">' + p.nome + '</span>' +
      '<div style="width:120px;height:8px;background:var(--surface2);border-radius:4px;overflow:hidden">' +
        '<div style="height:100%;width:' + pct + '%;background:var(--accent);border-radius:4px"></div></div>' +
      '<span style="font-size:12px;font-weight:700;color:var(--accent);min-width:28px;text-align:right">' + p.count + '</span></div>';
  }

  function actionRow(x) {
    const port = PORT.find(function(p){return p.id===x.id;});
    if (!port) return '';
    const gapColor = x.gap===1?'var(--green)':x.gap===2?'var(--yellow)':'var(--orange)';
    const gapLabel = x.gap===1?'⚡ Quick Win':x.gap===2?'🔥 30-60d':'🏗️ 60-90d';
    return '<tr onclick="currentClient=\''+x.id+'\';nav(\'ficha\',document.getElementById(\'nav-ficha\'))" style="cursor:pointer">' +
      '<td style="padding:10px 12px"><strong style="font-size:13px">' + port.name + '</strong>' +
        '<span style="font-size:10px;color:var(--text3);margin-left:6px">' + port.country + '</span></td>' +
      '<td><span style="background:' + gapColor + '20;color:' + gapColor + ';font-size:11px;font-weight:700;padding:3px 9px;border-radius:10px">' + gapLabel + '</span></td>' +
      '<td style="font-size:12px;color:var(--text2);max-width:300px;line-height:1.5">' + x.accion + '</td>' +
      '<td style="font-size:11px;color:var(--text3)">' + (x.grupo||'') + '</td></tr>';
  }

  const kpiRow = '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px">' +
    kpi(quickWins.length,  '⚡ Quick Wins',         'B→A esta semana',     'var(--green)') +
    kpi(pushStrat.length,  '🔥 Push Estratégico',  'C→A en 30-60 días',   'var(--yellow)') +
    kpi(recovery.length,   '🏗️ Recovery',           'Plan 60-90 días',     'var(--orange)') +
    kpi(grupos.length,     '🤝 Grupos Mult.',        '1 reunión = N upgrades','var(--accent)') +
    '</div>';

  const gruposSection = grupos.length ? (
    '<div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px">🤝 Grupos Estratégicos — Una reunión, múltiples cuentas</div>' +
    '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:28px">' + grupos.map(grupoCard).join('') + '</div>'
  ) : '';

  const radarSection =
    '<div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px">🎯 Radar de Expansión — Productos con mayor potencial</div>' +
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px 20px;margin-bottom:28px">' +
    radarData.map(radarBar).join('') +
    '<div style="font-size:11px;color:var(--text3);margin-top:10px">Clientes del portfolio con oportunidad identificada por producto</div></div>';

  const actionRows = PORTFOLIO_GAP.map(actionRow).join('');
  const tableSection =
    '<div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px">📋 Plan de Acción — Todos los clientes con potencial A</div>' +
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:28px">' +
    '<table><thead><tr><th>Cliente</th><th style="width:120px">Prioridad</th><th>Acción CS</th><th style="width:110px">Grupo</th></tr></thead>' +
    '<tbody>' + actionRows + '</tbody></table></div>';

  const refSection =
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden">' +
    '<div onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display===\'none\'?\'block\':\'none\'" ' +
      'style="padding:14px 20px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;font-weight:700;font-size:13px">' +
      '<span>📚 Referencia Rápida — FAQ &amp; Guía Operacional</span>' +
      '<span style="font-size:11px;color:var(--text3);font-weight:400">Clic para expandir ▼</span></div>' +
    '<div style="display:none;padding:0 20px 20px">' +
      '<input placeholder="🔍 Buscar en FAQ…" oninput="filterFaq(this.value)" ' +
        'style="width:100%;padding:9px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text1);font-size:13px;box-sizing:border-box;margin-bottom:12px">' +
      '<div id="faqContentEmbed"></div>' +
    '</div></div>';

  pg.innerHTML = '<div style="padding:0 0 40px">' + kpiRow + gruposSection + radarSection + tableSection + refSection + '</div>';

  try {
    var faqEl = document.getElementById('faqContentEmbed');
    if (faqEl && typeof FAQ_DATA !== 'undefined') {
      faqEl.innerHTML = FAQ_DATA.map(function(cat, ci) {
        return '<div style="margin-bottom:8px"><div style="font-weight:700;font-size:12px;color:var(--text3);text-transform:uppercase;padding:8px 0;letter-spacing:.5px">' + cat.cat + '</div>' +
          cat.items.map(function(item, ii) {
            return '<div style="border:1px solid var(--border);border-radius:8px;margin-bottom:6px;overflow:hidden">' +
              '<div onclick="var b=this.nextSibling;b.style.display=b.style.display===\'none\'?\'block\':\'none\'" style="padding:10px 14px;cursor:pointer;font-size:13px;font-weight:600">' + item.q + ' <span style="float:right;color:var(--text3)">▼</span></div>' +
              '<div style="display:none;padding:10px 14px;font-size:12px;color:var(--text2);line-height:1.6;border-top:1px solid var(--border)">' + item.a + '</div></div>';
          }).join('') + '</div>';
      }).join('');
    }
  } catch(e) {}
}

export { renderCapacitacion };
