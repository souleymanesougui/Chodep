// ============================================================
// CHODEP — Détail d'une formation + inscription
// ============================================================
import { escapeHtml, formatDate, toast } from "./main.js";
import { FALLBACK } from "./formations.js";
import { localizedField } from "./content-i18n.js";
import { supabase } from "./supabase-config.js";

const params = new URLSearchParams(location.search);
const formationId = params.get("id");

function statusLabel(statut){
  return { ouvert:"Places disponibles", complet:"Complet", bientot:"Bientôt ouvert" }[statut] || "Places disponibles";
}
function statusClass(statut){
  return { ouvert:"status-open", complet:"status-full", bientot:"status-soon" }[statut] || "status-open";
}

async function loadFormation(){
  if(!formationId){
    document.getElementById("detailTitle").textContent = "Formation introuvable";
    return;
  }
  let f = null;
  try{
    const { data, error } = await supabase.from("formations").select("*").eq("id", formationId).single();
    if(error) throw error;
    f = data;
  }catch(err){ console.warn("Lecture Supabase impossible, fallback local.", err.message); }

  if(!f){ f = FALLBACK.find(x => x.id === formationId) || FALLBACK[0]; }

  const titre = localizedField(f, "titre");
  document.getElementById("pageTitle").textContent = `${titre} — CHODEP`;
  document.getElementById("breadcrumbTitle").textContent = titre;
  document.getElementById("detailTitle").textContent = titre;
  document.getElementById("detailDescription").textContent = localizedField(f, "description") || "Description à venir.";
  window.addEventListener("chodep-lang-changed", () => {
    document.getElementById("pageTitle").textContent = `${localizedField(f,"titre")} — CHODEP`;
    document.getElementById("breadcrumbTitle").textContent = localizedField(f,"titre");
    document.getElementById("detailTitle").textContent = localizedField(f,"titre");
    document.getElementById("detailDescription").textContent = localizedField(f,"description") || "Description à venir.";
  });
  document.getElementById("detailObjectifs").textContent = f.objectifs || "Renforcer des compétences concrètes et directement applicables sur le terrain.";
  document.getElementById("detailProgramme").textContent = f.programme || "Le programme détaillé sera communiqué aux participants inscrits.";
  document.getElementById("detailFormateur").textContent = f.formateur || "À confirmer";
  document.getElementById("detailPrix").textContent = f.prix ? `${f.prix} FCFA` : "Gratuit";
  document.getElementById("infoDate").textContent = f.date ? formatDate(f.date) : "À définir";
  document.getElementById("infoDuree").textContent = f.duree || "—";
  document.getElementById("infoLieu").textContent = f.lieu || "—";
  document.getElementById("infoPlaces").textContent = f.places ? `${f.places - (f.inscrits||0)} places restantes sur ${f.places}` : "—";
  if(f.image) document.getElementById("detailImage").innerHTML = `<img src="${f.image}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-l);" alt="${escapeHtml(f.titre)}">`;
  document.getElementById("detailStatus").innerHTML = `<span class="status-pill ${statusClass(f.statut)}">${statusLabel(f.statut)}</span>`;

  const submitBtn = document.getElementById("submitBtn");
  if(f.statut === "complet"){
    submitBtn.disabled = true;
    submitBtn.textContent = "Formation complète";
  }

  initForm(f);
}

function initForm(formation){
  const form = document.getElementById("inscriptionForm");
  const success = document.getElementById("formSuccess");
  const error = document.getElementById("formError");
  const submitBtn = document.getElementById("submitBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    success.style.display = "none";
    error.style.display = "none";
    submitBtn.disabled = true;
    submitBtn.textContent = "Envoi en cours…";

    const email = document.getElementById("email").value.trim().toLowerCase();
    const payload = {
      nom: document.getElementById("nom").value.trim(),
      prenom: document.getElementById("prenom").value.trim(),
      telephone: document.getElementById("telephone").value.trim(),
      email,
      sexe: document.getElementById("sexe").value,
      ville: document.getElementById("ville").value.trim(),
      message: document.getElementById("message").value.trim(),
    };

    try{
      // Anti-doublon ET anti-surbooking gérés de façon atomique côté serveur
      // par la fonction RPC "inscrire_formation" (voir supabase/schema.sql) :
      // elle verrouille la ligne de la formation, vérifie les places restantes,
      // insère l'inscription (contrainte unique formation_id+email pour le
      // doublon) et incrémente le compteur, le tout dans une seule transaction.
      const { error: rpcError } = await supabase.rpc("inscrire_formation", {
        p_formation_id: formation.id,
        p_nom: payload.nom, p_prenom: payload.prenom, p_telephone: payload.telephone,
        p_email: payload.email, p_sexe: payload.sexe, p_ville: payload.ville, p_message: payload.message,
      });
      if(rpcError) throw rpcError;

      // Déclenche la notification email à l'administration (voir README → Notifications,
      // ex. via un Edge Function Supabase déclenchée par un webhook sur la table).
      success.style.display = "block";
      form.reset();
      toast("Inscription envoyée avec succès !");
    }catch(err){
      console.error(err);
      const msg = err.message || "";
      if(msg.includes("FORMATION_COMPLETE")){
        error.textContent = "Cette formation vient d'atteindre son nombre maximal de places. Merci de choisir une autre session.";
        submitBtn.disabled = true;
        submitBtn.textContent = "Formation complète";
      }else if(msg.includes("DUPLICATE") || msg.includes("duplicate key")){
        error.textContent = "Vous êtes déjà inscrit(e) à cette formation avec cet email.";
      }else{
        error.textContent = "Une erreur est survenue. Vérifiez votre connexion et réessayez, ou contactez-nous directement.";
      }
      error.style.display = "block";
    }finally{
      if(submitBtn.textContent !== "Formation complète"){
        submitBtn.disabled = false;
        submitBtn.textContent = "Envoyer mon inscription";
      }
    }
  });
}

loadFormation();
