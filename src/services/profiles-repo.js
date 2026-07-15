import { PORT } from './clients-repo.js';
import { renderEquipo } from '../ui/director.js';

export const SEED_USERS = [
  {
    id: 'sami',
    name: 'Samiramis Monterola',
    initials: '★',
    icon: '⭐',
    color: '#4f8ef7',
    team: 'LATAM CS',
    role: 'superadmin',
    clientIds: [
      'fashions-park','coboe-botiga','coboe-farmashop','df-farma','divino',
      'dtodoymas','forus-colombia','forus-sa','gino','malaga','loi-chile',
      'lounge','maisa','maui','pillin','pointbreak','belcorp-col','colombiana',
      'emma-sleep','lacoste','lacoste-gen','belcorp-chile','transbel',
      'beitgroup-pe','rip-curl','updown-juegos','prosurf','belcorp-mex',
      'belcorp-peru','emma-sleep-co','forus-peru','kayser',
      'whirlpool','tramontina-cl','tramontina-mx',
      // nuevos Sami
      'maletaschile','saideep','comercializadora-tc'
    ]
  },
  {
    id: 'maria',
    name: 'Maria Laura Senosiain',
    initials: 'ML',
    icon: '🌸',
    color: '#e91e8c',
    team: 'LATAM CS',
    role: 'csm',
    clientIds: [
      'lenovo-cl-1','lenovo-cl-2','lenovo-cl-3',
      'lenovo-ar','natura-ar','adidas-cl','adidas-co',
      'madesa-col','madesa-pe','madesa-mx','natura-mx'
    ]
  },
  {
    id: 'german',
    name: 'German Rojas',
    initials: 'GR',
    icon: '⚡',
    color: '#f39c12',
    team: 'LATAM CS',
    role: 'csm',
    clientIds: [
      'evaplas-ar','reply-ar','rigashop',
      'af-solutions-cl','audiomusica','ausin-hnos','gildemeister-cl','bona-homes-cl',
      'bookcomputer','calzados-ambar-cl','centec-cl','chantilly','cienco-cl',
      'citotools-spa','comercial-agustin','mikes-chile','cubo24','divino-jeans',
      'dongle-cl','drimkip-cl','flex-cl','fullcompra','garmin-cl','groner-cl',
      'h2o-cl','imahe-cl','importclick-cl','inkuba','manizales-spa-cl','kaltemp',
      'kannu','klik-muebles','petrizzio','macme','mali-cl','manufacturas-byp',
      'mibuy-cl','mouvair-cl','mundo-joven','nacional-libreria','neumaticos-maule',
      'nipon-andino','platanitos-cl','plaza-musica-cl','porto-menaje','primebrands-spa',
      'rann-store','red-sale','samia-cl','seducete-cl','hitway-music','spirax-1',
      'spirax-2','sporting-brands-cl','talong-trade-cl','todoclick-spa','tpv-cl',
      'trail-cl','yeppo-cl','zigzag-cl',
      'juamppe-pe',
      'el-tunel','kasmenko','prontometal','zonatecno-uy',
      'moda-scarpa','derosay-mx','distribuidora-urqi','flexi-predize','flexi-ecommerce',
      'operadora-multiplataformas','punto-granel-mx','reuse-mexico','the-3-letters'
    ]
  },
  {
    id: 'clientes-de',
    name: 'Clientes D&E',
    initials: 'DE',
    icon: '📦',
    color: '#7f8c8d',
    team: 'LATAM CS',
    role: 'csm',
    clientIds: [
      'union-good-ar','altagama','ascarcon-cl','babyboo-cl','bambulu-cl','byon-cl',
      'calvac-cl','riquelme-cl','chilemat','color-sublime','colque-audio',
      'corporacion-jireh','crece-seguro','davis-graphics','dinon-cl','distrithunder',
      'dtparts-cl','enigmatica','estoy-kuku','ferdel','frazadas-andes','from-meiggs',
      'guven','igpro-cl','imporchile','inversiones-rosales','jaguar-music',
      'japan-market','kairos-medical','emproquim','lamparas-bosco','laser-cl',
      'makita-cl','mercado-jardin','mymarca','next-sa-cl','oh-mi-hogar',
      'pacific-resources','peluqueria-online','polyphonik-cl','skinautica',
      'sobrelamesa','tech-market-cl','techbox','toyblock','tyk-hogar-cl',
      'unique-cl','vandine',
      'artezcom-co',
      'carlex-uy','dot-uy','interactivos-uy','iplace-uy','mecanus',
      'adolfo-franco','derma-plastic','kapama','ngarden-mx','vh-textiles'
    ]
  },
  {
    id: 'director',
    name: 'Rodolfo',
    initials: 'RO',
    icon: '🎯',
    color: '#e74c3c',
    team: 'LATAM CS',
    role: 'director',
    clientIds: []
  },
  {
    id: 'marcio',
    name: 'Marcio',
    initials: 'MA',
    icon: '👑',
    color: '#9b59b6',
    team: 'LATAM CS',
    role: 'director',
    clientIds: []
  }
];

// ── USERS ──────────────────────────────────────────────────────────────────
export const LS_USERS = 'cs-v3-users';
export const LS_ACTIVE_USER = 'cs-v3-active-user';

