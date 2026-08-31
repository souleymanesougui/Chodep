// ============================================================
// CHODEP — Administration : CRUD des membres de l'équipe
// ============================================================
import { requireAuth, initLogout } from "./admin-auth.js";
import { supabase } from "./supabase-config.js";
import { escapeHtml, toast } from "./main.js";
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
    const { data, error } = await supabase.from("equipe").select("*").order("ordre", { ascending:true });
    if(error) throw error;
    currentRows = data || [];
    if(!currentRows.length){ tbody.innerHTML = `<tr><td colspan="6">Aucun membre. Cliquez sur « Nouveau membre » pour commencer.</td></tr>`; return; }
    tbody.innerHTML = currentRows.map(m => {
      return `<tr>
        <td>${m.image ? `<img src="${m.image}" style="height:36px; width:36px; border-radius:50%; object-fit:cover;">` : "—"}</td>
        <td>${escapeHtml(m.nom||"")}</td>
        <td>${escapeHtml(m.fonction||"")}</td>
        <td>${m.ordre ?? 0}</td>
        <td>${m.publie === false ? "Masqué" : "Affiché"}</td>
        <td style="white-space:nowrap;">
          <button class="icon-btn" data-edit="${m.id}" title="Modifier">✏️</button>
          <button class="icon-btn" data-delete="${m.id}" title="Supprimer">🗑️</button>
        </td>
      </tr>`;
    }).join("");
    tbody.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => editItem(b.dataset.edit)));
    tbody.querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", () => remove(b.dataset.delete)));
  }catch(err){
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="6">Impossible de charger l'équipe. Vérifie la configuration Supabase.</td></tr>`;
  }
}

function open(data, id){
  document.getElementById("modalTitle").textContent = id ? "Modifier le membre" : "Nouveau membre";
  document.getElementById("fId").value = id || "";
  document.getElementById("fNom").value = data?.nom || "";
  document.getElementById("fFonction").value = data?.fonction || "";
  document.getElementById("fPresentation").value = data?.presentation || "";
  document.getElementById("fOrdre").value = data?.ordre ?? 0;
  document.getElementById("fPublie").value = String(data?.publie !== false);
  document.getElementById("formError").style.display = "none";
  imageField = wireImageField({
    inputEl: document.getElementById("fImageInput"),
    previewEl: document.getElementById("fImagePreview"),
    folder: "equipe",
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
      btn.textContent = "Téléversement de la photo…";
      const { url } = await imageField.upload();
      imageUrl = url;
    }catch(err){
      const box = document.getElementById("formError");
      box.textContent = "Photo : " + err.message;
      box.style.display = "block";
      btn.disabled = false; btn.textContent = "Enregistrer";
      return;
    }
  }

  const payload = {
    nom: document.getElementById("fNom").value.trim(),
    fonction: document.getElementById("fFonction").value.trim(),
    presentation: document.getElementById("fPresentation").value.trim(),
    ordre: Number(document.getElementById("fOrdre").value || 0),
    publie: document.getElementById("fPublie").value === "true",
    image: imageUrl,
    updated_at: new Date().toISOString(),
  };

  try{
    if(id){
      const { error } = await supabase.from("equipe").update(payload).eq("id", id);
      if(error) throw error;
    }else{
      const { error } = await supabase.from("equipe").insert(payload);
      if(error) throw error;
    }
    close();
    toast(id ? "Membre mis à jour." : "Membre ajouté.");
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
  if(!confirm("Supprimer définitivement ce membre ?")) return;
  try{
    const { error } = await supabase.from("equipe").delete().eq("id", id);
    if(error) throw error;
    toast("Membre supprimé.");
    await load();
  }catch(err){ toast("Suppression impossible.", "error"); }
}

init();
