// ============================================================
// CHODEP — Applique les paramètres Supabase (table "parametres",
// ligne id="site") aux éléments marqués data-setting="..." sur la
// page publique en cours. Reste silencieux (garde les valeurs par
// défaut du HTML) si Supabase n'est pas encore configuré.
// ============================================================
import { supabase } from "./supabase-config.js";

async function applySettings(){
  try{
    const { data: s, error } = await supabase.from("parametres").select("*").eq("id", "site").single();
    if(error || !s) return;

    const map = {
      telephone: s.s_telephone, whatsapp: s.s_whatsapp, email: s.s_email,
      adresse: s.s_adresse, horaires: s.s_horaires,
      facebook: s.s_facebook, "whatsapp-lien": s.s_whatsapp_lien, instagram: s.s_instagram,
      tiktok: s.s_tiktok, linkedin: s.s_linkedin, youtube: s.s_youtube,
      "stat-participants": s.stat_participants, "stat-formations": s.stat_formations,
      "stat-evenements": s.stat_evenements, "stat-annees": s.stat_annees,
      description: s.s_description,
    };

    document.querySelectorAll("[data-setting]").forEach(el => {
      const key = el.dataset.setting;
      const value = map[key];
      if(!value) return;
      if(el.tagName === "A" && (key.includes("lien") || ["facebook","instagram","tiktok","linkedin","youtube"].includes(key))){
        el.href = value;
      }else if(el.tagName === "A" && key === "telephone"){
        el.href = "tel:" + value.replace(/\s+/g,""); el.textContent = value;
      }else if(el.tagName === "A" && key === "email"){
        el.href = "mailto:" + value; el.textContent = value;
      }else{
        el.textContent = value;
      }
    });

    if(s.logo){
      document.querySelectorAll(".brand .mark").forEach(m => {
        m.style.backgroundImage = `url('${s.logo}')`;
        m.style.backgroundSize = "cover";
        m.textContent = "";
      });
    }
  }catch(err){
    console.warn("Paramètres du site non chargés (Supabase non configuré) :", err.message);
  }
}
applySettings();
