// ============================================================
// CHODEP — Administration : galerie photo (upload multiple)
// ============================================================
import { requireAuth, initLogout } from "./admin-auth.js";
import { supabase } from "./supabase-config.js";
import { toast } from "./main.js";
import { uploadImage, deleteImage } from "./upload.js";

let all = [];

async function init(){
  const user = await requireAuth();
  if(!user) return;
  initLogout();
  await load();
  document.getElementById("uploadBtn").addEventListener("click", handleUpload);
  document.querySelectorAll("#galleryFilters button").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll("#galleryFilters button").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    render(b.dataset.cat);
  }));
}

async function load(){
  try{
    const { data, error } = await supabase.from("galerie").select("*").order("created_at", { ascending:false });
    if(error) throw error;
    all = data || [];
    render("tous");
  }catch(err){
    console.error(err);
    document.getElementById("adminGalleryGrid").innerHTML = `<p class="body-text">Impossible de charger la galerie. Vérifie la configuration Supabase.</p>`;
  }
}

function render(cat){
  const grid = document.getElementById("adminGalleryGrid");
  const filtered = cat === "tous" ? all : all.filter(i => i.categorie === cat);
  grid.innerHTML = filtered.length ? filtered.map(it => `
    <div class="g-item" style="aspect-ratio:1/1; position:relative;">
      <img src="${it.url}" alt="${it.description||''}" style="width:100%; height:100%; object-fit:cover;">
      <button data-id="${it.id}" data-path="${it.storage_path||''}" class="icon-btn" title="Supprimer" style="position:absolute; top:8px; right:8px; background:rgba(18,36,46,0.7); color:#fff; border:none;">🗑️</button>
    </div>`).join("") : `<p class="body-text">Aucune photo dans cette catégorie.</p>`;
  grid.querySelectorAll("[data-id]").forEach(b => b.addEventListener("click", () => removePhoto(b.dataset.id, b.dataset.path)));
}

async function handleUpload(){
  const input = document.getElementById("uploadInput");
  const files = Array.from(input.files || []);
  const progress = document.getElementById("uploadProgress");
  const error = document.getElementById("uploadError");
  error.style.display = "none";
  if(!files.length){ error.textContent = "Sélectionne au moins une photo."; error.style.display = "block"; return; }

  const categorie = document.getElementById("uploadCat").value;
  const album = document.getElementById("uploadAlbum").value.trim();
  const btn = document.getElementById("uploadBtn");
  btn.disabled = true;

  let done = 0;
  for(const file of files){
    progress.textContent = `Téléversement ${done+1}/${files.length}…`;
    try{
      const { url, path } = await uploadImage(file, "galerie");
      const { error: insertError } = await supabase.from("galerie").insert({ url, storage_path: path, categorie, album });
      if(insertError) throw insertError;
      done++;
    }catch(err){
      console.error(err);
      error.textContent = `Erreur sur "${file.name}" : ${err.message}`;
      error.style.display = "block";
    }
  }
  progress.textContent = `${done}/${files.length} photo(s) téléversée(s).`;
  input.value = "";
  btn.disabled = false;
  toast(`${done} photo(s) ajoutée(s) à la galerie.`);
  await load();
}

async function removePhoto(id, path){
  if(!confirm("Supprimer cette photo ?")) return;
  try{
    const { error } = await supabase.from("galerie").delete().eq("id", id);
    if(error) throw error;
    await deleteImage(path);
    toast("Photo supprimée.");
    await load();
  }catch(err){ toast("Suppression impossible.", "error"); }
}

init();
