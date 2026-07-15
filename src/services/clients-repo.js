import { norm, today } from '../lib/format.js';
import { showToast } from '../lib/dom.js';
import { getActiveUser, getVisibleClientIds, loadUsers } from './profiles-repo.js';
import { getActions, setActions, getActionsKey, seedActions, mergeSeedActions, LS_ACTIONS } from './actions-repo.js';
import { loadNotes } from './notes-repo.js';
import { scheduleGistSave } from './gist-sync.js';
// NOTE: circular import (clients-repo.js <-> auth.js) — pushToSupabase is only invoked from
// inside saveData() at runtime, never at module-evaluation time, so this is safe with
// Vite/ESM. See this agent's final report for the full circular-import map.
import { pushToSupabase } from './auth.js';
import { renderKPIs } from '../ui/kpis.js';
import { renderTable } from '../ui/overview.js';
import { renderFicha } from '../ui/ficha.js';
// TODO(integration): setUpdateLabel was not assigned an explicit file+path in this agent's
// task, and no sibling ui/*.js module exports it yet (confirmed via a repo-wide search) —
// assuming a main.js re-export for now, reconcile once its real home is decided.
import { setUpdateLabel } from '../main.js';

export const PORT = [
  {id:'fashions-park',   name:'FASHIONS PARK',                            country:'CL', centry:false, segmento:'Moda',        porte:'Enterprise'},
  {id:'coboe-botiga',    name:'COBOE S/A - BOTIGA',                       country:'UY', centry:false, segmento:'Farmacia',    porte:'Mid Market'},
  {id:'coboe-farmashop', name:'COBOE S/A - FARMASHOP',                    country:'UY', centry:false, segmento:'Farmacia',    porte:'Mid Market'},
  {id:'df-farma',        name:'D&F FARMA',                                country:'CL', centry:false, segmento:'Farma',       porte:'SMB'},
  {id:'divino',          name:'DIVINO S.A',                               country:'CL', centry:false, segmento:'Moda',        porte:'Mid Market'},
  {id:'dtodoymas',       name:'DTODOYMAS',                                country:'CL', centry:false, segmento:'Retail',      porte:'Mid Market'},
  {id:'forus-colombia',  name:'FORUS COLOMBIA',                           country:'CO', centry:true,  segmento:'Calzado',     porte:'Enterprise'},
  {id:'forus-sa',        name:'FORUS SA',                                 country:'CL', centry:true,  segmento:'Calzado',     porte:'Enterprise'},
  {id:'gino',            name:'GINO',                                     country:'CL', centry:true,  segmento:'Calzado',     porte:'Mid Market'},
  {id:'malaga',          name:'INVERSIONES MALAGA',                       country:'CL', centry:false, segmento:'Retail',      porte:'SMB'},
  {id:'loi-chile',       name:'LOI CHILE',                                country:'CL', centry:false, segmento:'Moda',        porte:'Mid Market'},
  {id:'lounge',          name:'LOUNGE S/A',                               country:'CL', centry:false, segmento:'Moda',        porte:'Mid Market'},
  {id:'maisa',           name:'MAISA',                                    country:'CL', centry:true,  segmento:'Retail',      porte:'Mid Market'},
  {id:'maui',            name:'MAUI AND SONS',                            country:'CL', centry:false, segmento:'Deportes',    porte:'Mid Market'},
  {id:'pillin',          name:'BEITGROUP S.A. (PILLIN)',                  country:'CL', centry:false, segmento:'Moda',        porte:'Mid Market'},
  {id:'pointbreak',      name:'POINTBREAK',                               country:'CL', centry:false, segmento:'Deportes',    porte:'SMB'},
  {id:'belcorp-col',     name:'BEL STAR S/A - BELCORP Colombia',          country:'CO', centry:false, segmento:'Belleza',     porte:'Enterprise'},
  {id:'colombiana',      name:'COLOMBIANA DE COMERCIO S/A',               country:'CO', centry:false, segmento:'Retail',      porte:'Enterprise'},
  {id:'emma-sleep',      name:'EMMA SLEEP - CL',                          country:'CL', centry:false, segmento:'Hogar',       porte:'Mid Market'},
  {id:'lacoste',         name:'LACOSTE - CL',                             country:'CL', centry:false, segmento:'Moda Premium',porte:'Enterprise'},
  {id:'belcorp-chile',   name:'PROMOTORA DE BELLEZA S/A - BELCORP Chile', country:'CL', centry:false, segmento:'Belleza',     porte:'Enterprise'},
  {id:'transbel',        name:'TRANSBEL S.A. DE C.V. - BELCORP Mexico',   country:'MX', centry:false, segmento:'Belleza',     porte:'Enterprise'},
  {id:'whirlpool',       name:'WHIRLPOOL',                                country:'—',  centry:false, segmento:'Electrodomésticos', porte:'Enterprise'},
  {id:'beitgroup-pe',    name:'BEITGROUP PE',                             country:'PE', centry:false, segmento:'Moda',        porte:'Mid Market'},
  {id:'rip-curl',        name:'RIP CURL',                                 country:'CL', centry:false, segmento:'Deportes',    porte:'Mid Market'},
  {id:'updown-juegos',   name:'UPDOWN JUEGOS',                            country:'CL', centry:false, segmento:'Gaming',      porte:'SMB'},
  {id:'prosurf',         name:'PROSURF',                                  country:'CL', centry:false, segmento:'Deportes',    porte:'SMB'},
  {id:'belcorp-mex',     name:'BEL STAR S/A - BELCORP Mexico',            country:'MX', centry:false, segmento:'Belleza',     porte:'Enterprise'},
  {id:'belcorp-peru',    name:'BEL STAR S/A - BELCORP Peru',              country:'PE', centry:false, segmento:'Belleza',     porte:'Enterprise'},
  {id:'emma-sleep-co',   name:'EMMA SLEEP - CO',                          country:'CO', centry:false, segmento:'Hogar',       porte:'Mid Market'},
  {id:'forus-peru',      name:'FORUS PERU',                               country:'PE', centry:false, segmento:'Calzado',     porte:'Enterprise'},
  {id:'kayser',          name:'KAYSER',                                   country:'CL', centry:false, segmento:'Moda',        porte:'Enterprise'},
  {id:'lacoste-gen',     name:'LACOSTE',                                  country:'CL', centry:false, segmento:'Moda Premium',porte:'Enterprise'},
  {id:'tramontina-cl',   name:'TRAMONTINA - CL',                          country:'CL', centry:false, segmento:'Hogar',       porte:'Enterprise'},
  {id:'tramontina-mx',   name:'TRAMONTINA - MX',                          country:'MX', centry:false, segmento:'Hogar',       porte:'Enterprise'},
  // ── SAMI nuevos ────────────────────────────────────────────────────────────
  {id:'maletaschile',             name:'MALETASCHILE.COM',                             country:'CL', centry:false},
  {id:'saideep',                  name:'SAIDEEP',                                      country:'CL', centry:false},
  {id:'comercializadora-tc',      name:'COMERCIALIZADORA TODO CLICK',                  country:'CL', centry:false},
  // ── MARÍA nuevos ────────────────────────────────────────────────────────────
  {id:'lenovo-cl-1',              name:'LENOVO CHILE (1)',                              country:'CL', centry:false},
  {id:'lenovo-cl-2',              name:'LENOVO CHILE (2)',                              country:'CL', centry:false},
  {id:'lenovo-cl-3',              name:'LENOVO CHILE (3)',                              country:'CL', centry:false},
  {id:'madesa-col',               name:'MADESA MUEBLES COLOMBIA SAS',                  country:'CO', centry:false},
  {id:'lenovo-ar',                name:'LENOVO ARGENTINA SRL',                         country:'AR', centry:false},
  {id:'natura-ar',                name:'NATURA COSMETICOS - AR',                       country:'AR', centry:false},
  {id:'adidas-cl',                name:'ADIDAS - CL',                                  country:'CL', centry:false},
  {id:'adidas-co',                name:'ADIDAS - CO',                                  country:'CO', centry:false},
  {id:'madesa-pe',                name:'MADESA PERU S.A.C.',                           country:'PE', centry:false},
  {id:'madesa-mx',                name:'MADESA MUEBLES MEXICO',                        country:'MX', centry:false},
  {id:'natura-mx',                name:'NATURA MEXICO',                                country:'MX', centry:false},
  // ── GERMÁN ──────────────────────────────────────────────────────────────────
  {id:'evaplas-ar',               name:'EVAPLAS - AR',                                 country:'AR', centry:false},
  {id:'reply-ar',                 name:'REPLY',                                        country:'AR', centry:false},
  {id:'rigashop',                 name:'RIGASHOP',                                     country:'AR', centry:false},
  {id:'af-solutions-cl',          name:'AF SOLUTIONS - CL',                            country:'CL', centry:false},
  {id:'audiomusica',              name:'AUDIOMUSICA SPA',                              country:'CL', centry:false},
  {id:'ausin-hnos',               name:'AUSIN HNOS',                                   country:'CL', centry:false},
  {id:'gildemeister-cl',          name:'AUTOMOTORES GILDEMEISTER - CL',                country:'CL', centry:false},
  {id:'bona-homes-cl',            name:'BONA HOMES - CL',                              country:'CL', centry:false},
  {id:'bookcomputer',             name:'BOOKCOMPUTER',                                 country:'CL', centry:false},
  {id:'calzados-ambar-cl',        name:'CALZADOS AMBAR - CL',                          country:'CL', centry:false},
  {id:'centec-cl',                name:'CENTEC.CL',                                    country:'CL', centry:false},
  {id:'chantilly',                name:'CHANTILLY',                                    country:'CL', centry:false},
  {id:'cienco-cl',                name:'CIENCO - CL',                                  country:'CL', centry:false},
  {id:'citotools-spa',            name:'CITOTOOLS SPA',                                country:'CL', centry:false},
  {id:'comercial-agustin',        name:'COMERCIAL AGUSTIN SPA - CL',                   country:'CL', centry:false},
  {id:'mikes-chile',              name:'COMERCIAL MIKES CHILE LIMITADA',               country:'CL', centry:false},
  {id:'cubo24',                   name:'CUBO24.COM / TOP BRANDS',                      country:'CL', centry:false},
  {id:'divino-jeans',             name:'DIVINO JEANS',                                 country:'CL', centry:false},
  {id:'dongle-cl',                name:'DONGLE - CL',                                  country:'CL', centry:false},
  {id:'drimkip-cl',               name:'DRIMKIP - CL',                                 country:'CL', centry:false},
  {id:'flex-cl',                  name:'FLEX - CL',                                    country:'CL', centry:false},
  {id:'fullcompra',               name:'FULLCOMPRA',                                   country:'CL', centry:false},
  {id:'garmin-cl',                name:'GARMIN',                                       country:'CL', centry:false},
  {id:'groner-cl',                name:'GRÖNER',                                       country:'CL', centry:false},
  {id:'h2o-cl',                   name:'H2O',                                          country:'CL', centry:false},
  {id:'imahe-cl',                 name:'IMAHE - CL',                                   country:'CL', centry:false},
  {id:'importclick-cl',           name:'IMPORTCLICK - CL',                             country:'CL', centry:false},
  {id:'inkuba',                   name:'INKUBA',                                       country:'CL', centry:false},
  {id:'manizales-spa-cl',         name:'INVERSIONES MANIZALES SPA - CL',               country:'CL', centry:false},
  {id:'kaltemp',                  name:'KALTEMP',                                      country:'CL', centry:false},
  {id:'kannu',                    name:'KANNÚ',                                        country:'CL', centry:false},
  {id:'klik-muebles',             name:'KLIK MUEBLES',                                 country:'CL', centry:false},
  {id:'petrizzio',                name:'LABORATORIO PETRIZZIO LIMITADA',               country:'CL', centry:false},
  {id:'macme',                    name:'MACME',                                        country:'CL', centry:false},
  {id:'mali-cl',                  name:'MALI - CL',                                    country:'CL', centry:false},
  {id:'manufacturas-byp',         name:'MANUFACTURAS ELÉCTRICAS BYP LTDA',             country:'CL', centry:false},
  {id:'mibuy-cl',                 name:'MIBUY.CL',                                     country:'CL', centry:false},
  {id:'mouvair-cl',               name:'MOUVAIR - CL',                                 country:'CL', centry:false},
  {id:'mundo-joven',              name:'MUNDO JOVEN',                                  country:'CL', centry:false},
  {id:'nacional-libreria',        name:'NACIONAL LIBRERÍA',                            country:'CL', centry:false},
  {id:'neumaticos-maule',         name:'NEUMATICOS DE MAULE - CL',                     country:'CL', centry:false},
  {id:'nipon-andino',             name:'NIPON ANDINO - CL',                            country:'CL', centry:false},
  {id:'platanitos-cl',            name:'PLATANITOS - CL',                              country:'CL', centry:false},
  {id:'plaza-musica-cl',          name:'PLAZA MÚSICA - CL',                            country:'CL', centry:false},
  {id:'porto-menaje',             name:'PORTO MENAJE - CL',                            country:'CL', centry:false},
  {id:'primebrands-spa',          name:'PRIMEBRANDS SPA',                              country:'CL', centry:false},
  {id:'rann-store',               name:'RANN STORE - AUKEY',                           country:'CL', centry:false},
  {id:'red-sale',                 name:'RED SALE',                                     country:'CL', centry:false},
  {id:'samia-cl',                 name:'SAMIA',                                        country:'CL', centry:false},
  {id:'seducete-cl',              name:'SEDUCETE - CL',                                country:'CL', centry:false},
  {id:'hitway-music',             name:'SOC. INVERSIONES HITWAY MUSIC SPA',            country:'CL', centry:false},
  {id:'spirax-1',                 name:'SPIRAX (1)',                                   country:'CL', centry:false},
  {id:'spirax-2',                 name:'SPIRAX (2)',                                   country:'CL', centry:false},
  {id:'sporting-brands-cl',       name:'SPORTING BRANDS - CL',                         country:'CL', centry:false},
  {id:'talong-trade-cl',          name:'TALONG TRADE - CL',                            country:'CL', centry:false},
  {id:'todoclick-spa',            name:'TODOCLICK SPA',                                country:'CL', centry:false},
  {id:'tpv-cl',                   name:'TPV - CL',                                     country:'CL', centry:false},
  {id:'trail-cl',                 name:'TRAIL',                                        country:'CL', centry:false},
  {id:'yeppo-cl',                 name:'YEPPO CHILE - CL',                             country:'CL', centry:false},
  {id:'zigzag-cl',                name:'ZIG ZAG - CL',                                 country:'CL', centry:false},
  {id:'juamppe-pe',               name:'JUAMPPE - PE',                                 country:'PE', centry:false},
  {id:'el-tunel',                 name:'EL TÚNEL',                                     country:'UY', centry:false},
  {id:'kasmenko',                 name:'KASMENKO CALANDRA IVAN NICOLAS',               country:'UY', centry:false},
  {id:'prontometal',              name:'PRONTOMETAL S/A',                              country:'UY', centry:false},
  {id:'zonatecno-uy',             name:'ZONATECNO - UY',                               country:'UY', centry:false},
  {id:'moda-scarpa',              name:'COMERCIALIZADORA MODA SCARPA',                 country:'MX', centry:false},
  {id:'derosay-mx',               name:'DEROSAY',                                      country:'MX', centry:false},
  {id:'distribuidora-urqi',       name:'DISTRIBUIDORA URQI (Predize)',                 country:'MX', centry:false},
  {id:'flexi-predize',            name:'FLEXI ECOMMERCE (Predize)',                    country:'MX', centry:false},
  {id:'flexi-ecommerce',          name:'FLEXI ECOMMERCE',                              country:'MX', centry:false},
  {id:'operadora-multiplataformas',name:'OPERADORA DE MULTIPLATAFORMAS (Predize)',     country:'MX', centry:false},
  {id:'punto-granel-mx',          name:'PUNTO GRANEL - MX',                            country:'MX', centry:false},
  {id:'reuse-mexico',             name:'REUSE MEXICO (Predize)',                       country:'MX', centry:false},
  {id:'the-3-letters',            name:'THE 3 LETTERS (Predize)',                      country:'MX', centry:false},
  // ── D&E / Sin asignar ───────────────────────────────────────────────────────
  {id:'union-good-ar',            name:'UNION GOOD - AR',                              country:'AR', centry:false},
  {id:'altagama',                 name:'ALTAGAMA',                                     country:'CL', centry:false},
  {id:'ascarcon-cl',              name:'ASCARCON - CL',                                country:'CL', centry:false},
  {id:'babyboo-cl',               name:'BABYBOO - CL',                                 country:'CL', centry:false},
  {id:'bambulu-cl',               name:'BAMBULU - CL',                                 country:'CL', centry:false},
  {id:'byon-cl',                  name:'BYON - CL',                                    country:'CL', centry:false},
  {id:'calvac-cl',                name:'CALVAC - CL',                                  country:'CL', centry:false},
  {id:'riquelme-cl',              name:'CAROLINA ANDREA RIQUELME V. - CL',             country:'CL', centry:false},
  {id:'chilemat',                 name:'CHILEMAT.COM',                                 country:'CL', centry:false},
  {id:'color-sublime',            name:'COLOR SUBLIME',                                country:'CL', centry:false},
  {id:'colque-audio',             name:'COLQUE AUDIO PRO',                             country:'CL', centry:false},
  {id:'corporacion-jireh',        name:'CORPORACION JIREH SPA',                        country:'CL', centry:false},
  {id:'crece-seguro',             name:'CRECE SEGURO',                                 country:'CL', centry:false},
  {id:'davis-graphics',           name:'DAVIS GRAPHICS',                               country:'CL', centry:false},
  {id:'dinon-cl',                 name:'DINON - CL',                                   country:'CL', centry:false},
  {id:'distrithunder',            name:'DISTRITHUNDER SOLUCIONES SPA',                 country:'CL', centry:false},
  {id:'dtparts-cl',               name:'DTPARTS SPA - LUCAS DIESEL',                   country:'CL', centry:false},
  {id:'enigmatica',               name:'ENIGMATICA BOUTIQUE',                          country:'CL', centry:false},
  {id:'estoy-kuku',               name:'ESTOY KUKU / HANUMAN - CL',                    country:'CL', centry:false},
  {id:'ferdel',                   name:'FERDEL',                                       country:'CL', centry:false},
  {id:'frazadas-andes',           name:'FRAZADAS ANDES - CL',                          country:'CL', centry:false},
  {id:'from-meiggs',              name:'FROM MEIGGS - CL',                             country:'CL', centry:false},
  {id:'guven',                    name:'GUVEN',                                        country:'CL', centry:false},
  {id:'igpro-cl',                 name:'IGPRO - CL',                                   country:'CL', centry:false},
  {id:'imporchile',               name:'IMPORCHILE - CL',                              country:'CL', centry:false},
  {id:'inversiones-rosales',      name:'INVERSIONES LOS ROSALES SA',                   country:'CL', centry:false},
  {id:'jaguar-music',             name:'JAGUAR MUSIC',                                 country:'CL', centry:false},
  {id:'japan-market',             name:'JAPAN MARKET - CL',                            country:'CL', centry:false},
  {id:'kairos-medical',           name:'KAIROS MEDICAL',                               country:'CL', centry:false},
  {id:'emproquim',                name:'LABORATORIO EMPROQUIM SPA',                    country:'CL', centry:false},
  {id:'lamparas-bosco',           name:'LAMPARAS BOSCO - CL',                          country:'CL', centry:false},
  {id:'laser-cl',                 name:'LASER - CL',                                   country:'CL', centry:false},
  {id:'makita-cl',                name:'MAKITA ONLINE - CL',                           country:'CL', centry:false},
  {id:'mercado-jardin',           name:'MERCADO JARDIN',                               country:'CL', centry:false},
  {id:'mymarca',                  name:'MYMARCA',                                      country:'CL', centry:false},
  {id:'next-sa-cl',               name:'NEXT S.A',                                     country:'CL', centry:false},
  {id:'oh-mi-hogar',              name:'OH MI HOGAR - CL',                             country:'CL', centry:false},
  {id:'pacific-resources',        name:'PACIFIC RESOURCES',                            country:'CL', centry:false},
  {id:'peluqueria-online',        name:'PELUQUERIAONLINE',                             country:'CL', centry:false},
  {id:'polyphonik-cl',            name:'POLYPHONIK - CL',                              country:'CL', centry:false},
  {id:'skinautica',               name:'SKINAUTICA',                                   country:'CL', centry:false},
  {id:'sobrelamesa',              name:'SOBRELAMESA',                                  country:'CL', centry:false},
  {id:'tech-market-cl',           name:'TECH MARKET - CL',                             country:'CL', centry:false},
  {id:'techbox',                  name:'TECHBOX',                                      country:'CL', centry:false},
  {id:'toyblock',                 name:'TOYBLOCK',                                     country:'CL', centry:false},
  {id:'tyk-hogar-cl',             name:'TYK HOGAR - CL',                               country:'CL', centry:false},
  {id:'unique-cl',                name:'UNIQUE - CL',                                  country:'CL', centry:false},
  {id:'vandine',                  name:'VANDINE',                                      country:'CL', centry:false},
  {id:'artezcom-co',              name:'ARTEZCOM - CO',                                country:'CO', centry:false},
  {id:'carlex-uy',                name:'CARLEX S/A',                                   country:'UY', centry:false},
  {id:'dot-uy',                   name:'DOT - UY',                                     country:'UY', centry:false},
  {id:'interactivos-uy',          name:'INTERACTIVOS SA',                              country:'UY', centry:false},
  {id:'iplace-uy',                name:'IPLACE - UY',                                  country:'UY', centry:false},
  {id:'mecanus',                  name:'MECANUS S/A',                                  country:'UY', centry:false},
  {id:'adolfo-franco',            name:'ADOLFO FRANCO TOVAR',                          country:'MX', centry:false},
  {id:'derma-plastic',            name:'DERMA PLASTIC',                                country:'MX', centry:false},
  {id:'kapama',                   name:'KAPAMA',                                       country:'MX', centry:false},
  {id:'ngarden-mx',               name:'NGARDEN MEXICO',                               country:'MX', centry:false},
  {id:'vh-textiles',              name:'VH TEXTILES SAS DE CV',                        country:'MX', centry:false},
];
export const SEED_VERSION = '2026-07-13b';
const ISOLATION_VERSION = '2026-06-25b'; // bump to force CSM store cleanup
(function isolationCleanup() {
  const key = 'cs-isolation-v';
  if (localStorage.getItem(key) === ISOLATION_VERSION) return; // already ran
  // Clear all CSM action stores to eliminate stale cross-user data
  ['maria','german','clientes-de','sami'].forEach(id => {
    localStorage.removeItem('cs-v3-actions-' + id);
  });
  localStorage.setItem(key, ISOLATION_VERSION);
})();
const SEED = [
  {nombre:"FASHIONS PARK",                               tickets:0, bugs:0, ticketsPendientes:0, ticketDetalle:null, causaRaiz:null,                                                                                                                                                                                                                               gmv:12918685400,  upPlan:null, qtUp:null, nps:null,   lastContact:"2026-07-07", centry:false},
  {nombre:"COBOE S/A - BOTIGA",                          tickets:0, bugs:0, ticketsPendientes:0, ticketDetalle:null,                                                                                                                                   causaRaiz:null,                                                                                                                                                                    gmv:247659908,    upPlan:null, qtUp:null, nps:100,   lastContact:"2026-07-11", centry:false},
  {nombre:"COBOE S/A - FARMASHOP",                       tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:811908825,    upPlan:null, qtUp:null, nps:100,    lastContact:"2026-07-13", centry:false},
  {nombre:"D&F FARMA",                                   tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:null,         upPlan:null, qtUp:null, nps:null,   lastContact:null,         centry:false},
  {nombre:"DIVINO S.A",                                  tickets:1, bugs:1, ticketsPendientes:1, ticketDetalle:"#35652 - Sincronizaciones (abierto 10-jul, URGENTE)", causaRaiz:"Falla en sincronización de datos marcada como urgente",                                                                                                                                                               gmv:778623000,    upPlan:null, qtUp:null, nps:null,   lastContact:"2026-07-11", centry:false},
  {nombre:"DTODOYMAS",                                   tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:null,         upPlan:null, qtUp:null, nps:null,   lastContact:null,         centry:false},
  {nombre:"FORUS COLOMBIA",                              tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:null,         upPlan:null, qtUp:null, nps:null,   lastContact:"2026-07-07", centry:true},
  {nombre:"FORUS SA",                                    tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:null,         upPlan:null, qtUp:null, nps:null,      lastContact:"2026-07-10", centry:true},
  {nombre:"GINO",                                        tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:null,         upPlan:null, qtUp:null, nps:null,   lastContact:"2026-07-13", centry:true},
  {nombre:"INVERSIONES MALAGA",                          tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:5146764473,   upPlan:null, qtUp:null, nps:null,   lastContact:"2026-06-26", centry:false},
  {nombre:"LOI CHILE",                                   tickets:1, bugs:0, ticketsPendientes:1, ticketDetalle:"#35835 - Creacción de Monitores Paris MKP (abierto 10-jul)", causaRaiz:"Configuración de monitor de ventas pendiente para marketplace Paris",                                                                                                                                                               gmv:18226158700,  upPlan:null, qtUp:null, nps:100,   lastContact:"2026-07-11", centry:false},
  {nombre:"LOUNGE S/A",                                  tickets:0, bugs:0, ticketsPendientes:0, ticketDetalle:null,                                                                                                                                   causaRaiz:null,                                                                                                       gmv:null,         upPlan:null, qtUp:null, nps:null,   lastContact:"2026-07-13", centry:true},
  {nombre:"MAISA",                                       tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:null,         upPlan:null, qtUp:null, nps:null,   lastContact:"2026-06-26", centry:true},
  {nombre:"MAUI AND SONS",                               tickets:1, bugs:0, ticketsPendientes:0, ticketDetalle:"#32882 - Carga documentos tributarios sellers (abierto 30-jun)", causaRaiz:"Documentos tributarios de sellers pendientes de carga en plataforma", gmv:74659220800,  upPlan:null, qtUp:null, nps:null,   lastContact:"2026-07-13", centry:false},
  {nombre:"BEITGROUP S.A. (PILLIN)",                     tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:null,         upPlan:null, qtUp:null, nps:null,   lastContact:"2026-06-26", centry:false},
  {nombre:"POINTBREAK",                                  tickets:0, bugs:0, ticketsPendientes:0, ticketDetalle:null,                                                                                                                                   causaRaiz:null,                                                                                                       gmv:null,         upPlan:null, qtUp:null, nps:null,   lastContact:"2026-07-13", centry:false},
  {nombre:"BEL STAR S/A - BELCORP Colombia",             tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:16375786500,  upPlan:null, qtUp:null, nps:0,     lastContact:"2026-06-26", centry:false},
  {nombre:"COLOMBIANA DE COMERCIO S/A",                  tickets:0, bugs:0, ticketsPendientes:0, ticketDetalle:null,                                                                                                                                          causaRaiz:null,                                                                                                       gmv:null,         upPlan:null, qtUp:null, nps:null,   lastContact:"2026-07-12", centry:false},
  {nombre:"EMMA SLEEP - CL",                             tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:97742205200,  upPlan:null, qtUp:null, nps:null,   lastContact:"2026-07-04", centry:false},
  {nombre:"LACOSTE - CL",                                tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:14416074900,  upPlan:36,   qtUp:10,   nps:null,   lastContact:"2026-06-24", centry:false},
  {nombre:"PROMOTORA DE BELLEZA S/A - BELCORP Chile",    tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:7374581000,   upPlan:36,   qtUp:3,    nps:null,   lastContact:"2026-06-26", centry:false},
  {nombre:"TRANSBEL S.A. DE C.V. - BELCORP Mexico",      tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:478865027,    upPlan:null, qtUp:null, nps:null,   lastContact:"2026-06-26", centry:false},
  {nombre:"WHIRLPOOL",                                   tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:null,         upPlan:null, qtUp:null, nps:null,   lastContact:"2026-06-09", centry:false},
  {nombre:"BEITGROUP PE",                                tickets:1, bugs:1, ticketsPendientes:1, ticketDetalle:"#35312 - Productos no publican en Falabella y no cargan fotos (abierto 08-jul)", causaRaiz:"Error técnico en publicación de productos e imágenes en Falabella Perú",                                                                                                                                                               gmv:1711666,      upPlan:null, qtUp:null, nps:null,   lastContact:"2026-07-11", centry:false},
  {nombre:"RIP CURL",                                    tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:null,         upPlan:null, qtUp:null, nps:null,   lastContact:"2026-07-13", centry:false},
  {nombre:"UPDOWN JUEGOS",                               tickets:0, bugs:0, ticketsPendientes:0, ticketDetalle:null,                                                                                                                                   causaRaiz:null,                                                                                                                                                                    gmv:null,         upPlan:null, qtUp:null, nps:null,   lastContact:"2026-06-23", centry:false},
  {nombre:"PROSURF",                                     tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:11063256000,  upPlan:null, qtUp:null, nps:null,   lastContact:"2026-07-10", centry:false},
  {nombre:"BEL STAR S/A - BELCORP Mexico",               tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:478865027,    upPlan:null, qtUp:null, nps:null,   lastContact:"2026-06-26", centry:false},
  {nombre:"BEL STAR S/A - BELCORP Peru",                 tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:1736582,      upPlan:null, qtUp:null, nps:null,   lastContact:"2026-07-04", centry:false},
  {nombre:"EMMA SLEEP - CO",                             tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:41441886400,  upPlan:null, qtUp:null, nps:null,   lastContact:"2026-07-04", centry:false},
  {nombre:"FORUS PERU",                                  tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:null,         upPlan:null, qtUp:null, nps:null,   lastContact:"2026-07-07", centry:false},
  {nombre:"KAYSER",                                      tickets:0, bugs:0, ticketsPendientes:0, ticketDetalle:null, causaRaiz:null,                                                                                                                                                                                                                               gmv:11408661300,  upPlan:null, qtUp:null, nps:null,   lastContact:"2026-07-13", centry:false},
  {nombre:"LACOSTE",                                     tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:14416074900,  upPlan:null, qtUp:null, nps:null,   lastContact:"2026-06-26", centry:false},
  {nombre:"TRAMONTINA - CL",                             tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:28378500,     upPlan:null, qtUp:null, nps:null,   lastContact:"2026-06-26", centry:false},
  {nombre:"TRAMONTINA - MX",                             tickets:0, bugs:0, ticketsPendientes:0,                                                                                                                                                               gmv:64928426,     upPlan:null, qtUp:null, nps:null,   lastContact:"2026-06-26", centry:false},

  // ── Sami nuevos ──────────────────────────────────────────────────────────
  {nombre:"LENOVO CHILE (1)", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"LENOVO CHILE (2)", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"LENOVO CHILE (3)", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"MADESA MUEBLES COLOMBIA SAS", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"MALETASCHILE.COM", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"SAIDEEP", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"COMERCIALIZADORA TODO CLICK", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  // ── María nuevos ─────────────────────────────────────────────────────────
  {nombre:"LENOVO ARGENTINA SRL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"NATURA COSMETICOS - AR", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"ADIDAS - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"ADIDAS - CO", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"MADESA PERU S.A.C.", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"MADESA MUEBLES MEXICO", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"NATURA MEXICO", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  // ── Germán ───────────────────────────────────────────────────────────────
  {nombre:"EVAPLAS - AR", tickets:null, bugs:null, ticketsPendientes:null, gmv:18185819, upPlan:34, qtUp:12, nps:100, lastContact:"2026-06-26", centry:false},
  {nombre:"REPLY", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"RIGASHOP", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:36, qtUp:16, nps:null, lastContact:null, centry:false},
  {nombre:"AF SOLUTIONS - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:29299872, upPlan:36, qtUp:7, nps:null, lastContact:null, centry:false},
  {nombre:"AUDIOMUSICA SPA", tickets:null, bugs:null, ticketsPendientes:null, gmv:164046755, upPlan:34, qtUp:17, nps:null, lastContact:null, centry:false},
  {nombre:"AUSIN HNOS", tickets:null, bugs:null, ticketsPendientes:null, gmv:374808157, upPlan:36, qtUp:11, nps:null, lastContact:null, centry:false},
  {nombre:"AUTOMOTORES GILDEMEISTER - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"BONA HOMES - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"BOOKCOMPUTER", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"CALZADOS AMBAR - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:2456915, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"CENTEC.CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:66525671, upPlan:34, qtUp:15, nps:null, lastContact:null, centry:false},
  {nombre:"CHANTILLY", tickets:null, bugs:null, ticketsPendientes:null, gmv:55153451, upPlan:34, qtUp:13, nps:null, lastContact:null, centry:false},
  {nombre:"CIENCO - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"CITOTOOLS SPA", tickets:1, bugs:null, ticketsPendientes:1, gmv:87953159, upPlan:36, qtUp:10, nps:null, lastContact:null, centry:false},
  {nombre:"COMERCIAL AGUSTIN SPA - CL", tickets:1, bugs:0, ticketsPendientes:1, ticketDetalle:"#31640 - No puedo vincular con publicación ML (esperando respuesta cliente desde 24-jun — 7 días sin reply)", causaRaiz:"Vinculación ML — #32221 y #32211 resueltos. #31640 pendiente respuesta cliente (info solicitada 24-jun, sin reply)", gmv:55050, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"COMERCIAL MIKES CHILE LIMITADA", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"CUBO24.COM / TOP BRANDS", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"DIVINO JEANS", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"DONGLE - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"DRIMKIP - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"FLEX - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:23920905, upPlan:36, qtUp:12, nps:null, lastContact:null, centry:false},
  {nombre:"FULLCOMPRA", tickets:null, bugs:null, ticketsPendientes:null, gmv:50144868, upPlan:34, qtUp:15, nps:null, lastContact:null, centry:false},
  {nombre:"GARMIN", tickets:null, bugs:null, ticketsPendientes:null, gmv:57326634, upPlan:21, qtUp:14, nps:null, lastContact:null, centry:false},
  {nombre:"GRÖNER", tickets:2, bugs:0, ticketsPendientes:1, ticketDetalle:"#34077 - Solicitud de reunión capacitación SKUs (03-jul) | #33200 - Revisión integración y sincronización SKUs (30-jun)", causaRaiz:null, gmv:60228461, upPlan:34, qtUp:14, nps:-100, lastContact:null, centry:false},
  {nombre:"H2O", tickets:null, bugs:null, ticketsPendientes:null, gmv:16927675, upPlan:34, qtUp:16, nps:null, lastContact:null, centry:false},
  {nombre:"IMAHE - CL", tickets:1, bugs:null, ticketsPendientes:1, gmv:125363348, upPlan:36, qtUp:17, nps:null, lastContact:null, centry:false},
  {nombre:"IMPORTCLICK - CL", tickets:1, bugs:0, ticketsPendientes:1, ticketDetalle:"#33860 - VENTAS NO PROCESADAS (02-jul)", causaRaiz:null, gmv:2132067, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"INKUBA", tickets:null, bugs:null, ticketsPendientes:null, gmv:20583067, upPlan:34, qtUp:8, nps:null, lastContact:null, centry:false},
  {nombre:"INVERSIONES MANIZALES SPA - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:33174461, upPlan:34, qtUp:12, nps:null, lastContact:null, centry:false},
  {nombre:"KALTEMP", tickets:null, bugs:null, ticketsPendientes:null, gmv:181715927, upPlan:34, qtUp:7, nps:null, lastContact:null, centry:false},
  {nombre:"KANNÚ", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"KLIK MUEBLES", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"LABORATORIO PETRIZZIO LIMITADA", tickets:null, bugs:null, ticketsPendientes:null, gmv:74835595, upPlan:36, qtUp:11, nps:null, lastContact:null, centry:false},
  {nombre:"MACME", tickets:null, bugs:null, ticketsPendientes:null, gmv:68017066, upPlan:36, qtUp:12, nps:null, lastContact:null, centry:false},
  {nombre:"MALI - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:31383615, upPlan:36, qtUp:9, nps:null, lastContact:null, centry:false},
  {nombre:"MANUFACTURAS ELÉCTRICAS BYP LTDA", tickets:1, bugs:0, ticketsPendientes:1, ticketDetalle:"#30386 - Contacto soporte (1-jun)", causaRaiz:"Ticket de contacto general sin resolución — 26 días abierto", gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"MIBUY.CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"MOUVAIR - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:291082461, upPlan:36, qtUp:12, nps:null, lastContact:null, centry:false},
  {nombre:"MUNDO JOVEN", tickets:1, bugs:0, ticketsPendientes:1, ticketDetalle:"#33861 - Caso atributos automatizados (02-jul) — continuación de #31638 (24-jun)", causaRaiz:"Problema recurrente con configuración de atributos automatizados", gmv:30385720, upPlan:36, qtUp:10, nps:null, lastContact:null, centry:false},
  {nombre:"NACIONAL LIBRERÍA", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"NEUMATICOS DE MAULE - CL", tickets:2, bugs:0, ticketsPendientes:2, ticketDetalle:"#34182 - Conversa com Aleixmar Murat (03-jul) | #18014 - Configuración Bsale (abierto desde 04-may — 60 días)", causaRaiz:"Error configuración Bsale sin resolución en 60+ días — ticket urgente no gestionado", gmv:253085429, upPlan:34, qtUp:10, nps:null, lastContact:null, centry:false},
  {nombre:"NIPON ANDINO - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:495825654, upPlan:34, qtUp:17, nps:null, lastContact:null, centry:false},
  {nombre:"PLATANITOS - CL", tickets:1, bugs:0, ticketsPendientes:1, ticketDetalle:"#26293 - Error de transmisión carteras Falabella (abierto desde 03-jun — 30 días)", causaRaiz:null, gmv:9792419, upPlan:36, qtUp:14, nps:null, lastContact:null, centry:false},
  {nombre:"PLAZA MÚSICA - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"PORTO MENAJE - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"PRIMEBRANDS SPA", tickets:null, bugs:null, ticketsPendientes:null, gmv:6673813, upPlan:34, qtUp:9, nps:null, lastContact:null, centry:false},
  {nombre:"RANN STORE - AUKEY", tickets:null, bugs:null, ticketsPendientes:null, gmv:95113941, upPlan:34, qtUp:15, nps:null, lastContact:null, centry:false},
  {nombre:"RED SALE", tickets:1, bugs:null, ticketsPendientes:1, gmv:53632061, upPlan:36, qtUp:17, nps:null, lastContact:null, centry:false},
  {nombre:"SAMIA", tickets:null, bugs:null, ticketsPendientes:null, gmv:41882403, upPlan:34, qtUp:12, nps:null, lastContact:null, centry:false},
  {nombre:"SEDUCETE - CL", tickets:1, bugs:0, ticketsPendientes:1, ticketDetalle:"#20662 - Pedidos no traspasados (abierto desde 13-may — 51 días)", causaRaiz:"Pedidos no se traspasan al sistema — issue crítico sin resolución en 51+ días", gmv:16716155, upPlan:36, qtUp:9, nps:null, lastContact:null, centry:false},
  {nombre:"SOC. INVERSIONES HITWAY MUSIC SPA", tickets:null, bugs:null, ticketsPendientes:null, gmv:31157049, upPlan:36, qtUp:17, nps:null, lastContact:null, centry:false},
  {nombre:"SPIRAX (1)", tickets:null, bugs:null, ticketsPendientes:null, gmv:24586640, upPlan:34, qtUp:15, nps:null, lastContact:null, centry:false},
  {nombre:"SPIRAX (2)", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:34, qtUp:15, nps:null, lastContact:null, centry:false},
  {nombre:"SPORTING BRANDS - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:26332637, upPlan:34, qtUp:9, nps:null, lastContact:null, centry:false},
  {nombre:"TALONG TRADE - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"TODOCLICK SPA", tickets:null, bugs:null, ticketsPendientes:null, gmv:87161430, upPlan:34, qtUp:17, nps:null, lastContact:null, centry:false},
  {nombre:"TPV - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:362436753, upPlan:36, qtUp:18, nps:-100, lastContact:"2026-07-01", centry:false},
  {nombre:"TRAIL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"YEPPO CHILE - CL", tickets:1, bugs:0, ticketsPendientes:1, ticketDetalle:"#17220 - 'otra vez problemas' — sentimiento muy negativo (abierto desde 29-abr — 65 días)", causaRaiz:"Problema recurrente con sentimiento muy negativo — 65+ días sin cierre — alto riesgo de churn", gmv:49524723, upPlan:36, qtUp:8, nps:null, lastContact:null, centry:false},
  {nombre:"ZIG ZAG - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"JUAMPPE - PE", tickets:null, bugs:null, ticketsPendientes:null, gmv:10323971, upPlan:36, qtUp:9, nps:-100, lastContact:"2026-07-01", centry:false},
  {nombre:"EL TÚNEL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"KASMENKO CALANDRA IVAN NICOLAS", tickets:1, bugs:0, ticketsPendientes:1, ticketDetalle:"#32339 - Integración no funciona (26-jun)", causaRaiz:"Integración sin funcionar — reporte reciente sin resolución", gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"PRONTOMETAL S/A", tickets:null, bugs:null, ticketsPendientes:null, gmv:176973176, upPlan:34, qtUp:9, nps:null, lastContact:null, centry:false},
  {nombre:"ZONATECNO - UY", tickets:null, bugs:null, ticketsPendientes:null, gmv:112746258, upPlan:34, qtUp:9, nps:null, lastContact:null, centry:false},
  {nombre:"COMERCIALIZADORA MODA SCARPA", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"DEROSAY", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:36, qtUp:10, nps:null, lastContact:null, centry:false},
  {nombre:"DISTRIBUIDORA URQI (Predize)", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"FLEXI ECOMMERCE (Predize)", tickets:null, bugs:null, ticketsPendientes:null, gmv:274810104, upPlan:34, qtUp:9, nps:null, lastContact:null, centry:false},
  {nombre:"FLEXI ECOMMERCE", tickets:null, bugs:null, ticketsPendientes:null, gmv:274810104, upPlan:34, qtUp:9, nps:null, lastContact:null, centry:false},
  {nombre:"OPERADORA DE MULTIPLATAFORMAS (Predize)", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"PUNTO GRANEL - MX", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"REUSE MEXICO (Predize)", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"THE 3 LETTERS (Predize)", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  // ── D&E / Sin asignar ────────────────────────────────────────────────────
  {nombre:"UNION GOOD - AR", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"ALTAGAMA", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"ASCARCON - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"BABYBOO - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"BAMBULU - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"BYON - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"CALVAC - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"CAROLINA ANDREA RIQUELME V. - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"CHILEMAT.COM", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"COLOR SUBLIME", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"COLQUE AUDIO PRO", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"CORPORACION JIREH SPA", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"CRECE SEGURO", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"DAVIS GRAPHICS", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"DINON - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"DISTRITHUNDER SOLUCIONES SPA", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"DTPARTS SPA - LUCAS DIESEL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"ENIGMATICA BOUTIQUE", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"ESTOY KUKU / HANUMAN - CL", tickets:1, bugs:0, ticketsPendientes:1, ticketDetalle:"#25822 - Integración Walmart no funciona (13-may)", causaRaiz:"Integración con Walmart sin funcionar — 44 días sin resolución", gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"FERDEL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"FRAZADAS ANDES - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"FROM MEIGGS - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"GUVEN", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"IGPRO - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"IMPORCHILE - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"INVERSIONES LOS ROSALES SA", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"JAGUAR MUSIC", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"JAPAN MARKET - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"KAIROS MEDICAL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"LABORATORIO EMPROQUIM SPA", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"LAMPARAS BOSCO - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"LASER - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"MAKITA ONLINE - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"MERCADO JARDIN", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"MYMARCA", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"NEXT S.A", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"OH MI HOGAR - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"PACIFIC RESOURCES", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"PELUQUERIAONLINE", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"POLYPHONIK - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"SKINAUTICA", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"SOBRELAMESA", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"TECH MARKET - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"TECHBOX", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"TOYBLOCK", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"TYK HOGAR - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"UNIQUE - CL", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"VANDINE", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"ARTEZCOM - CO", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"CARLEX S/A", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"DOT - UY", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"INTERACTIVOS SA", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"IPLACE - UY", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"MECANUS S/A", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"ADOLFO FRANCO TOVAR", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"DERMA PLASTIC", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"KAPAMA", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"NGARDEN MEXICO", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},
  {nombre:"VH TEXTILES SAS DE CV", tickets:null, bugs:null, ticketsPendientes:null, gmv:null, upPlan:null, qtUp:null, nps:null, lastContact:null, centry:false},

];
// Títulos de acciones seed eliminadas — se limpian de localStorage automáticamente
export const REMOVED_SEED_TITLES = new Set([
  'Seguimiento migración CENTRY — BEITGROUP S.A.',
  'Seguimiento migración CENTRY — MAISA',
  'Seguimiento migración CENTRY — FORUS COLOMBIA',
  'Seguimiento migración CENTRY — FORUS SA',
  'Seguimiento migración CENTRY — GINO',
  'CENTRY MAISA — Reunión para definir fechas de migración',
  'CENTRY MAISA — Definir alcance técnico',
  'CENTRY MAISA — Planificación Go Live',
  'CENTRY FORUS Colombia — Reunión para definir fechas de migración',
  'CENTRY FORUS Colombia — Definir alcance técnico',
  'CENTRY FORUS Colombia — Planificación Go Live',
  'CENTRY FORUS SA — Reunión para definir fechas de migración',
  'CENTRY FORUS SA — Definir alcance técnico',
  'CENTRY FORUS SA — Planificación Go Live',
  'CENTRY GINO — Reunión para definir fechas de migración',
  'CENTRY GINO — Definir alcance técnico',
  'CENTRY GINO — Planificación Go Live',
]);

// Marketplaces recopilados desde AnyMarket (2026-06-18)
// Solo se aplican si el key no existe en localStorage (no sobreescribe ediciones manuales)
const SEED_MARKETPLACES = {
  'fashions-park':   'Mercado Libre, Paris, Ripley, Walmart',
  'coboe-botiga':    'Mercado Libre',
  'coboe-farmashop': 'Mercado Libre',
  // df-farma: cuenta brasilera, no pertenece a la cartera de Sami
  'divino':          'E-commerce, Mercado Libre',
  'malaga':          'Falabella, Hites, Mercado Libre, Paris, Prestashop, Ripley, Walmart',
  'kayser':          'Falabella, Hites, Mercado Libre, Paris, Ripley, Walmart',
  'lacoste':         'Falabella, GFG - Dafiti, Mercado Libre, Paris, Ripley',
  'loi-chile':       'Falabella, Hites, Mercado Libre, Paris, Ripley, Walmart',
  'maui':            'Falabella, Mercado Libre, Paris, Ripley',
  'prosurf':         'Falabella, Mercado Libre, Paris, Ripley',
  'rip-curl':        'Falabella, Mercado Libre, Paris, Ripley',
  'tramontina-cl':   'Paris, Walmart',
  'tramontina-mx':   'Amazon, Coppel, E-commerce, Mercado Libre, Walmart',
  'belcorp-chile':   'Mercado Libre',
  'belcorp-col':     'Mercado Libre',
  'emma-sleep':      'E-commerce, Falabella, Mercado Libre, Paris, Ripley, Walmart',
  'emma-sleep-co':   'E-commerce, Falabella, Mercado Libre',
  'belcorp-mex':     'Mercado Libre',
  'belcorp-peru':    'Mercado Libre, VTEX',
  'beitgroup-pe':    'Falabella, Mercado Libre, Ripley',
  // maisa: cliente Centry, sin datos en AnyMarket
};

export const LS_DATA          = 'cs-v3-data';
export const LS_DELETED_SEEDS = 'cs-v3-deleted-seeds';
let clients = [];
let _appLoaded = false; // guard contra double-load

// ── LOAD ───────────────────────────────────────────────────────────────────────
function load() {
  if (_appLoaded) return; // evitar double-load
  _appLoaded = true;
  // Siempre arranca desde SEED — garantiza datos en cualquier dispositivo o hosting
  clients = fromSeed();
  setUpdateLabel(SEED_VERSION);
  // Si hay datos más nuevos en localStorage, los aplica encima del SEED
  try {
    const sd = localStorage.getItem(LS_DATA);
    if (sd) {
      const p = JSON.parse(sd);
      if (p.clients) {
        // Campos del usuario (persisten siempre, aunque SEED sea más nuevo)
        const USER_FIELDS = ['lastContact','notes','mood','marketplaces','lifecycle'];
        // Campos operativos (vienen del SEED cuando hay nuevo deploy)
        const isSeedNewer = !p.seedVersion || SEED_VERSION > p.seedVersion;
        clients = clients.map(c => {
          const saved = p.clients.find(x => x.id === c.id);
          if (saved && saved.weekly && Object.keys(saved.weekly).length > 0) {
            const delta = Object.fromEntries(Object.entries(saved.weekly).filter(([k,v]) => {
              if (v === null || v === undefined) return false;
              // Si el SEED es más nuevo, solo preservar campos del usuario
              if (isSeedNewer && !USER_FIELDS.includes(k)) return false;
              return true;
            }));
            return {...c, weekly: {...c.weekly, ...delta}};
          }
          return c;
        });
        setUpdateLabel(p.updatedAt || SEED_VERSION);
      }
    }
  } catch(e) {}
  // ── Clientes no-PORT (cartera de otros CSMs como German) ──
  // Agrega clientes del localStorage que no existen en PORT pero pertenecen al usuario activo
  try {
    const _sdExtra = localStorage.getItem(LS_DATA);
    if (_sdExtra) {
      const _pExtra = JSON.parse(_sdExtra);
      if (_pExtra.clients) {
        const _existingIds = new Set(clients.map(c => c.id));
        const _activeUserExtra = getActiveUser();
        if (_activeUserExtra && _activeUserExtra.clientIds) {
          const _extraClients = _pExtra.clients.filter(c =>
            !_existingIds.has(c.id) &&
            _activeUserExtra.clientIds.includes(c.id)
          );
          clients = [...clients, ..._extraClients];
        }
      }
    }
  } catch(e) {}
  // Acciones
  const _activeUserForLoad = getActiveUser();
  const _actionsKeyForLoad = _activeUserForLoad ? getActionsKey(_activeUserForLoad.id) : (typeof LS_ACTIONS !== 'undefined' ? LS_ACTIONS : 'cs-v3-actions');
  // Migrate legacy sami actions on first load
  if (_activeUserForLoad && _activeUserForLoad.id === 'sami') {
    const _legacyKey = typeof LS_ACTIONS !== 'undefined' ? LS_ACTIONS : 'cs-v3-actions';
    const _legacyActions = localStorage.getItem(_legacyKey);
    if (_legacyActions && !localStorage.getItem(_actionsKeyForLoad)) {
      localStorage.setItem(_actionsKeyForLoad, _legacyActions);
    }
  }
  if (_activeUserForLoad && ['director','superadmin','viewer'].includes(_activeUserForLoad.role)) {
    // Superadmin/Director/Viewer: merge ALL CSMs' actions
    const _allActions = []; const _seenIds = new Set();
    loadUsers().filter(u => ['csm','superadmin'].includes(u.role)).forEach(u => {
      const _k = getActionsKey(u.id);
      const _stored = localStorage.getItem(_k);
      if (_stored) { try { JSON.parse(_stored).forEach(a => { if (!_seenIds.has(a.id)) { _seenIds.add(a.id); _allActions.push(a); } }); } catch(e) {} }
    });
    // Also load from global seed if no CSM data yet
    if (_allActions.length === 0) { setActions(seedActions()); } else { setActions(_allActions); }
  } else {
    const sa = localStorage.getItem(_actionsKeyForLoad);
    if (sa) { try { setActions(JSON.parse(sa)); } catch(e) { setActions(seedActions()); } }
    else { setActions(seedActions()); }
    mergeSeedActions();
    // STRICT isolation: strip any leaked actions that don't belong to this CSM's clients
    if (_activeUserForLoad) {
      const _ownIds = new Set(_activeUserForLoad.clientIds);
      setActions(getActions().filter(a => _ownIds.has(a.clientId)));
    }
  }
  mergeSeedMarketplaces();
  // Filter clients based on active user
  const _visibleIds = getVisibleClientIds();
  clients = clients.filter(c => {
    const port = PORT.find(p => norm(p.name) === norm(c.name));
    return !port || _visibleIds.includes(port.id);
  });
  loadNotes();
  populateSelects();
}
export { load };
export function refreshClients() { load(); return clients; }
export function resetLoadGuard() { _appLoaded = false; }
export function getClients() { return clients; }
export function setClients(newArr) { clients = newArr; }

export function fromSeed() {
  return PORT.map(p => { const w = SEED.find(s => norm(s.nombre) === norm(p.name)) || {}; return {...p, weekly: {...w}}; });
}
function rebuildClients(saved) {
  return PORT.map(p => { const s = (saved||[]).find(x => x.id === p.id) || {}; return {...p, ...s, weekly: s.weekly||{}}; });
}
function mergeSeedMarketplaces() {
  Object.entries(SEED_MARKETPLACES).forEach(([id, val]) => {
    if (!localStorage.getItem('cs-mkt-' + id)) {
      localStorage.setItem('cs-mkt-' + id, val);
    }
  });
}
export function saveData(dt) {
  const val = JSON.stringify({clients, updatedAt: dt, seedVersion: SEED_VERSION});
  localStorage.setItem(LS_DATA, val);
  pushToSupabase(LS_DATA, val);
  scheduleGistSave();
}
function populateSelects() {
  const visIds = getVisibleClientIds();
  const visPort = PORT.filter(p => visIds.includes(p.id));
  const opts = visPort.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  document.getElementById('filterCliente').innerHTML = '<option value="">🌎 Todos los clientes</option>' + opts;
  document.getElementById('fichaSelect').innerHTML   = '<option value="">— Elegir cliente —</option>' + opts;
}

// ── CANCELACIÓN DE CLIENTES ──────────────────────────────────────────────────────
export function activeClients(){ return clients.filter(c=>!(c.weekly&&c.weekly.cancelado)); }
export function cancelClient(id){
  const c=clients.find(x=>x.id===id); if(!c) return;
  const motivo=prompt('Motivo de cancelación de '+c.name+' (precio, competidor, problema técnico, estratégico, etc.):','');
  if(motivo===null) return; // canceló el prompt, no hace nada
  if(!confirm('¿Confirmas cancelar a '+c.name+'? Se retirará de la cartera activa y quedará en la sección de Cancelados.')) return;
  if(!c.weekly) c.weekly={};
  c.weekly.cancelado=true;
  c.weekly.fechaCancelacion=today();
  c.weekly.motivoCancelacion=motivo||'';
  c.weekly.gmvPerdido=c.weekly.gmv??null;
  saveData(new Date().toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'}));
  renderKPIs();renderTable();
  showToast('Cliente '+c.name+' marcado como cancelado','red');
}
export function reactivarClient(id){
  const c=clients.find(x=>x.id===id); if(!c) return;
  if(!confirm('¿Reactivar a '+c.name+'? Volverá a la cartera activa.')) return;
  if(!c.weekly) c.weekly={};
  c.weekly.cancelado=false;
  c.weekly.fechaCancelacion=null;
  c.weekly.motivoCancelacion=null;
  c.weekly.gmvPerdido=null;
  saveData(new Date().toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'}));
  renderKPIs();renderTable();
  showToast('Cliente '+c.name+' reactivado','green');
}

export function registrarContacto(id, reload) {
  const c = clients.find(x => x.id === id); if (!c) return;
  c.weekly = c.weekly || {};
  c.weekly.lastContact = today();
  saveData(new Date().toLocaleDateString('es-CL', {day:'2-digit',month:'short',year:'numeric'}));
  renderKPIs();
  if (reload) renderFicha();
  else renderTable();
  // mini toast
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:var(--green);color:#fff;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999;animation:sUp .2s ease';
  t.textContent = '✅ Contacto registrado hoy — ' + (c.name.split(' ')[0]);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// exposed for inline HTML handlers
window.cancelClient = cancelClient;
window.reactivarClient = reactivarClient;
window.registrarContacto = registrarContacto;
