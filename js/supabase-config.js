// ============================================================
// CONFIGURATION SUPABASE — CHODEP
// Remplace SUPABASE_ANON_KEY par la clé "anon public" de ton projet
// (Dashboard Supabase → Project Settings → API).
// L'URL du projet est déjà celle fournie : cqtdipfkuzodoegsfsnl
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://cqtdipfkuzodoegsfsnl.supabase.co";
const SUPABASE_ANON_KEY ="sb_publishable_tvms4_sTveZgJaFe1kAxZg_3MeWfF2J";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// Nom du bucket Supabase Storage (public) utilisé pour toutes les images.
// Les fichiers y sont rangés par dossier : formations/, evenements/,
// articles/, galerie/, equipe/, partenaires/, site/
export const STORAGE_BUCKET = "chodep-images";
