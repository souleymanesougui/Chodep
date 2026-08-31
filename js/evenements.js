// ============================================================
// CHODEP — Événements (accueil + page evenements.html)
// ============================================================
import { escapeHtml, formatDate } from "./main.js";
import { supabase } from "./supabase-config.js";

const FALLBACK = [
  { id:"evt-1", titre:"Conférence : Jeunesse et leadership", description:"Une soirée d'échanges avec des leaders communautaires.", date:"2026-09-05", heure:"17:00", lieu:"Centre culturel, N'Djaména", organisateur:"CHODEP", participants:80 },
  { id:"evt-2", titre:"Atelier découverte entrepreneuriat", description:"Un après-midi pour explorer l'entrepreneuriat local.", date:"2026-09-20", heure:"09:00", lieu:"Siège CHODEP", organisateur:"CHODEP", participants:40 },
  { id:"evt-3", titre:"Cérémonie de remise de certificats", description:"Célébration des participants de la session en cours.", date:"2026-10-02", heure:"16:00", lieu:"Centre culturel, N'Djaména", organisateur:"CHODEP", participants:150 },
];

function cardHTML(e){
  return `
  <a href="evenements.html" class="card reveal in">
    <div class="img">${e.image ? `<img src="${e.image}" alt="${escapeHtml(e.titre)}">` : ""}</div>
    <div class="body">
      <span class="tag">Événement</span>
      <h3>${escapeHtml(e.titre)}</h3>
      <p class="body-text" style="font-size:0.92rem;">${escapeHtml(e.description || "")}</p>
      <div class="meta">
        <span>📅 ${e.date ? formatDate(e.date) : ""} — ${escapeHtml(e.heure||"")}</span>
        <span>📍 ${escapeHtml(e.lieu || "")}</span>
      </div>
    </div>
  </a>`;
}

async function fetchEvents(max){
  try{
    let q = supabase.from("evenements").select("*").eq("publie", true).order("date", { ascending:true });
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
  const grid = document.getElementById("homeEventsGrid");
  if(!grid) return;
  const items = await fetchEvents(3);
  grid.innerHTML = items.map(cardHTML).join("");
}

async function initListPage(){
  const grid = document.getElementById("eventsGrid");
  if(!grid) return;
  const items = await fetchEvents();
  grid.innerHTML = items.length ? items.map(cardHTML).join("") : `<p class="body-text">Aucun événement à venir pour le moment.</p>`;
}

initHomeGrid();
initListPage();
