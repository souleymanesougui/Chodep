// ============================================================
// CHODEP — Administration : CRUD des événements
// ============================================================
import { requireAuth, initLogout } from "./admin-auth.js";
import { supabase } from "./supabase-config.js";
import { formatDate, escapeHtml, toast } from "./main.js";
import { wireImageField } from "./upload.js";

const modal = document.getElementById("modal");
const form = document.getElementById("itemForm");
const tbody = document.getElementById("table");
let imageField = null;
let currentRows = [];

async function init(){
  const user = await requireAuth();
  if(!user) return;
  initLogout();
  await load();
  document.getElementById("newBtn").addEventListener("click", () => open());
  document.getElementById("cancelBtn").addEventListener("click", close);
  form.addEventListener("submit", save);
}

async function load(){
  try{
    const { data, error } = await supabase.from("evenements").select("*").order("date", { ascending:true });
    if(error) throw error;
    currentRows = data || [];
    if(!currentRows.length){ tbody.innerHTML = `<tr><td colspan="6">Aucun événement. Cliquez sur « Nouvel événement » pour commencer.</td></tr>`; return; }
    tbody.innerHTML = currentRows.map(e => {
      return `<tr>
        <td>${escapeHtml(e.titre||"")}</td>
        <td>${e.date ? formatDate(e.date) : ""}</td>
        <td>${escapeHtml(e.lieu||"")}</td>
        <td>${e.participants||0}</td>
        <td>${e.publie === false ? "Masqué" : "Publié"}</td>
        <td style="white-space:nowrap;">
          <button class="icon-btn" data-edit="${e.id}" title="Modifier">✏️</button>
          <button class="icon-btn" data-delete="${e.id}" title="Supprimer">🗑️</button>
        </td>
      </tr>`;
    }).join("");
    tbody.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => editItem(b.dataset.edit)));
    tbody.querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", () => remove(b.dataset.delete)));
  }catch(err){
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="6">Impossible de charger les événements. Vérifie la configuration Supabase.</td></tr>`;
  }
}

function open(data, id){
  document.getElementById("modalTitle").textContent = id ? "Modifier l'événement" : "Nouvel événement";
  document.getElementById("fId").value = id || "";
  document.getElementById("fTitre").value = data?.titre || "";
  document.getElementById("fDescription").value = data?.description || "";
  document.getElementById("fDate").value = data?.date || "";
  document.getElementById("fHeure").value = data?.heure || "";
  document.getElementById("fLieu").value = data?.lieu || "";
  document.getElementById("fOrganisateur").value = data?.organisateur || "CHODEP";
  document.getElementById("fParticipants").value = data?.participants || "";
  document.getElementById("fPublie").value = String(data?.publie !== false);
  document.getElementById("formError").style.display = "none";
  imageField = wireImageField({
    inputEl: document.getElementById("fImageInput"),
    previewEl: document.getElementById("fImagePreview"),
    folder: "evenements",
    currentUrl: data?.image || "",
  });
  modal.dataset.currentImage = data?.image || "";
  modal.classList.add("open");
}
function close(){ modal.classList.remove("open"); form.reset(); }

function editItem(id){
  const row = currentRows.find(x => x.id === id);
  if(row) open(row, id);
}

async function save(e){
  e.preventDefault();
  const id = document.getElementById("fId").value;
  const btn = document.getElementById("saveBtn");
  btn.disabled = true; btn.textContent = "Enregistrement…";

  let imageUrl = modal.dataset.currentImage || "";
  if(imageField?.hasNewFile()){
    try{
      btn.textContent = "Téléversement de l'image…";
      const { url } = await imageField.upload();
      imageUrl = url;
    }catch(err){
      const box = document.getElementById("formError");
      box.textContent = "Image : " + err.message;
      box.style.display = "block";
      btn.disabled = false; btn.textContent = "Enregistrer";
      return;
    }
  }

  const payload = {
    titre: document.getElementById("fTitre").value.trim(),
    description: document.getElementById("fDescription").value.trim(),
    date: document.getElementById("fDate").value || null,
    heure: document.getElementById("fHeure").value,
    lieu: document.getElementById("fLieu").value.trim(),
    organisateur: document.getElementById("fOrganisateur").value.trim(),
    participants: Number(document.getElementById("fParticipants").value || 0),
    publie: document.getElementById("fPublie").value === "true",
    image: imageUrl,
    updated_at: new Date().toISOString(),
  };

  try{
    if(id){
      const { error } = await supabase.from("evenements").update(payload).eq("id", id);
      if(error) throw error;
    }else{
      const { error } = await supabase.from("evenements").insert(payload);
      if(error) throw error;
    }
    close();
    toast(id ? "Événement mis à jour." : "Événement créé.");
    await load();
  }catch(err){
    console.error(err);
    const box = document.getElementById("formError");
    box.textContent = "Enregistrement impossible. Vérifie tes règles Supabase (RLS).";
    box.style.display = "block";
  }finally{
    btn.disabled = false; btn.textContent = "Enregistrer";
  }
}

async function remove(id){
  if(!confirm("Supprimer définitivement cet événement ?")) return;
  try{
    const { error } = await supabase.from("evenements").delete().eq("id", id);
    if(error) throw error;
    toast("Événement supprimé.");
    await load();
  }catch(err){ toast("Suppression impossible.", "error"); }
}

init();
