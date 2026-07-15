import { getActiveUser } from '../services/profiles-repo.js';
// ASSUMPTION: fromSeed is exported from clients-repo.js (it is the seed-loading function that
// owns `clients`/`_appLoaded` state there) — not explicitly listed in this agent's import map,
// confirmed plausible by clients-repo.js's sibling export `resetLoadGuard` (seen in
// services/auth.js, already written by another agent).
import { fromSeed } from '../services/clients-repo.js';
import { calcHS } from '../domain/health-score.js';

function updateUserBadge() {
  const user = getActiveUser();
  if (!user) return;
  const avatar = document.getElementById('user-avatar');
  const nameLabel = document.getElementById('user-name-label');
  if (avatar) {
    avatar.style.background = user.color + '22';
    avatar.style.border = '2px solid ' + user.color;
    avatar.style.color = user.color;
    avatar.textContent = user.initials;
  }
  if (nameLabel) nameLabel.textContent = user.name.split(' ')[0];
  // Show Director nav for superadmin, director, viewer
  const dirNav = document.getElementById('nav-director');
  if (dirNav) {
    const showDir = ['superadmin','director','viewer'].includes(user.role);
    dirNav.style.display = showDir ? 'flex' : 'none';
    if (showDir) {
      // count at-risk across all clients loaded
      const allClients2 = fromSeed();
      const riskCnt = allClients2.filter(c => { const h = calcHS(c); return h.cl==='red'||h.cl==='orange'; }).length;
      const nb = document.getElementById('nb-director');
      if (nb) { nb.textContent = riskCnt; nb.style.display = riskCnt > 0 ? '' : 'none'; }
    }
  }
}

// NOTE (reconciliation flag): `logoutUser()` was also in this agent's assigned scope per the
// task prompt, but `src/services/auth.js` (already written by another agent) already exports
// a complete, mechanically-equivalent `logoutUser()` — it imports `updateUserBadge` FROM THIS
// FILE (`../ui/auth-screen.js`), confirming this file's placement/export name is correct, and
// implements the source's `_appLoaded=false; clients=[]; actions=[]; showProfilePicker();` body
// via `resetLoadGuard(); setClients([]); setActions([]); showProfilePicker();` — an exact match
// for the mechanical translation this file would have produced. Deliberately NOT duplicating it
// here to avoid a duplicate `window.logoutUser` assignment / conflicting export. If integration
// prefers it live here instead, move services/auth.js's version verbatim.

export { updateUserBadge };

// exposed for inline HTML handlers
window.updateUserBadge = updateUserBadge;
