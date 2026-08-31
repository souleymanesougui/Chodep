// ============================================================
// CHODEP — Authentification de l'espace administrateur
// Utilise Supabase Auth (Email/Mot de passe).
// Crée les comptes admin dans Dashboard Supabase → Authentication → Users.
// ============================================================
import { supabase } from "./supabase-config.js";

const loginForm = document.getElementById("loginForm");
if(loginForm){
  const errorBox = document.getElementById("loginError");
  const btn = document.getElementById("loginBtn");
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.style.display = "none";
    btn.disabled = true;
    btn.textContent = "Connexion…";
    try{
      const { error } = await supabase.auth.signInWithPassword({
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value,
      });
      if(error) throw error;
      window.location.href = "dashboard.html";
    }catch(err){
      console.error(err);
      errorBox.textContent = "Email ou mot de passe incorrect.";
      errorBox.style.display = "block";
    }finally{
      btn.disabled = false;
      btn.textContent = "Se connecter";
    }
  });
}

/* Garde de session : à inclure sur chaque page admin protégée */
export async function requireAuth(){
  const { data: { session } } = await supabase.auth.getSession();
  if(!session){
    window.location.href = "login.html";
    return null;
  }
  return session.user;
}

export function initLogout(){
  document.querySelectorAll("[data-logout]").forEach(btn => {
    btn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "login.html";
    });
  });
}
