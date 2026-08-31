// ============================================================
// CHODEP — Actualités (liste d'articles + filtres par catégorie)
// ============================================================
import { escapeHtml, formatDate } from "./main.js";
import { supabase } from "./supabase-config.js";

const FALLBACK = [
  { id:"art-1", titre:"Nouvelle formation en leadership", auteur:"Équipe CHODEP", date:"2026-08-10", categorie:"formation", contenu:"CHODEP organise un nouvel atelier de leadership destiné aux jeunes de N'Djaména, avec un focus sur la prise de décision et la communication d'impact." },
  { id:"art-2", titre:"Retour sur notre conférence jeunesse", auteur:"Équipe CHODEP", date:"2026-07-22", categorie:"evenement", contenu:"Plus de 100 participants ont assisté à notre conférence sur l'engagement des jeunes dans le développement communautaire." },
  { id:"art-3", titre:"Une communauté mobilisée à Moundou", auteur:"Équipe CHODEP", date:"2026-06-30", categorie:"communaute", contenu:"Retour sur notre action communautaire menée à Moundou en partenariat avec les autorités locales." },
];

function shareLinks(article){
  const url = encodeURIComponent(location.origin + "/actualites.html#" + article.id);
  const text = encodeURIComponent(article.titre);
  return {
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
  };
}

function cardHTML(a){
  const s = shareLinks(a);
  return `
  <div class="card reveal in">
    <div class="img">${a.image ? `<img src="${a.image}" alt="${escapeHtml(a.titre)}">` : ""}</div>
    <div class="body">
      <span class="tag">${escapeHtml(a.categorie)}</span>
      <h3>${escapeHtml(a.titre)}</h3>
      <p class="body-text" style="font-size:0.92rem;">${escapeHtml(a.contenu).slice(0,110)}…</p>
      <div class="meta">
        <span>✍️ ${escapeHtml(a.auteur)}</span>
        <span>📅 ${a.date ? formatDate(a.date) : ""}</span>
      </div>
      <div style="display:flex; gap:8px; margin-top:12px;">
        <a href="${s.whatsapp}" target="_blank" rel="noopener" class="icon-btn" title="Partager sur WhatsApp">W</a>
        <a href="${s.facebook}" target="_blank" rel="noopener" class="icon-btn" title="Partager sur Facebook">F</a>
      </div>
    </div>
  </div>`;
}

async function fetchArticles(){
  try{
    const { data, error } = await supabase.from("articles").select("*").eq("publie", true).order("date", { ascending:false });
    if(error) throw error;
    if(!data || !data.length) throw new Error("empty");
    return data;
  }catch(err){
    console.warn("Supabase indisponible ou vide, articles de démonstration affichés.", err.message);
    return FALLBACK;
  }
}

async function init(){
  const grid = document.getElementById("articlesGrid");
  if(!grid) return;
  const all = await fetchArticles();
  let activeCat = "tous";

  function render(){
    const filtered = activeCat === "tous" ? all : all.filter(a => a.categorie === activeCat);
    grid.innerHTML = filtered.length ? filtered.map(cardHTML).join("") : `<p class="body-text">Aucun article dans cette catégorie.</p>`;
  }
  document.querySelectorAll("#categoryFilters button").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll("#categoryFilters button").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    activeCat = b.dataset.cat;
    render();
  }));
  render();
}

init();
