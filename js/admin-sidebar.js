// ============================================================
// CHODEP — Barre latérale admin partagée (injectée dans #sidebar)
// Centralise le menu pour éviter de dupliquer le HTML sur chaque page.
// ============================================================
const LINKS = [
  { href:"dashboard.html",     icon:"📊", label:"Tableau de bord" },
  { href:"formations.html",    icon:"🎓", label:"Formations" },
  { href:"inscriptions.html",  icon:"📝", label:"Inscriptions" },
  { href:"evenements.html",    icon:"📅", label:"Événements" },
  { href:"actualites.html",    icon:"📰", label:"Actualités" },
  { href:"galerie.html",       icon:"📸", label:"Galerie" },
  { href:"partenaires.html",   icon:"🤝", label:"Partenaires" },
  { href:"equipe.html",        icon:"👥", label:"Équipe" },
  { href:"messages.html",      icon:"✉️", label:"Messages" },
  { href:"parametres.html",    icon:"⚙️", label:"Paramètres" },
];

function render(){
  const el = document.getElementById("sidebar");
  if(!el) return;
  const current = location.pathname.split("/").pop();
  el.innerHTML = `
    <a href="../index.html" class="brand" style="color:#F1EFE8; margin-bottom:30px;"><span class="mark">CH</span> CHODEP</a>
    ${LINKS.map(l => `<a href="${l.href}" class="${l.href===current ? 'active' : ''}">${l.icon} ${l.label}</a>`).join("")}
    <a href="#" data-logout style="margin-top:24px; border-top:1px solid rgba(241,239,232,0.12); padding-top:18px; display:block;">🚪 Déconnexion</a>
  `;
}
render();
