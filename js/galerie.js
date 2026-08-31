// ============================================================
// CHODEP — Galerie photo (table Supabase "galerie")
// ============================================================
import { supabase } from "./supabase-config.js";

const CATS = ["formations","conferences","ateliers","evenements","equipe"];

function placeholderItems(){
  // Damiers colorés en attendant l'ajout de vraies photos depuis l'admin.
  const items = [];
  for(let i=0;i<12;i++){
    items.push({ id:"ph-"+i, categorie: CATS[i % CATS.length], tall: i % 5 === 0, url:"" });
  }
  return items;
}

function itemHTML(it){
  const bg = `hsl(${(it.id.length*37)%360} 35% 22%)`;
  return `<div class="g-item ${it.tall?'tall':''}" data-cat="${it.categorie}" data-url="${it.url}" style="${it.url?'':`background:${bg};`} aspect-ratio:1/1;">
    ${it.url ? `<img src="${it.url}" alt="">` : ""}
  </div>`;
}

async function fetchGallery(){
  try{
    const { data, error } = await supabase.from("galerie").select("*").order("created_at", { ascending:false });
    if(error) throw error;
    if(!data || !data.length) throw new Error("empty");
    return data;
  }catch(err){
    console.warn("Supabase indisponible, galerie de démonstration affichée.", err.message);
    return placeholderItems();
  }
}

async function init(){
  const grid = document.getElementById("galleryGrid");
  if(!grid) return;
  const all = await fetchGallery();
  let active = "tous";

  function render(){
    const filtered = active === "tous" ? all : all.filter(i => i.categorie === active);
    grid.innerHTML = filtered.map(itemHTML).join("");
    grid.querySelectorAll(".g-item").forEach(el => el.addEventListener("click", () => openLightbox(el.dataset.url)));
  }
  document.querySelectorAll("#galleryFilters button").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll("#galleryFilters button").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    active = b.dataset.cat;
    render();
  }));
  render();
}

function openLightbox(url){
  if(!url) return;
  const box = document.getElementById("lightbox");
  document.getElementById("lightboxImg").src = url;
  box.classList.add("open");
}
document.getElementById("lightboxClose")?.addEventListener("click", () => document.getElementById("lightbox").classList.remove("open"));
document.getElementById("lightbox")?.addEventListener("click", (e) => { if(e.target.id === "lightbox") e.currentTarget.classList.remove("open"); });

init();
