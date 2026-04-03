/* =========================================
   AUTH.JS
   Centrale authenticatie voor alle pagina’s
========================================= */

function showProtectedPage(){
  document.documentElement.classList.remove("auth-pending");
  document.documentElement.classList.add("auth-ready");
}

function hideProtectedPage(){
  document.documentElement.classList.remove("auth-ready");
  document.documentElement.classList.add("auth-pending");
}

function isProtectedPage(page){
  const protectedPages = [
    "dashboard",
    "products",
    "scan",
    "stock",
    "outscans",
    "picklists",
    "picklist_detail",
    "online-picklists"
  ];
  return protectedPages.includes(page);
}

function getLoginRedirectTarget(){
  const path = location.pathname || "/";
  const search = location.search || "";
  return `/login.html?next=${encodeURIComponent(path + search)}`;
}

function getPostLoginRedirect(){
  const params = new URLSearchParams(location.search);
  const next = params.get("next");

  if(next && next.startsWith("/")){
    return next;
  }

  return "/";
}

async function requireAuth(){
  try{
    const client = sb();
    const { data, error } = await client.auth.getSession();

    if(error){
      console.error("Auth error:", error);
      location.replace(getLoginRedirectTarget());
      return null;
    }

    const session = data?.session;

    if(!session){
      location.replace(getLoginRedirectTarget());
      return null;
    }

    const emailEl = document.getElementById("userEmail");
    if(emailEl){
      emailEl.textContent = session.user?.email || "";
    }

    return session;

  }catch(err){
    console.error("requireAuth crash:", err);
    location.replace(getLoginRedirectTarget());
    return null;
  }
}


/* =========================================
   Logout knop koppelen
========================================= */

function bindLogout(){
  const btn = document.getElementById("btnLogout");
  if(!btn) return;

  btn.addEventListener("click", async ()=>{
    try{
      await sb().auth.signOut();
      location.replace("/login.html");
    }catch(e){
      console.error("Logout error:", e);
    }
  });
}


/* =========================================
   Navigatie na login
========================================= */

function authNav(){
  bindLogout();
}


/* =========================================
   Login pagina
========================================= */

function initLogin(){
  const form = document.getElementById("loginForm");
  if(!form) return;

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try{
      const { error } = await sb().auth.signInWithPassword({
        email,
        password
      });

      if(error) throw error;

      location.replace(getPostLoginRedirect());

    }catch(err){
      if(typeof toast === "function"){
        toast(err.message || String(err), "err");
      }else{
        alert(err.message || String(err));
      }
    }
  });
}


/* =========================================
   Reset wachtwoord pagina
========================================= */

function initResetPassword(){
  const form = document.getElementById("resetForm");
  if(!form) return;

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const redirectTo = location.origin + "/update-password.html";

    try{
      const { error } = await sb().auth.resetPasswordForEmail(email, {
        redirectTo
      });

      if(error) throw error;

      if(typeof toast === "function"){
        toast("Reset e-mail verzonden. Controleer je inbox.", "ok");
      }else{
        alert("Reset e-mail verzonden.");
      }

    }catch(err){
      if(typeof toast === "function"){
        toast(err.message || String(err), "err");
      }else{
        alert(err.message || String(err));
      }
    }
  });
}


/* =========================================
   Update wachtwoord pagina
========================================= */

function initUpdatePassword(){
  const form = document.getElementById("updatePasswordForm");
  if(!form) return;

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();

    const p1 = document.getElementById("password").value;
    const p2 = document.getElementById("password2").value;

    if(p1.length < 6){
      alert("Wachtwoord moet minimaal 6 tekens zijn.");
      return;
    }

    if(p1 !== p2){
      alert("Wachtwoorden zijn niet gelijk.");
      return;
    }

    try{
      const { error } = await sb().auth.updateUser({
        password: p1
      });

      if(error) throw error;

      alert("Wachtwoord bijgewerkt.");
      location.replace("/login.html");

    }catch(err){
      alert(err.message || String(err));
    }
  });
}


/* =========================================
   Auth state listener
========================================= */

function bindAuthStateListener(page){
  const client = sb();

  client.auth.onAuthStateChange((event) => {
    if(event === "SIGNED_OUT" && isProtectedPage(page)){
      hideProtectedPage();
      location.replace("/login.html");
    }
  });
}


/* =========================================
   Pagina initialisatie
========================================= */

document.addEventListener("DOMContentLoaded", async ()=>{

  const page = document.body.dataset.page || "";

  if(isProtectedPage(page)){
    hideProtectedPage();

    const session = await requireAuth();

    if(!session){
      return;
    }

    authNav();
    bindAuthStateListener(page);
    showProtectedPage();
  }

  if(page === "login"){
    initLogin();
  }

  if(page === "reset-password"){
    initResetPassword();
  }

  if(page === "update-password"){
    initUpdatePassword();
  }

});
