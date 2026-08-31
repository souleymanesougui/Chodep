// ============================================================
// CHODEP — Tableau de bord administrateur
// ============================================================
import { requireAuth, initLogout } from "./admin-auth.js";
import { supabase } from "./supabase-config.js";
import { formatDate, escapeHtml } from "./main.js";

async function init(){
  const user = await requireAuth();
  if(!user) return;
  document.getElementById("adminUserEmail").textContent = user.email;
  initLogout();

  await Promise.all([loadKpis(), loadRecentInscriptions(), loadRecentMessages()]);
}

async function safeCount(table){
  try{
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    if(error) throw error;
    return count || 0;
  }catch(err){ console.warn(`Lecture "${table}" impossible :`, err.message); return 0; }
}

async function loadKpis(){
  document.getElementById("kpiInscriptions").textContent = await safeCount("inscriptions");
  document.getElementById("kpiFormations").textContent = await safeCount("formations");
  try{
    const { data, error } = await supabase.from("statistiques").select("total").eq("id","visites").single();
    if(error) throw error;
    document.getElementById("kpiVisitors").textContent = data?.total || 0;
  }catch(err){ document.getElementById("kpiVisitors").textContent = "0"; }
  try{
    const { count, error } = await supabase.from("messages").select("*", { count:"exact", head:true }).eq("statut","non-lu");
    if(error) throw error;
    document.getElementById("kpiMessages").textContent = count || 0;
  }catch(err){ document.getElementById("kpiMessages").textContent = "0"; }
}

async function loadRecentInscriptions(){
  const tbody = document.getElementById("recentInscriptions");
  try{
    const { data, error } = await supabase.from("inscriptions").select("*").order("date_inscription",{ ascending:false }).limit(5);
    if(error) throw error;
    if(!data.length){ tbody.innerHTML = `<tr><td colspan="4">Aucune inscription pour le moment.</td></tr>`; return; }
    tbody.innerHTML = data.map(i => {
      return `<tr><td>${escapeHtml(i.prenom||"")} ${escapeHtml(i.nom||"")}</td><td>${escapeHtml(i.formation_titre||"")}</td><td>${i.date_inscription ? formatDate(i.date_inscription) : ""}</td><td><span class="status-pill status-open">${escapeHtml(i.statut||"nouvelle")}</span></td></tr>`;
    }).join("");
  }catch(err){
    console.warn(err.message);
    tbody.innerHTML = `<tr><td colspan="4">Connecte Supabase pour afficher les inscriptions.</td></tr>`;
  }
}

async function loadRecentMessages(){
  const tbody = document.getElementById("recentMessages");
  try{
    const { data, error } = await supabase.from("messages").select("*").order("date_envoi",{ ascending:false }).limit(5);
    if(error) throw error;
    if(!data.length){ tbody.innerHTML = `<tr><td colspan="4">Aucun message pour le moment.</td></tr>`; return; }
    tbody.innerHTML = data.map(m => {
      return `<tr><td>${escapeHtml(m.nom||"")}</td><td>${escapeHtml(m.sujet||"")}</td><td>${m.date_envoi ? formatDate(m.date_envoi) : ""}</td><td><span class="status-pill ${m.statut==='non-lu'?'status-soon':'status-open'}">${escapeHtml(m.statut||"non-lu")}</span></td></tr>`;
    }).join("");
  }catch(err){
    console.warn(err.message);
    tbody.innerHTML = `<tr><td colspan="4">Connecte Supabase pour afficher les messages.</td></tr>`;
  }
}

init();
