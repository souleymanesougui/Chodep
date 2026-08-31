// ============================================================
// CHODEP — comportements partagés (nav mobile, thème, animations)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initTheme();
  initReveal();
  initHeaderScroll();
  markActiveLink();
});

/* --- Menu mobile --- */
function initMobileNav(){
  const btn = document.querySelector(".hamburger");
  const panel = document.querySelector(".mobile-nav");
  const close = document.querySelector(".mobile-nav .close-btn");
  if(!btn || !panel) return;
  btn.addEventListener("click", () => panel.classList.add("open"));
  close?.addEventListener("click", () => panel.classList.remove("open"));
  panel.querySelectorAll("a").forEach(a => a.addEventListener("click", () => panel.classList.remove("open")));
}

/* --- Mode sombre (préférence sauvegardée) --- */
function initTheme(){
  const toggle = document.querySelector(".theme-toggle");
  const saved = localStorage.getItem("chodep-theme");
  if(saved === "dark") document.body.classList.add("dark");
  toggle?.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("chodep-theme", document.body.classList.contains("dark") ? "dark" : "light");
  });
}

/* --- Apparition progressive au scroll --- */
function initReveal(){
  const items = document.querySelectorAll(".reveal");
  if(!items.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  items.forEach(i => io.observe(i));
}

/* --- Header : légère opacité au scroll --- */
function initHeaderScroll(){
  const header = document.querySelector(".site-header");
  if(!header) return;
  window.addEventListener("scroll", () => {
    header.style.boxShadow = window.scrollY > 10 ? "0 1px 0 rgba(18,36,46,0.08)" : "none";
  });
}

/* --- Surligne le lien de navigation actif --- */
function markActiveLink(){
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav.main-nav a, .mobile-nav a").forEach(a => {
    if(a.getAttribute("href") === path) a.classList.add("active");
  });
}

/* --- Utilitaires exportés pour les autres scripts --- */
export function formatDate(value){
  if(!value) return "";
  const d = new Date(value);
  if(isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" });
}

export function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

export function toast(msg, type = "success"){
  let el = document.querySelector(".chodep-toast");
  if(!el){
    el = document.createElement("div");
    el.className = "chodep-toast";
    Object.assign(el.style, {
      position:"fixed", bottom:"24px", right:"24px", zIndex:9999,
      padding:"14px 22px", borderRadius:"12px", fontFamily:"'Work Sans',sans-serif",
      fontSize:"0.9rem", fontWeight:"600", color:"#fff", boxShadow:"0 10px 30px rgba(0,0,0,0.2)",
      transition:"opacity .3s, transform .3s", opacity:"0", transform:"translateY(10px)"
    });
    document.body.appendChild(el);
  }
  el.style.background = type === "error" ? "#A63D40" : "#3F7A52";
  el.textContent = msg;
  requestAnimationFrame(() => { el.style.opacity = "1"; el.style.transform = "translateY(0)"; });
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateY(10px)"; }, 3500);
}
