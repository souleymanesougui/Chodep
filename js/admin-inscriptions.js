// ============================================================
// CHODEP — Administration : gestion des inscriptions
// ============================================================
import { requireAuth, initLogout } from "./admin-auth.js";
import { supabase } from "./supabase-config.js";
import { formatDate, escapeHtml, toast } from "./main.js";

const STATUSES = ["nouvelle","confirmee","refusee","terminee"];
let all = [];
const formationFilter = new URLSearchParams(location.search).get("formation");

async function init(){
  const user = await requireAuth();
  if(!user) return;
  initLogout();
  await load();
  document.querySelectorAll("#statusFilters button").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll("#statusFilters button").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    render(b.dataset.status);
  }));
}

async function load(){
  const tbody = document.getElementById("inscriptionsTable");
  try{
    let q = supabase.from("inscriptions").select("*").order("date_inscription", { ascending:false });
    if(formationFilter) q = q.eq("formation_id", formationFilter);
    const { data, error } = await q;
    if(error) throw error;
    all = data || [];
    if(formationFilter){
      const h2 = document.querySelector(".admin-topbar h2");
      if(h2) h2.textContent = `Inscriptions — ${all[0]?.formation_titre || "formation sélectionnée"}`;
    }
    render("tous");
  }catch(err){
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="6">Impossible de charger les inscriptions. Vérifie la configuration Supabase.</td></tr>`;
  }
}

function render(filter){
  const tbody = document.getElementById("inscriptionsTable");
  const rows = filter === "tous" ? all : all.filter(i => (i.statut||"nouvelle") === filter);
  if(!rows.length){ tbody.innerHTML = `<tr><td colspan="6">Aucune inscription.</td></tr>`; return; }
  tbody.innerHTML = rows.map(i => `
    <tr>
      <td>${escapeHtml(i.prenom||"")} ${escapeHtml(i.nom||"")}</td>
      <td>${escapeHtml(i.telephone||"")}<br><span style="color:var(--text-faint); font-size:0.82rem;">${escapeHtml(i.email||"")}</span></td>
      <td>${escapeHtml(i.formation_titre||"")}</td>
      <td>${escapeHtml(i.ville||"")}</td>
      <td>${i.date_inscription ? formatDate(i.date_inscription) : ""}</td>
      <td>
        <select data-id="${i.id}" class="statusSelect">
          ${STATUSES.map(s => `<option value="${s}" ${i.statut===s?"selected":""}>${s}</option>`).join("")}
        </select>
      </td>
    </tr>`).join("");
  tbody.querySelectorAll(".statusSelect").forEach(sel => sel.addEventListener("change", () => updateStatus(sel.dataset.id, sel.value)));
}

async function updateStatus(id, statut){
  try{
    const { error } = await supabase.from("inscriptions").update({ statut }).eq("id", id);
    if(error) throw error;
    const item = all.find(i => i.id === id);
    if(item) item.statut = statut;
    toast("Statut mis à jour.");
  }catch(err){
    console.error(err);
    toast("Mise à jour impossible.", "error");
  }
}

init();
