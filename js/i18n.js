// ============================================================
// CHODEP — Système multilingue (FR / EN)
//
// Fonctionnement :
//  - Chaque élément d'interface porte un attribut data-i18n="cle".
//  - Ce fichier contient un dictionnaire { cle: { fr, en } }.
//  - Au chargement (et à chaque clic sur FR/EN), tous les éléments
//    data-i18n sont mis à jour, la langue est mémorisée
//    (localStorage) et <html lang="…"> est mis à jour pour le SEO
//    et l'accessibilité.
//  - Pour ajouter une langue plus tard (ex. arabe) : ajouter une clé
//    "ar" dans chaque entrée du dictionnaire ci-dessous, puis un
//    bouton <button data-lang="ar">AR</button> dans le sélecteur.
//  - Pour le contenu dynamique (Supabase), voir la convention
//    "champ_en" documentée dans js/formations.js.
// ============================================================

export const DICT = {
  "nav.accueil":      { fr:"Accueil", en:"Home" },
  "nav.apropos":       { fr:"À propos", en:"About" },
  "nav.formations":    { fr:"Formations", en:"Trainings" },
  "nav.evenements":    { fr:"Événements", en:"Events" },
  "nav.actualites":    { fr:"Actualités", en:"News" },
  "nav.galerie":       { fr:"Galerie", en:"Gallery" },
  "nav.partenaires":   { fr:"Partenaires", en:"Partners" },
  "nav.contact":       { fr:"Contact", en:"Contact" },
  "nav.contacter":     { fr:"Nous contacter", en:"Contact us" },
  "nav.admin":         { fr:"Espace administrateur", en:"Admin area" },

  "hero.eyebrow":      { fr:"CHODEP · N'Djaména", en:"CHODEP · N'Djamena" },
  "hero.title":        { fr:"Construire aujourd'hui les compétences et les leaders de demain.", en:"Building today the skills and leaders of tomorrow." },
  "hero.lede":         { fr:"CHODEP accompagne les jeunes et les communautés à travers des formations, un accompagnement personnalisé et des actions de terrain qui font grandir durablement.", en:"CHODEP supports young people and communities through training, personalized mentoring, and field action that fosters lasting growth." },
  "hero.cta.discover": { fr:"Découvrir CHODEP", en:"Discover CHODEP" },
  "hero.cta.trainings":{ fr:"Voir nos formations", en:"View our trainings" },

  "stats.participants":{ fr:"Participants", en:"Participants" },
  "stats.formations":  { fr:"Formations", en:"Trainings" },
  "stats.evenements":  { fr:"Événements", en:"Events" },
  "stats.annees":      { fr:"Années d'expérience", en:"Years of experience" },

  "section.formations.eyebrow": { fr:"Agenda", en:"Schedule" },
  "section.formations.title":   { fr:"Prochaines formations", en:"Upcoming trainings" },
  "section.formations.all":     { fr:"Voir toutes les formations", en:"View all trainings" },
  "section.evenements.eyebrow": { fr:"À venir", en:"Coming up" },
  "section.evenements.title":   { fr:"Événements", en:"Events" },
  "section.evenements.all":     { fr:"Voir tous les événements", en:"View all events" },

  "cta.title": { fr:"Vous souhaitez participer à nos activités ?", en:"Want to take part in our activities?" },
  "cta.lede":  { fr:"Rejoignez une prochaine formation et faites le premier pas vers vos objectifs.", en:"Join an upcoming training and take the first step toward your goals." },
  "cta.button":{ fr:"S'inscrire à une formation", en:"Register for a training" },

  "form.nom":        { fr:"Nom", en:"Last name" },
  "form.prenom":     { fr:"Prénom", en:"First name" },
  "form.telephone":  { fr:"Téléphone", en:"Phone" },
  "form.email":      { fr:"Email", en:"Email" },
  "form.ville":      { fr:"Ville", en:"City" },
  "form.message":    { fr:"Message / commentaire", en:"Message / comment" },
  "form.submit.inscription": { fr:"Envoyer mon inscription", en:"Submit my registration" },
  "form.submit.contact":     { fr:"Envoyer", en:"Send" },

  "footer.rights": { fr:"Tous droits réservés.", en:"All rights reserved." },
  "footer.links":  { fr:"Liens rapides", en:"Quick links" },
  "footer.resources": { fr:"Ressources", en:"Resources" },
  "footer.contact":  { fr:"Contact", en:"Contact" },

  "search.placeholder": { fr:"Rechercher une formation par nom ou lieu…", en:"Search a training by name or location…" },
  "filter.all":       { fr:"Toutes", en:"All" },
  "filter.open":      { fr:"Places disponibles", en:"Spots available" },
  "filter.soon":      { fr:"Bientôt", en:"Coming soon" },
  "filter.full":      { fr:"Complet", en:"Full" },
};

const STORAGE_KEY = "chodep-lang";

export function currentLang(){
  return localStorage.getItem(STORAGE_KEY) || "fr";
}

export function applyLang(lang){
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const entry = DICT[el.dataset.i18n];
    if(!entry) return;
    const text = entry[lang] || entry.fr;
    if(el.tagName === "INPUT" && el.hasAttribute("placeholder")) el.setAttribute("placeholder", text);
    else el.textContent = text;
  });
  document.querySelectorAll(".lang-toggle button").forEach(b => b.classList.toggle("active", b.dataset.lang === lang));
  localStorage.setItem(STORAGE_KEY, lang);
  window.dispatchEvent(new CustomEvent("chodep-lang-changed", { detail: { lang } }));
}

export function initI18n(){
  applyLang(currentLang());
  document.querySelectorAll(".lang-toggle button").forEach(btn => {
    btn.addEventListener("click", () => applyLang(btn.dataset.lang));
  });
}

document.addEventListener("DOMContentLoaded", initI18n);