export function loadUsers() {
  const saved = JSON.parse(localStorage.getItem(LS_USERS) || 'null');
  if (!saved || saved.length === 0) {
    localStorage.setItem(LS_USERS, JSON.stringify(SEED_USERS));
    return SEED_USERS;
  }
  // Purge users that no longer exist in SEED_USERS (prevents stale duplicates)
  const seedIds = new Set(SEED_USERS.map(u => u.id));
  const before = saved.length;
  const pruned = saved.filter(u => seedIds.has(u.id));
  if (pruned.length !== before) {
    localStorage.setItem(LS_USERS, JSON.stringify(pruned));
    return loadUsers(); // re-run with clean list
  }
  // Sync all managed fields from SEED_USERS (visual + clientIds + role)
  let changed = false;
  const MANAGED = ['initials','color','name','team','role','clientIds'];
  SEED_USERS.forEach(seed => {
    const existing = saved.find(u => u.id === seed.id);
    if (!existing) {
      saved.push(seed); changed = true;
    } else {
      MANAGED.forEach(f => {
        const differs = f === 'clientIds'
          ? JSON.stringify(existing[f]) !== JSON.stringify(seed[f])
          : existing[f] !== seed[f];
        if (differs) { existing[f] = seed[f]; changed = true; }
      });
    }
  });
  if (changed) localStorage.setItem(LS_USERS, JSON.stringify(saved));
  return saved;
}

export function saveUsers(users) {
  localStorage.setItem(LS_USERS, JSON.stringify(users));
}

export function getActiveUser() {
  const users = loadUsers();
  const activeId = localStorage.getItem(LS_ACTIVE_USER);
  return users.find(u => u.id === activeId) || null;
}

export function setActiveUser(userId) {
  localStorage.setItem(LS_ACTIVE_USER, userId);
}

export function getVisibleClientIds() {
  const user = getActiveUser();
  if (!user) return PORT.map(p => p.id);
  // director y viewer → ven todo; superadmin y csm → solo sus clientIds
  if (['director','viewer'].includes(user.role)) return PORT.map(p => p.id);
  return user.clientIds;
}

export function canEdit() {
  const u = getActiveUser();
  if (!u) return false;
  return u.role !== 'viewer'; // solo viewer es read-only
}

export function isReadOnly() { return !canEdit(); }

// Helper: dado un clientId, retorna el CSM dueño
export function getClientOwnerUser(clientId) {
  return loadUsers().find(u => u.role === 'csm' && u.clientIds.includes(clientId)) || null;
}

export function applyReadOnlyMode() {
  const ro = isReadOnly();
  document.body.classList.toggle('readonly-mode', ro);
  let badge = document.getElementById('readonly-badge');
  if (ro) {
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'readonly-badge';
      badge.className = 'readonly-badge';
      badge.textContent = '👑 Modo Vista · Solo lectura';
      document.body.appendChild(badge);
    }
  } else {
    if (badge) badge.remove();
  }
}

export function getCsmFilter() {
  const user = getActiveUser();
  if (!user || !['superadmin','director','viewer'].includes(user.role)) return null;
  return localStorage.getItem('cs-v3-csm-filter') || 'all';
}

export function setCsmFilter(val) {
  localStorage.setItem('cs-v3-csm-filter', val);
  if (typeof renderTable === 'function') renderTable();
}

export let _editingUserId = null;

export function addUser() {
  _editingUserId = null;
  document.getElementById('user-form-title').textContent = 'Nuevo CSM';
  document.getElementById('uf-name').value = '';
  document.getElementById('uf-team').value = 'LATAM CS';
  document.getElementById('uf-role').value = 'csm';
  document.querySelectorAll('.uf-client-cb').forEach(cb => cb.checked = false);
  document.getElementById('user-form-panel').style.display = 'block';
}

export function editUser(userId) {
  const users = loadUsers();
  const u = users.find(x => x.id === userId);
  if (!u) return;
  _editingUserId = userId;
  document.getElementById('user-form-title').textContent = 'Editar ' + u.name;
  document.getElementById('uf-name').value = u.name;
  document.getElementById('uf-team').value = u.team;
  document.getElementById('uf-role').value = u.role;
  document.getElementById('uf-color').value = u.color;
  document.querySelectorAll('.uf-client-cb').forEach(cb => {
    cb.checked = u.clientIds.includes(cb.value);
  });
  document.getElementById('user-form-panel').style.display = 'block';
}

export function deleteUser(userId) {
  if (!confirm('¿Eliminar este CSM?')) return;
  let users = loadUsers();
  users = users.filter(u => u.id !== userId);
  saveUsers(users);
  renderEquipo();
}

export function closeUserForm() {
  document.getElementById('user-form-panel').style.display = 'none';
}

export function saveUserForm() {
  const name = document.getElementById('uf-name').value.trim();
  if (!name) { alert('Nombre requerido'); return; }
  const team = document.getElementById('uf-team').value.trim() || 'LATAM CS';
  const role = document.getElementById('uf-role').value;
  const color = document.getElementById('uf-color').value;
  const clientIds = [...document.querySelectorAll('.uf-client-cb:checked')].map(cb => cb.value);
  const initials = name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
  const id = _editingUserId || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  let users = loadUsers();
  const obj = { id, name, initials, color, team, role, clientIds };
  if (_editingUserId) {
    const idx = users.findIndex(u => u.id === _editingUserId);
    if (idx >= 0) users[idx] = obj;
  } else {
    users.push(obj);
  }
  saveUsers(users);
  closeUserForm();
  renderEquipo();
}

// exposed for inline HTML handlers
window.setCsmFilter = setCsmFilter;
window.addUser = addUser;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.saveUserForm = saveUserForm;
window.closeUserForm = closeUserForm;
