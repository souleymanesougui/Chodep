// ============================================================
// CHODEP — Administration : CRUD des formations
// ============================================================
import { requireAuth, initLogout } from "./admin-auth.js";
import { supabase } from "./supabase-config.js";
import { formatDate, escapeHtml, toast } from "./main.js";
import { wireImageField } from "./upload.js";

const modal = document.getElementById("formationModal");
const form = document.getElementById("formationForm");
const tbody = document.getElementById("formationsTable");
let imageField = null;
let currentRows = [];

async function init(){
  const user = await requireAuth();
  if(!user) return;
  initLogout();
  await loadTable();
  document.getElementById("newFormationBtn").addEventListener("click", () => openModal());
  document.getElementById("cancelModalBtn").addEventListener("click", closeModal);
  form.addEventListener("submit", saveFormation);
}

function statusPill(statut){
  const map = { ouvert:["Ouvert","status-open"], complet:["Complet","status-full"], bientot:["Bientôt","status-soon"] };
  const [label, cls] = map[statut] || map.ouvert;
  return `<span class="status-pill ${cls}">${label}</span>`;
}

async function loadTable(){
  try{
    const { data, error } = await supabase.from("formations").select("*").order("date", { ascending:true });
    if(error) throw error;
    currentRows = data || [];
    if(!currentRows.length){ tbody.innerHTML = `<tr><td colspan="7">Aucune formation. Cliquez sur « Nouvelle formation » pour commencer.</td></tr>`; return; }
    tbody.innerHTML = currentRows.map((f) => {
      const inscrits = f.inscrits || 0;
      const restantes = Math.max((f.places||0) - inscrits, 0);
      return `<tr>
        <td>${escapeHtml(f.titre||"")}</td>
        <td>${f.date ? formatDate(f.date) : ""}</td>
        <td>${escapeHtml(f.lieu||"")}</td>
        <td>${restantes} / ${f.places||0} <span style="color:var(--text-faint); font-size:0.8rem;">(${inscrits} inscrit${inscrits>1?"s":""})</span></td>
        <td>${statusPill(f.statut)}</td>
        <td>${f.publie === false ? "Masquée" : "Publiée"}</td>
        <td style="white-space:nowrap;">
          <button class="icon-btn" data-edit="${f.id}" title="Modifier">✏️</button>
          <a class="icon-btn" href="inscriptions.html?formation=${f.id}" title="Voir les inscrits">👥</a>
          <button class="icon-btn" data-delete="${f.id}" title="Supprimer">🗑️</button>
        </td>
      </tr>`;
    }).join("");
    tbody.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => editFormation(b.dataset.edit)));
    tbody.querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", () => removeFormation(b.dataset.delete)));
  }catch(err){
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="7">Impossible de charger les formations. Vérifie la configuration Supabase (js/supabase-config.js).</td></tr>`;
  }
}

function openModal(data, id){
  document.getElementById("modalTitle").textContent = id ? "Modifier la formation" : "Nouvelle formation";
  document.getElementById("fId").value = id || "";
  document.getElementById("fTitre").value = data?.titre || "";
  document.getElementById("fTitreEn").value = data?.titre_en || "";
  document.getElementById("fDescription").value = data?.description || "";
  document.getElementById("fDescriptionEn").value = data?.description_en || "";
  document.getElementById("fObjectifs").value = data?.objectifs || "";
  document.getElementById("fProgramme").value = data?.programme || "";
  document.getElementById("fFormateur").value = data?.formateur || "";
  document.getElementById("fPrix").value = data?.prix || "";
  document.getElementById("fDate").value = data?.date || "";
  document.getElementById("fDuree").value = data?.duree || "";
  document.getElementById("fLieu").value = data?.lieu || "";
  document.getElementById("fPlaces").value = data?.places || "";
  document.getElementById("fStatut").value = data?.statut || "ouvert";
  document.getElementById("fPublie").value = String(data?.publie !== false);
  document.getElementById("fImage").value = data?.image || "";
  document.getElementById("formationError").style.display = "none";
  imageField = wireImageField({
    inputEl: document.getElementById("fImageInput"),
    previewEl: document.getElementById("fImagePreview"),
    folder: "formations",
    currentUrl: data?.image || "",
  });
  modal.classList.add("open");
}
function closeModal(){ modal.classList.remove("open"); form.reset(); }

function editFormation(id){
  const row = currentRows.find(x => x.id === id);
  if(row) openModal(row, id);
}

async function saveFormation(e){
  e.preventDefault();
  const id = document.getElementById("fId").value;
  const saveBtn = document.getElementById("saveFormationBtn");
  saveBtn.disabled = true; saveBtn.textContent = "Enregistrement…";

  let imageUrl = document.getElementById("fImage").value.trim();
  if(imageField?.hasNewFile()){
    try{
      saveBtn.textContent = "Téléversement de l'image…";
      const { url } = await imageField.upload();
      imageUrl = url;
    }catch(err){
      const box = document.getElementById("formationError");
      box.textContent = "Image : " + err.message;
      box.style.display = "block";
      saveBtn.disabled = false; saveBtn.textContent = "Enregistrer";
      return;
    }
  }

  const payload = {
    titre: document.getElementById("fTitre").value.trim(),
    titre_en: document.getElementById("fTitreEn").value.trim(),
    description: document.getElementById("fDescription").value.trim(),
    description_en: document.getElementById("fDescriptionEn").value.trim(),
    objectifs: document.getElementById("fObjectifs").value.trim(),
    programme: document.getElementById("fProgramme").value.trim(),
    formateur: document.getElementById("fFormateur").value.trim(),
    prix: document.getElementById("fPrix").value ? Number(document.getElementById("fPrix").value) : null,
    date: document.getElementById("fDate").value || null,
    duree: document.getElementById("fDuree").value.trim(),
    lieu: document.getElementById("fLieu").value.trim(),
    places: Number(document.getElementById("fPlaces").value),
    statut: document.getElementById("fStatut").value,
    publie: document.getElementById("fPublie").value === "true",
    image: imageUrl,
    updated_at: new Date().toISOString(),
  };

  try{
    if(id){
      const { error } = await supabase.from("formations").update(payload).eq("id", id);
      if(error) throw error;
    }else{
      const { error } = await supabase.from("formations").insert({ ...payload, inscrits: 0 });
      if(error) throw error;
    }
    closeModal();
    toast(id ? "Formation mise à jour." : "Formation créée.");
    await loadTable();
  }catch(err){
    console.error(err);
    const box = document.getElementById("formationError");
    box.textContent = "Enregistrement impossible. Vérifie ta configuration et tes règles Supabase (RLS).";
    box.style.display = "block";
  }finally{
    saveBtn.disabled = false; saveBtn.textContent = "Enregistrer";
  }
}

async function removeFormation(id){
  if(!confirm("Supprimer définitivement cette formation ?")) return;
  try{
    const { error } = await supabase.from("formations").delete().eq("id", id);
    if(error) throw error;
    toast("Formation supprimée.");
    await loadTable();
  }catch(err){
    console.error(err);
    toast("Suppression impossible.", "error");
  }
}

init();
