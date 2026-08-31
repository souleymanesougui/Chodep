// ============================================================
// CHODEP — Administration : gestion des messages de contact
// ============================================================
import { requireAuth, initLogout } from "./admin-auth.js";
import { supabase } from "./supabase-config.js";
import { formatDate, escapeHtml, toast } from "./main.js";

const STATUSES = ["non-lu","lu","traite"];

async function init(){
  const user = await requireAuth();
  if(!user) return;
  initLogout();
  await load();
}

async function load(){
  const tbody = document.getElementById("messagesTable");
  try{
    const { data, error } = await supabase.from("messages").select("*").order("date_envoi", { ascending:false });
    if(error) throw error;
    if(!data.length){ tbody.innerHTML = `<tr><td colspan="6">Aucun message.</td></tr>`; return; }
    tbody.innerHTML = data.map(m => {
      return `<tr>
        <td>${escapeHtml(m.nom||"")}</td>
        <td>${escapeHtml(m.telephone||"")}<br><span style="color:var(--text-faint); font-size:0.82rem;">${escapeHtml(m.email||"")}</span></td>
        <td>${escapeHtml(m.sujet||"")}</td>
        <td style="max-width:260px;">${escapeHtml((m.message||"").slice(0,80))}${(m.message||"").length>80?"…":""}</td>
        <td>${m.date_envoi ? formatDate(m.date_envoi) : ""}</td>
        <td>
          <select data-id="${m.id}" class="statusSelect">
            ${STATUSES.map(s => `<option value="${s}" ${(m.statut||"non-lu")===s?"selected":""}>${s}</option>`).join("")}
          </select>
        </td>
      </tr>`;
    }).join("");
    tbody.querySelectorAll(".statusSelect").forEach(sel => sel.addEventListener("change", () => updateStatus(sel.dataset.id, sel.value)));
  }catch(err){
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="6">Impossible de charger les messages. Vérifie la configuration Supabase.</td></tr>`;
  }
}

async function updateStatus(id, statut){
  try{
    const { error } = await supabase.from("messages").update({ statut }).eq("id", id);
    if(error) throw error;
    toast("Statut mis à jour.");
  }catch(err){
    console.error(err);
    toast("Mise à jour impossible.", "error");
  }
}

init();
