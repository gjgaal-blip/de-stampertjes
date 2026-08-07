const SUPABASE_URL=window.STAMPERTJES_CONFIG.supabaseUrl;
const SUPABASE_KEY=window.STAMPERTJES_CONFIG.supabaseKey;
const adminCode=document.getElementById("adminCode");
const loginBtn=document.getElementById("loginBtn");
const loginStatus=document.getElementById("loginStatus");
const loginCard=document.getElementById("loginCard");
const portal=document.getElementById("portal");
const sbStatus=document.getElementById("sbStatus");
const players=document.getElementById("players");
const postCount=document.getElementById("postCount");
const games=document.getElementById("games");
const apples=document.getElementById("apples");
const teddy=document.getElementById("teddy");
const posts=document.getElementById("posts");
const cafeStatus=document.getElementById("cafeStatus");
const refreshBtn=document.getElementById("refreshBtn");
const openGameBtn=document.getElementById("openGameBtn");
const logoutBtn=document.getElementById("logoutBtn");

let activeAdminCode=sessionStorage.getItem("stampertjesAdminPortalCode")||"";

function esc(v){
  return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
async function rpc(name,body={}){
  const res=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{
    method:"POST",
    headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json"},
    body:JSON.stringify(body)
  });
  if(!res.ok)throw new Error(`${res.status}: ${await res.text()}`);
  return await res.json();
}
async function verify(code){
  return (await rpc("verify_stampertjes_admin",{p_admin_code:code}))===true;
}
async function login(){
  const code=adminCode.value;
  loginBtn.disabled=true;
  loginStatus.textContent="Controleren…";
  try{
    if(!(await verify(code))){
      loginStatus.textContent="Onjuiste beheercode.";
      return;
    }
    activeAdminCode=code;
    sessionStorage.setItem("stampertjesAdminPortalCode",code);
    loginCard.classList.add("hidden");
    portal.classList.remove("hidden");
    await refreshAll();
  }catch(err){
    console.error(err);
    loginStatus.textContent="Logincontrole mislukt. Is de v2.13 SQL uitgevoerd?";
  }finally{loginBtn.disabled=false}
}
async function refreshAll(){
  sbStatus.textContent="CONTROLEREN…";
  try{
    if(!(await verify(activeAdminCode)))throw new Error("admin");
    const [stats,community]=await Promise.all([
      rpc("get_public_stats",{}),
      rpc("admin_get_community_posts",{p_admin_code:activeAdminCode})
    ]);
    const t=stats?.totals||{};
    sbStatus.textContent="🟢 VERBONDEN";
    players.textContent=Number(t.players)||0;
    games.textContent=Number(t.games_played)||0;
    apples.textContent=Number(t.apples_defeated)||0;
    teddy.textContent=Number(t.teddy_finders)||0;
    postCount.textContent=Array.isArray(community)?community.length:0;
    renderPosts(Array.isArray(community)?community:[]);
  }catch(err){
    console.error(err);
    sbStatus.textContent="🔴 FOUT";
    cafeStatus.textContent="Kon beheerdata niet laden.";
  }
}
function renderPosts(list){
  posts.innerHTML=list.length?list.map(p=>`
    <article class="post">
      <div class="postHeader"><strong>${esc(p.name)}</strong><span>${new Date(p.created_at).toLocaleString("nl-NL")}</span></div>
      <div class="small">${esc(p.type)} · ${Number(p.likes)||0} likes</div>
      <div class="postMsg">${esc(p.message)}</div>
      <div class="actions"><button data-delete="${Number(p.id)}">🗑️ VERWIJDER</button></div>
    </article>
  `).join(""):"<div class='small'>Geen berichten.</div>";

  posts.querySelectorAll("[data-delete]").forEach(btn=>{
    btn.addEventListener("click",async()=>{
      const id=Number(btn.dataset.delete);
      if(!confirm("Weet je zeker dat je dit bericht wilt verwijderen?"))return;
      btn.disabled=true;
      try{
        const ok=await rpc("admin_delete_community_post",{p_post_id:id,p_admin_code:activeAdminCode});
        if(ok!==true)throw new Error("delete false");
        cafeStatus.textContent="Bericht verwijderd.";
        await refreshAll();
      }catch(err){
        console.error(err);
        cafeStatus.textContent="Verwijderen mislukt.";
      }finally{btn.disabled=false}
    });
  });
}
loginBtn.addEventListener("click",login);
adminCode.addEventListener("keydown",e=>{if(e.key==="Enter")login()});
refreshBtn.addEventListener("click",refreshAll);
openGameBtn.addEventListener("click",()=>location.href="./index.html");
logoutBtn.addEventListener("click",()=>{
  sessionStorage.removeItem("stampertjesAdminPortalCode");
  activeAdminCode="";
  portal.classList.add("hidden");
  loginCard.classList.remove("hidden");
  adminCode.value="";
  loginStatus.textContent="Uitgelogd.";
});
(async()=>{
  if(activeAdminCode){
    try{
      if(await verify(activeAdminCode)){
        loginCard.classList.add("hidden");
        portal.classList.remove("hidden");
        await refreshAll();
      }else{
        sessionStorage.removeItem("stampertjesAdminPortalCode");
        activeAdminCode="";
      }
    }catch{}
  }
})();
