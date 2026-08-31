// ============================================================
// CHODEP — Administration : CRUD des partenaires
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
    const { data, error } = await supabase.from("partenaires").select("*").order("nom", { ascending:true });
    if(error) throw error;
    currentRows = data || [];
    if(!currentRows.length){ tbody.innerHTML = `<tr><td colspan="5">Aucun partenaire. Cliquez sur « Nouveau partenaire » pour commencer.</td></tr>`; return; }
    tbody.innerHTML = currentRows.map(p => {
      return `<tr>
        <td>${p.image ? `<img src="${p.image}" style="height:32px; border-radius:4px;">` : "—"}</td>
        <td>${escapeHtml(p.nom||"")}</td>
        <td>${p.lien ? `<a href="${p.lien}" target="_blank" rel="noopener">${escapeHtml(p.lien)}</a>` : "—"}</td>
        <td>${p.publie === false ? "Masqué" : "Affiché"}</td>
        <td style="white-space:nowrap;">
          <button class="icon-btn" data-edit="${p.id}" title="Modifier">✏️</button>
          <button class="icon-btn" data-delete="${p.id}" title="Supprimer">🗑️</button>
        </td>
      </tr>`;
    }).join("");
    tbody.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => editItem(b.dataset.edit)));
    tbody.querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", () => remove(b.dataset.delete)));
  }catch(err){
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="5">Impossible de charger les partenaires. Vérifie la configuration Supabase.</td></tr>`;
  }
}

function open(data, id){
  document.getElementById("modalTitle").textContent = id ? "Modifier le partenaire" : "Nouveau partenaire";
  document.getElementById("fId").value = id || "";
  document.getElementById("fNom").value = data?.nom || "";
  document.getElementById("fDescription").value = data?.description || "";
  document.getElementById("fLien").value = data?.lien || "";
  document.getElementById("fPublie").value = String(data?.publie !== false);
  document.getElementById("formError").style.display = "none";
  imageField = wireImageField({
    inputEl: document.getElementById("fImageInput"),
    previewEl: document.getElementById("fImagePreview"),
    folder: "partenaires",
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
      btn.textContent = "Téléversement du logo…";
      const { url } = await imageField.upload();
      imageUrl = url;
    }catch(err){
      const box = document.getElementById("formError");
      box.textContent = "Logo : " + err.message;
      box.style.display = "block";
      btn.disabled = false; btn.textContent = "Enregistrer";
      return;
    }
  }

  const payload = {
    nom: document.getElementById("fNom").value.trim(),
    description: document.getElementById("fDescription").value.trim(),
    lien: document.getElementById("fLien").value.trim(),
    publie: document.getElementById("fPublie").value === "true",
    image: imageUrl,
    updated_at: new Date().toISOString(),
  };

  try{
    if(id){
      const { error } = await supabase.from("partenaires").update(payload).eq("id", id);
      if(error) throw error;
    }else{
      const { error } = await supabase.from("partenaires").insert(payload);
      if(error) throw error;
    }
    close();
    toast(id ? "Partenaire mis à jour." : "Partenaire ajouté.");
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
  if(!confirm("Supprimer définitivement ce partenaire ?")) return;
  try{
    const { error } = await supabase.from("partenaires").delete().eq("id", id);
    if(error) throw error;
    toast("Partenaire supprimé.");
    await load();
  }catch(err){ toast("Suppression impossible.", "error"); }
}

init();
