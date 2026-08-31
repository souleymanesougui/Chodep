// ============================================================
// CHODEP — Contenu bilingue pour les enregistrements Supabase
//
// Convention : chaque champ traduisible "champ" peut avoir un
// équivalent "champ_en". Cette fonction renvoie la bonne valeur
// selon la langue active (repli automatique sur le français si la
// traduction anglaise n'a pas encore été saisie par l'administrateur).
//
// Pour étendre cette logique à une autre collection (événements,
// articles, équipe, partenaires...) : ajoute simplement les champs
// "xxx_en" correspondants dans le formulaire admin concerné, puis
// utilise localizedField(item, "xxx") au lieu de item.xxx à l'affichage.
// ============================================================
import { currentLang } from "./i18n.js";

export function localizedField(item, field){
  if(!item) return "";
  const lang = currentLang();
  if(lang === "en" && item[field + "_en"]) return item[field + "_en"];
  return item[field] || "";
}
