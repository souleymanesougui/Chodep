// ============================================================
// CHODEP — Formulaire de contact → table Supabase "messages"
// ============================================================
import { toast } from "./main.js";
import { supabase } from "./supabase-config.js";

const form = document.getElementById("contactForm");
if(form){
  const success = document.getElementById("contactSuccess");
  const error = document.getElementById("contactError");
  const btn = document.getElementById("contactSubmitBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    success.style.display = "none";
    error.style.display = "none";
    btn.disabled = true;
    btn.textContent = "Envoi en cours…";

    const payload = {
      nom: document.getElementById("cNom").value.trim(),
      email: document.getElementById("cEmail").value.trim(),
      telephone: document.getElementById("cTelephone").value.trim(),
      sujet: document.getElementById("cSujet").value.trim(),
      message: document.getElementById("cMessage").value.trim(),
      statut: "non-lu",
    };

    try{
      const { error: insertError } = await supabase.from("messages").insert(payload);
      if(insertError) throw insertError;

      // Notification email à l'administration : voir README → Notifications
      // (à brancher via une Edge Function Supabase déclenchée par un webhook
      // sur la table "messages", ou un service tiers comme Resend).

      success.style.display = "block";
      form.reset();
      toast("Message envoyé avec succès !");
    }catch(err){
      console.error(err);
      error.textContent = "Impossible d'envoyer le message pour le moment. Merci de réessayer ou de nous contacter directement.";
      error.style.display = "block";
    }finally{
      btn.disabled = false;
      btn.textContent = "Envoyer";
    }
  });
}
