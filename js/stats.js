// ============================================================
// CHODEP — Suivi de fréquentation RÉEL (pas de chiffres inventés)
//
// Un compteur Supabase simple et 100% réel (visites totales + visites
// par page), utile pour un aperçu rapide dans le tableau de bord admin.
// L'incrément est fait de façon atomique côté serveur par la fonction
// RPC "track_visit" (voir supabase/schema.sql) — un visiteur anonyme
// ne peut ainsi jamais lire ou modifier directement la table.
//
// Pour des statistiques plus fines (pages vues, appareils, pays,
// sources de trafic), un outil externe comme Plausible ou Google
// Analytics peut être branché en complément.
// ============================================================
import { supabase } from "./supabase-config.js";

async function trackVisit(){
  try{
    const page = location.pathname.split("/").pop() || "index.html";

    // Un seul comptage par onglet/session (évite de gonfler le total au
    // moindre clic interne) — stocké en sessionStorage, jamais partagé.
    const sessionKey = "chodep-session-counted";
    const alreadyCounted = sessionStorage.getItem(sessionKey) === "1";

    const { error } = await supabase.rpc("track_visit", {
      p_page: page.replace(/\./g, "_"),
      p_count_total: !alreadyCounted,
    });
    if(error) throw error;

    if(!alreadyCounted) sessionStorage.setItem(sessionKey, "1");
  }catch(err){
    console.warn("Compteur de visites indisponible (Supabase non configuré) :", err.message);
  }
}

trackVisit();
