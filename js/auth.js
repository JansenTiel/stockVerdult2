/* =========================================
   AUTH.JS
   Centrale authenticatie voor alle pagina’s
========================================= */

async function requireAuth(){
  try{
    const client = sb();
    const { data, error } = await client.auth.getSession();

    if(error){
      console.error("Auth error:", error);
      location.href = "/login.html";
      return null;
    }

    const session = data?.session;

    if(!session){
      location.href = "/login.html";
      return null;
    }

    const emailEl = document.getElementById("userEmail");
    if(emailEl){
      emailEl.textContent = session.user?.email || "";
    }

    return session;

  }catch(err){
    console.error("requireAuth crash:", err);
    location.href = "/login.html";
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
      location.href = "/login.html";
    }catch(e){
      console.error(e);
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

      location.href = "/index.html";

    }catch(err){

      if(typeof toast === "function"){
        toast(err.message || String(err),"err");
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

      const { error } = await sb().auth.resetPasswordForEmail(email,{
        redirectTo
      });

      if(error) throw error;

      if(typeof toast === "function"){
        toast("Reset e-mail verzonden. Controleer je inbox.","ok");
      }else{
        alert("Reset e-mail verzonden.");
      }

    }catch(err){

      if(typeof toast === "function"){
        toast(err.message || String(err),"err");
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
      return alert("Wachtwoord moet minimaal 6 tekens zijn.");
    }

    if(p1 !== p2){
      return alert("Wachtwoorden zijn niet gelijk.");
    }

    try{

      const { error } = await sb().auth.updateUser({
        password: p1
      });

      if(error) throw error;

      alert("Wachtwoord bijgewerkt.");

      setTimeout(()=>{
        location.href="/login.html";
      },1000);

    }catch(err){
      alert(err.message || String(err));
    }

  });

}


/* =========================================
   Pagina initialisatie
========================================= */

document.addEventListener("DOMContentLoaded", async ()=>{

  const page = document.body.dataset.page || "";

  const protectedPages = [
    "dashboard",
    "products",
    "scan",
    "stock",
    "outscans",
    "picklists",
    "picklist_detail"
  ];

  if(protectedPages.includes(page)){
    await requireAuth();
    authNav();
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
