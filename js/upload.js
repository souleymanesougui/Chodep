// ============================================================
// CHODEP — Téléversement d'images vers Supabase Storage
// Utilisé par tous les modules admin (formations, événements,
// actualités, galerie, équipe, partenaires, paramètres/logo).
// ============================================================
import { supabase, STORAGE_BUCKET } from "./supabase-config.js";

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Téléverse un fichier image choisi par l'admin vers Supabase Storage,
 * sous le dossier indiqué, et renvoie son URL publique.
 * @param {File} file
 * @param {string} folder ex: "formations", "galerie", "equipe"
 */
export function uploadImage(file, folder, onProgress){
  return new Promise((resolve, reject) => {
    if(!file) return reject(new Error("Aucun fichier sélectionné."));
    if(!ALLOWED_TYPES.includes(file.type)) return reject(new Error("Format non supporté (JPEG, PNG, WebP ou AVIF uniquement)."));
    if(file.size > MAX_SIZE_MB * 1024 * 1024) return reject(new Error(`Fichier trop volumineux (max ${MAX_SIZE_MB} Mo).`));

    const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${folder}/${Date.now()}_${cleanName}`;

    onProgress?.(20);
    supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: false })
      .then(({ error }) => {
        if(error) return reject(error);
        onProgress?.(80);
        const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
        onProgress?.(100);
        resolve({ url: data.publicUrl, path });
      })
      .catch(reject);
  });
}

/** Supprime une image de Storage à partir de son chemin (facultatif, best-effort). */
export async function deleteImage(path){
  if(!path) return;
  try{ await supabase.storage.from(STORAGE_BUCKET).remove([path]); }
  catch(err){ console.warn("Suppression Storage impossible (probablement déjà supprimée) :", err.message); }
}

/**
 * Branche un champ <input type="file"> sur un aperçu <img> et renvoie
 * une fonction upload() à appeler au moment de l'enregistrement du formulaire.
 */
export function wireImageField({ inputEl, previewEl, folder, currentUrl }){
  let selectedFile = null;
  if(currentUrl && previewEl){ previewEl.src = currentUrl; previewEl.style.display = "block"; }

  inputEl.addEventListener("change", () => {
    const file = inputEl.files?.[0];
    if(!file) return;
    selectedFile = file;
    if(previewEl){
      previewEl.src = URL.createObjectURL(file);
      previewEl.style.display = "block";
    }
  });

  return {
    hasNewFile: () => !!selectedFile,
    upload: (onProgress) => uploadImage(selectedFile, folder, onProgress),
  };
}
