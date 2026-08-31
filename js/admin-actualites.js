// ============================================================
// CHODEP — Administration : CRUD des actualités
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
    const { data, error } = await supabase.from("articles").select("*").order("date", { ascending:false });
    if(error) throw error;
    currentRows = data || [];
    if(!currentRows.length){ tbody.innerHTML = `<tr><td colspan="6">Aucun article. Cliquez sur « Nouvel article » pour commencer.</td></tr>`; return; }
    tbody.innerHTML = currentRows.map(a => {
      return `<tr>
        <td>${escapeHtml(a.titre||"")}</td>
        <td>${escapeHtml(a.categorie||"")}</td>
        <td>${escapeHtml(a.auteur||"")}</td>
        <td>${a.date ? formatDate(a.date) : ""}</td>
        <td>${a.publie === false ? "Masqué" : "Publié"}</td>
        <td style="white-space:nowrap;">
          <button class="icon-btn" data-edit="${a.id}" title="Modifier">✏️</button>
          <button class="icon-btn" data-delete="${a.id}" title="Supprimer">🗑️</button>
        </td>
      </tr>`;
    }).join("");
    tbody.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => editItem(b.dataset.edit)));
    tbody.querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", () => remove(b.dataset.delete)));
  }catch(err){
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="6">Impossible de charger les articles. Vérifie la configuration Supabase.</td></tr>`;
  }
}

function open(data, id){
  document.getElementById("modalTitle").textContent = id ? "Modifier l'article" : "Nouvel article";
  document.getElementById("fId").value = id || "";
  document.getElementById("fTitre").value = data?.titre || "";
  document.getElementById("fContenu").value = data?.contenu || "";
  document.getElementById("fCategorie").value = data?.categorie || "formation";
  document.getElementById("fAuteur").value = data?.auteur || "Équipe CHODEP";
  document.getElementById("fDate").value = data?.date || new Date().toISOString().slice(0,10);
  document.getElementById("fPublie").value = String(data?.publie !== false);
  document.getElementById("formError").style.display = "none";
  imageField = wireImageField({
    inputEl: document.getElementById("fImageInput"),
    previewEl: document.getElementById("fImagePreview"),
    folder: "articles",
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
    contenu: document.getElementById("fContenu").value.trim(),
    categorie: document.getElementById("fCategorie").value,
    auteur: document.getElementById("fAuteur").value.trim(),
    date: document.getElementById("fDate").value || null,
    publie: document.getElementById("fPublie").value === "true",
    image: imageUrl,
    updated_at: new Date().toISOString(),
  };

  try{
    if(id){
      const { error } = await supabase.from("articles").update(payload).eq("id", id);
      if(error) throw error;
    }else{
      const { error } = await supabase.from("articles").insert(payload);
      if(error) throw error;
    }
    close();
    toast(id ? "Article mis à jour." : "Article publié.");
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
  if(!confirm("Supprimer définitivement cet article ?")) return;
  try{
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if(error) throw error;
    toast("Article supprimé.");
    await load();
  }catch(err){ toast("Suppression impossible.", "error"); }
}

init();
