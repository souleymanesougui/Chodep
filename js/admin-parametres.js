// ============================================================
// CHODEP — Administration : paramètres généraux du site
// Ligne unique de la table Supabase "parametres" (id = "site")
// ============================================================
import { requireAuth, initLogout } from "./admin-auth.js";
import { supabase } from "./supabase-config.js";
import { wireImageField } from "./upload.js";

// Correspondance id de champ HTML → colonne Supabase (snake_case)
const FIELD_MAP = {
  sNom:"s_nom", sDescription:"s_description", sTelephone:"s_telephone", sWhatsapp:"s_whatsapp",
  sEmail:"s_email", sAdresse:"s_adresse", sHoraires:"s_horaires",
  sFacebook:"s_facebook", sWhatsappLien:"s_whatsapp_lien", sInstagram:"s_instagram",
  sTiktok:"s_tiktok", sLinkedin:"s_linkedin", sYoutube:"s_youtube",
  statParticipants:"stat_participants", statFormations:"stat_formations",
  statEvenements:"stat_evenements", statAnnees:"stat_annees",
};

let logoField = null;

async function init(){
  const user = await requireAuth();
  if(!user) return;
  initLogout();
  await load();
  document.getElementById("settingsForm").addEventListener("submit", save);
}

async function load(){
  try{
    const { data, error } = await supabase.from("parametres").select("*").eq("id","site").single();
    if(error) throw error;
    const s = data || {};
    Object.entries(FIELD_MAP).forEach(([htmlId, col]) => {
      if(s[col] !== undefined && s[col] !== null) document.getElementById(htmlId).value = s[col];
    });
    logoField = wireImageField({
      inputEl: document.getElementById("sLogoInput"),
      previewEl: document.getElementById("sLogoPreview"),
      folder: "site",
      currentUrl: s.logo || "",
    });
    document.getElementById("settingsForm").dataset.currentLogo = s.logo || "";
  }catch(err){
    console.warn("Aucun paramètre existant ou Supabase non configuré :", err.message);
    logoField = wireImageField({ inputEl: document.getElementById("sLogoInput"), previewEl: document.getElementById("sLogoPreview"), folder: "site" });
  }
}

async function save(e){
  e.preventDefault();
  const btn = document.getElementById("saveBtn");
  const success = document.getElementById("formSuccess");
  const error = document.getElementById("formError");
  success.style.display = "none"; error.style.display = "none";
  btn.disabled = true; btn.textContent = "Enregistrement…";

  let logoUrl = document.getElementById("settingsForm").dataset.currentLogo || "";
  if(logoField?.hasNewFile()){
    try{
      const { url } = await logoField.upload();
      logoUrl = url;
    }catch(err){
      error.textContent = "Logo : " + err.message;
      error.style.display = "block";
      btn.disabled = false; btn.textContent = "Enregistrer les paramètres";
      return;
    }
  }

  const payload = { id: "site", logo: logoUrl, updated_at: new Date().toISOString() };
  Object.entries(FIELD_MAP).forEach(([htmlId, col]) => { payload[col] = document.getElementById(htmlId).value.trim(); });

  try{
    const { error: upsertError } = await supabase.from("parametres").upsert(payload, { onConflict: "id" });
    if(upsertError) throw upsertError;
    success.style.display = "block";
  }catch(err){
    console.error(err);
    error.textContent = "Enregistrement impossible. Vérifie tes règles Supabase (RLS).";
    error.style.display = "block";
  }finally{
    btn.disabled = false; btn.textContent = "Enregistrer les paramètres";
  }
}

init();
