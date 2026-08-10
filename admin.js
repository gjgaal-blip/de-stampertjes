const SUPABASE_URL=window.STAMPERTJES_CONFIG.supabaseUrl;
const SUPABASE_KEY=window.STAMPERTJES_CONFIG.supabaseKey;

const $=id=>document.getElementById(id);
const adminCode=$("adminCode"),loginBtn=$("loginBtn"),loginStatus=$("loginStatus");
const loginCard=$("loginCard"),portal=$("portal"),sbStatus=$("sbStatus");
const refreshBtn=$("refreshBtn"),openGameBtn=$("openGameBtn"),logoutBtn=$("logoutBtn");
const playerSearch=$("playerSearch"),playerList=$("playerList"),levelAnalytics=$("levelAnalytics");
const bonusAnalytics=$("bonusAnalytics"),platformAnalytics=$("platformAnalytics"),audioAnalytics=$("audioAnalytics");
const recentEvents=$("recentEvents"),posts=$("posts"),cafeStatus=$("cafeStatus");
const teddyEncounterList=$("teddyEncounterList"),teddyEasterList=$("teddyEasterList");

let activeAdminCode=sessionStorage.getItem("stampertjesAdminPortalCode")||"";
let dashboardPlayers=[];

function esc(v){
  return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function n(v){return Number(v)||0}
function date(v){if(!v)return "-";try{return new Date(v).toLocaleString("nl-NL")}catch{return "-"}}
function shortId(v){return v?String(v).slice(0,8):"—"}

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

function setMetric(id,value){const el=$(id);if(el)el.textContent=value}

async function login(){
  const code=adminCode.value;
  loginBtn.disabled=true;loginStatus.textContent="Controleren…";
  try{
    if(!(await verify(code))){loginStatus.textContent="Onjuiste beheercode.";return}
    activeAdminCode=code;
    sessionStorage.setItem("stampertjesAdminPortalCode",code);
    loginCard.classList.add("hidden");portal.classList.remove("hidden");
    await refreshAll();
  }catch(err){
    console.error(err);loginStatus.textContent="Logincontrole mislukt.";
  }finally{loginBtn.disabled=false}
}

function renderPlayers(list){
  dashboardPlayers=Array.isArray(list)?list:[];
  const q=(playerSearch?.value||"").trim().toLowerCase();
  const filtered=dashboardPlayers.filter(p=>
    !q||
    String(p.player_name||"").toLowerCase().includes(q)||
    String(p.device_id||"").toLowerCase().includes(q)
  );

  playerList.innerHTML=filtered.length?filtered.map(p=>`
    <details class="playerCard">
      <summary>
        <span><strong>${esc(p.player_name||"SPELER")}</strong><br><small>#${esc(shortId(p.device_id))}</small></span>
        <span class="playerRight">${n(p.games_played)} potjes<br><small>${date(p.last_seen)}</small></span>
      </summary>
      <div class="playerStats">
        <div><span>Volledig ID</span><strong class="idText">${esc(p.device_id)}</strong></div>
        <div><span>Eerste bezoek</span><strong>${date(p.first_seen)}</strong></div>
        <div><span>Laatste bezoek</span><strong>${date(p.last_seen)}</strong></div>
        <div><span>Potjes</span><strong>${n(p.games_played)}</strong></div>
        <div><span>Beste score</span><strong>${n(p.best_score)}</strong></div>
        <div><span>Hoogste level</span><strong>${n(p.highest_level)}</strong></div>
        <div><span>Appelieten</span><strong>${n(p.apples_defeated)}</strong></div>
        <div><span>Deaths</span><strong>${n(p.deaths)}</strong></div>
        <div><span>Langste combo</span><strong>${n(p.longest_combo)}</strong></div>
        <div><span>Teddy totaal</span><strong>${p.teddy_found?"JA":"NEE"}</strong></div>
        <div><span>Teddy Encounter</span><strong>${p.teddy_encounter_found?"JA":"NEE"}</strong></div>
        <div><span>Teddy Easter Egg</span><strong>${p.teddy_easter_found?"JA":"NEE"}</strong></div>
        <div><span>Platform</span><strong>${esc(p.platform||"ONBEKEND")}</strong></div>
        <div><span>Audio</span><strong>${esc(p.audio_mode||"ONBEKEND")}</strong></div>
        <div><span>Versie</span><strong>${esc(p.last_version||"ONBEKEND")}</strong></div>
        <div><span>Café posts</span><strong>${n(p.cafe_posts)}</strong></div>
        <div><span>Café likes</span><strong>${n(p.cafe_likes)}</strong></div>
        <div class="playerDeleteRow">
          <button class="dangerBtn" data-delete-player="${esc(p.device_id)}" data-player-name="${esc(p.player_name||"SPELER")}">🗑️ VERWIJDER SPELER</button>
        </div>
      </div>
    </details>
  `).join(""):"<div class='small emptyBox'>Geen spelers gevonden.</div>";
  playerList.querySelectorAll("[data-delete-player]").forEach(btn=>{
    btn.addEventListener("click",async e=>{
      e.preventDefault();
      e.stopPropagation();

      const deviceId=btn.dataset.deletePlayer;
      const playerName=btn.dataset.playerName||"SPELER";
      if(!deviceId)return;

      const short=String(deviceId).slice(0,8);
      const ok=confirm(
        `Weet je zeker dat je ${playerName} (#${short}) wilt verwijderen?\n\n`+
        `Dit verwijdert het spelerprofiel én alle gekoppelde analytics-events. `+
        `Highscores en Café-berichten blijven behouden.`
      );
      if(!ok)return;

      btn.disabled=true;
      const original=btn.textContent;
      btn.textContent="VERWIJDEREN…";
      try{
        const result=await rpc("admin_delete_player",{
          p_device_id:deviceId,
          p_admin_code:activeAdminCode
        });
        if(result!==true)throw new Error("delete returned false");
        await refreshAll();
      }catch(err){
        console.error(err);
        alert("Verwijderen is mislukt. Controleer of de v2.21.1 SQL-migratie is uitgevoerd.");
        btn.disabled=false;
        btn.textContent=original;
      }
    });
  });

}

function renderLevels(list){
  levelAnalytics.innerHTML=(list||[]).length?(list||[]).map(x=>{
    const starts=n(x.starts),done=n(x.completes),deaths=n(x.deaths);
    const pct=starts?Math.round(done/starts*100):0;
    return `<div class="analyticsRow">
      <strong>LEVEL ${n(x.level)}</strong>
      <span>${starts} starts</span><span>${done} klaar</span><span>${deaths} deaths</span><b>${pct}%</b>
    </div>`;
  }).join(""):"<div class='small emptyBox'>Nog geen level-events geregistreerd. Speel v2.21.1 om deze data te vullen.</div>";
}

function renderBonuses(list){
  bonusAnalytics.innerHTML=(list||[]).length?(list||[]).map(x=>{
    const spawned=n(x.spawned),collected=n(x.collected);
    const pct=spawned?Math.round(collected/spawned*100):0;
    return `<div class="analyticsRow"><strong>${esc((x.bonus_type||"").toUpperCase())}</strong><span>${spawned} verschenen</span><span>${collected} gepakt</span><b>${pct}%</b></div>`;
  }).join(""):"<div class='small emptyBox'>Nog geen bonus-events geregistreerd.</div>";
}

function renderBreakdown(el,list,key){
  el.innerHTML=(list||[]).length?(list||[]).map(x=>`
    <div class="row"><span>${esc(String(x[key]||"ONBEKEND").toUpperCase())}</span><strong>${n(x.players)}</strong></div>
  `).join(""):"<div class='small'>Nog geen data.</div>";
}


function renderTeddyDiscoveries(encounters,easters){
  const render=(el,list,empty)=>{
    el.innerHTML=(list||[]).length?(list||[]).map(p=>`
      <div class="discoveryRow">
        <strong>${esc(p.player_name||"SPELER")}</strong>
        <span>#${esc(shortId(p.device_id))}</span>
        <small>${date(p.found_at)}</small>
      </div>
    `).join(""):`<div class="small emptyBox">${empty}</div>`;
  };
  render(teddyEncounterList,encounters,"Nog niemand heeft Teddy tijdens het spel bereikt.");
  render(teddyEasterList,easters,"Nog niemand heeft het verborgen Teddy Easter egg gevonden.");
}

function playerNameForDevice(deviceId){
  const id=String(deviceId||"");
  if(!id)return "ONBEKEND";

  const player=dashboardPlayers.find(p=>String(p.device_id||"")===id);
  const name=String(player?.player_name||"").trim();

  // Prefer the human-readable player name; only fall back to the device code
  // for legacy/orphaned events where no player profile can be matched.
  return name||`#${shortId(id)}`;
}

function renderEvents(list){
  const labels={
    game_start:"🎮 START",game_over:"🏁 GAME OVER",level_start:"🚪 LEVEL START",
    level_complete:"✅ LEVEL KLAAR",death:"💀 DEATH",bonus_spawn:"🎁 BONUS",
    bonus_collect:"✨ BONUS GEPAKT",teddy_found:"🐈 TEDDY",teddy_encounter:"🐈 TEDDY ENCOUNTER",teddy_easter:"🥚 TEDDY EASTER"
  };
  recentEvents.innerHTML=(list||[]).length?(list||[]).slice(0,80).map(e=>`
    <div class="eventRow">
      <span>${labels[e.event_type]||esc(e.event_type)}</span>
      <strong>${esc(playerNameForDevice(e.device_id))}</strong>
      <span>Lv${n(e.level)||"-"}</span>
      <span>${e.bonus_type?esc(e.bonus_type):""}</span>
      <small>${date(e.created_at)}</small>
    </div>
  `).join(""):"<div class='small emptyBox'>Nog geen v2.21.1-events.</div>";
}

function renderPosts(list){
  posts.innerHTML=list.length?list.map(p=>`
    <article class="post">
      <div class="postHeader"><strong>${esc(p.name)}</strong><span>${date(p.created_at)}</span></div>
      <div class="small">${esc(p.type)} · ${n(p.likes)} likes</div>
      <div class="postMsg">${esc(p.message)}</div>
      <div class="actions"><button data-delete="${n(p.id)}">🗑️ VERWIJDER</button></div>
    </article>
  `).join(""):"<div class='small'>Geen berichten.</div>";

  posts.querySelectorAll("[data-delete]").forEach(btn=>{
    btn.addEventListener("click",async()=>{
      const id=n(btn.dataset.delete);
      if(!confirm("Weet je zeker dat je dit bericht wilt verwijderen?"))return;
      btn.disabled=true;
      try{
        const ok=await rpc("admin_delete_community_post",{p_post_id:id,p_admin_code:activeAdminCode});
        if(ok!==true)throw new Error("delete false");
        cafeStatus.textContent="Bericht verwijderd.";
        await refreshAll();
      }catch(err){
        console.error(err);cafeStatus.textContent="Verwijderen mislukt.";
      }finally{btn.disabled=false}
    });
  });
}

async function refreshAll(){
  sbStatus.textContent="CONTROLEREN…";
  refreshBtn.disabled=true;
  try{
    if(!(await verify(activeAdminCode)))throw new Error("admin");
    const [stats,dash,community]=await Promise.all([
      rpc("get_public_stats",{}),
      rpc("admin_get_player_dashboard",{p_admin_code:activeAdminCode}),
      rpc("admin_get_community_posts",{p_admin_code:activeAdminCode})
    ]);
    const t=stats?.totals||{}, activity=dash?.activity||{};
    const communityList=Array.isArray(community)?community:[];

    sbStatus.textContent="🟢 VERBONDEN";
    setMetric("players",n(t.players));
    setMetric("active24",n(activity.active_24h));
    setMetric("active7",n(activity.active_7d));
    setMetric("new7",n(activity.new_7d));
    setMetric("games",n(t.games_played));
    setMetric("apples",n(t.apples_defeated));
    setMetric("deaths",n(t.deaths));
    setMetric("teddy",n(t.teddy_finders));
    setMetric("postCount",communityList.length);
    setMetric("gamesPerPlayer",n(t.players)?(n(t.games_played)/n(t.players)).toFixed(1):"0.0");
    setMetric("applesPerGame",n(t.games_played)?(n(t.apples_defeated)/n(t.games_played)).toFixed(1):"0.0");
    setMetric("lastRefresh",new Date().toLocaleTimeString("nl-NL"));

    renderPlayers(dash?.players||[]);
    renderLevels(dash?.levels||[]);
    renderBonuses(dash?.bonuses||[]);
    renderTeddyDiscoveries(dash?.teddy_encounter_finders||[],dash?.teddy_easter_finders||[]);
    renderBreakdown(platformAnalytics,dash?.platforms||[],"platform");
    renderBreakdown(audioAnalytics,dash?.audio_modes||[],"audio_mode");
    renderEvents(dash?.recent_events||[]);
    renderPosts(communityList);
  }catch(err){
    console.error(err);
    sbStatus.textContent="🔴 FOUT";
    cafeStatus.textContent="Kon beheerdata niet laden.";
  }finally{refreshBtn.disabled=false}
}

loginBtn.addEventListener("click",login);
adminCode.addEventListener("keydown",e=>{if(e.key==="Enter")login()});
refreshBtn.addEventListener("click",refreshAll);
playerSearch.addEventListener("input",()=>renderPlayers(dashboardPlayers));
openGameBtn.addEventListener("click",()=>location.href="./index.html");
logoutBtn.addEventListener("click",()=>{
  sessionStorage.removeItem("stampertjesAdminPortalCode");activeAdminCode="";
  portal.classList.add("hidden");loginCard.classList.remove("hidden");
  adminCode.value="";loginStatus.textContent="Uitgelogd.";
});

(async()=>{
  const raw=window.STAMPERTJES_CONFIG?.version||"2.21.1";
  const version=$("portalVersion");
  if(version)version.textContent="v"+raw.replace("-beta"," Beta ");
  if(activeAdminCode){
    try{
      if(await verify(activeAdminCode)){
        loginCard.classList.add("hidden");portal.classList.remove("hidden");await refreshAll();
      }else sessionStorage.removeItem("stampertjesAdminPortalCode");
    }catch(err){console.warn(err)}
  }
})();