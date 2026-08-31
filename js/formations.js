// ============================================================
// CHODEP — Formations (liste dynamique, accueil + page formations.html)
// Lit la table Supabase "formations". Si Supabase n'est pas encore
// configuré (voir js/supabase-config.js), un jeu de données de
// démonstration est utilisé pour que le site reste présentable.
// ============================================================
import { escapeHtml, formatDate } from "./main.js";
import { localizedField } from "./content-i18n.js";
import { supabase } from "./supabase-config.js";

const FALLBACK = [
  { id:"demo-1", titre:"Leadership et prise de parole en public", description:"Développer une posture de leader et gagner en aisance à l'oral.", image:"", date:"2026-09-14", duree:"3 jours", lieu:"N'Djaména", places:25, inscrits:18, statut:"ouvert" },
  { id:"demo-2", titre:"Initiation à l'entrepreneuriat", description:"Passer d'une idée à un projet structuré, étape par étape.", image:"", date:"2026-09-28", duree:"5 jours", lieu:"N'Djaména", places:30, inscrits:30, statut:"complet" },
  { id:"demo-3", titre:"Communication et gestion de conflits", description:"Mieux communiquer en équipe et désamorcer les tensions.", image:"", date:"2026-10-10", duree:"2 jours", lieu:"N'Djaména", places:20, inscrits:6, statut:"ouvert" },
  { id:"demo-4", titre:"Gestion de projet associatif", description:"Piloter un projet communautaire de A à Z.", image:"", date:"2026-10-22", duree:"4 jours", lieu:"Moundou", places:22, inscrits:4, statut:"bientot" },
];

function statusMeta(f){
  const map = {
    ouvert:  { label:"Places disponibles", cls:"status-open" },
    complet: { label:"Complet", cls:"status-full" },
    bientot: { label:"Bientôt", cls:"status-soon" },
  };
  return map[f.statut] || map.ouvert;
}

function cardHTML(f){
  const s = statusMeta(f);
  const titre = localizedField(f, "titre");
  const description = localizedField(f, "description");
  return `
  <a href="formation-detail.html?id=${encodeURIComponent(f.id)}" class="card reveal in">
    <div class="img">${f.image ? `<img src="${f.image}" alt="${escapeHtml(titre)}">` : ""}</div>
    <div class="body">
      <span class="tag">Formation</span>
      <h3>${escapeHtml(titre)}</h3>
      <p class="body-text" style="font-size:0.92rem;">${escapeHtml(description).slice(0,90)}${description.length>90?"…":""}</p>
      <div class="meta">
        <span>📅 ${f.date ? formatDate(f.date) : ""}</span>
        <span>📍 ${escapeHtml(f.lieu || "")}</span>
      </div>
      <span class="status-pill ${s.cls}" style="align-self:flex-start;">${s.label}</span>
    </div>
  </a>`;
}

async function fetchFormations(max){
  try{
    let q = supabase.from("formations").select("*").eq("publie", true).order("date", { ascending:true });
    if(max) q = q.limit(max);
    const { data, error } = await q;
    if(error) throw error;
    if(!data || !data.length) throw new Error("empty");
    return data;
  }catch(err){
    console.warn("Supabase indisponible ou vide, affichage des données de démonstration.", err.message);
    return max ? FALLBACK.slice(0,max) : FALLBACK;
  }
}

async function initHomeGrid(){
  const grid = document.getElementById("homeFormationsGrid");
  if(!grid) return;
  const items = await fetchFormations(3);
  grid.innerHTML = items.map(cardHTML).join("");
  window.addEventListener("chodep-lang-changed", () => { grid.innerHTML = items.map(cardHTML).join(""); });
}

async function initListPage(){
  const grid = document.getElementById("formationsGrid");
  if(!grid) return;
  const all = await fetchFormations();
  const search = document.getElementById("formationSearch");
  const filterBtns = document.querySelectorAll("[data-filter-status]");
  let activeFilter = "tous";

  function render(){
    const term = (search?.value || "").toLowerCase();
    const filtered = all.filter(f => {
      const titre = localizedField(f, "titre");
      const matchTerm = !term || titre.toLowerCase().includes(term) || (f.lieu||"").toLowerCase().includes(term);
      const matchStatus = activeFilter === "tous" || f.statut === activeFilter;
      return matchTerm && matchStatus;
    });
    grid.innerHTML = filtered.length ? filtered.map(cardHTML).join("") :
      `<p class="body-text" style="grid-column:1/-1;">Aucune formation ne correspond à votre recherche.</p>`;
  }
  search?.addEventListener("input", render);
  filterBtns.forEach(b => b.addEventListener("click", () => {
    filterBtns.forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    activeFilter = b.dataset.filterStatus;
    render();
  }));
  window.addEventListener("chodep-lang-changed", render);
  render();
}

initHomeGrid();
initListPage();
export { fetchFormations, FALLBACK };
