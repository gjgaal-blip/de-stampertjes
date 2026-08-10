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
        alert("Verwijderen is mislukt. Controleer of de v2.22 SQL-migratie is uitgevoerd.");
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
  }).join(""):"<div class='small emptyBox'>Nog geen level-events geregistreerd. Speel v2.22 om deze data te vullen.</div>";
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
  `).join(""):"<div class='small emptyBox'>Nog geen v2.22-events.</div>";
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
  const raw=window.STAMPERTJES_CONFIG?.version||"2.22";
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
async function loadV222Analytics(){
  const el=document.getElementById("v222Analytics"); if(!el)return;
  try{
    const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_v222_analytics`,{method:"POST",headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json"},body:"{}"});
    if(!r.ok)throw new Error(String(r.status));
    const d=await r.json();
    const countries=Object.entries(d.countries||{}).map(([k,v])=>`${k}: ${v}`).join(" · ")||"nog geen landen vastgelegd";
    el.innerHTML=`<div class="statRow"><span>Nieuwe metric-events</span><b>${Number(d.total_metric_events||0).toLocaleString("nl-NL")}</b></div><div class="statRow"><span>Gemeten speeltijd</span><b>${Math.round(Number(d.total_play_seconds||0)/60)} min</b></div><div class="statRow"><span>Landen</span><b>${countries}</b></div>`;
  }catch(e){el.textContent="v2.22 analytics nog niet beschikbaar — controleer SQL 007.";}
}
loadV222Analytics();

const V222_LEGACY_HTML="\n<div class=\"wrap\">\n  <h1>\ud83c\udf4f GJ STUDIOS</h1>\n  <div class=\"small\">De Stampertjes Developer Portal \u00b7 <span id=\"portalVersion\">v2.22</span></div>\n\n  <section id=\"loginCard\" class=\"card\">\n    <h2>\ud83d\udd10 Beheerlogin</h2>\n    <input id=\"adminCode\" type=\"password\" autocomplete=\"current-password\" placeholder=\"Beheercode\" style=\"width:100%\">\n    <button id=\"loginBtn\" style=\"width:100%;margin-top:8px\">INLOGGEN</button>\n    <div id=\"loginStatus\" class=\"small\" style=\"margin-top:8px\"></div>\n  </section>\n\n  <section id=\"portal\" class=\"hidden\">\n    <div class=\"card\">\n      <h2>\ud83d\udcca Live status</h2>\n      <div class=\"row\"><span>Supabase</span><strong id=\"sbStatus\">-</strong></div>\n      <div class=\"metricGrid\">\n        <div class=\"metric\"><span>\ud83d\udc65 SPELERS</span><strong id=\"players\">-</strong></div>\n        <div class=\"metric\"><span>\ud83d\udfe2 ACTIEF 24U</span><strong id=\"active24\">-</strong></div>\n        <div class=\"metric\"><span>\ud83d\udcc5 ACTIEF 7D</span><strong id=\"active7\">-</strong></div>\n        <div class=\"metric\"><span>\u2728 NIEUW 7D</span><strong id=\"new7\">-</strong></div>\n        <div class=\"metric\"><span>\ud83c\udfae POTJES</span><strong id=\"games\">-</strong></div>\n        <div class=\"metric\"><span>\ud83d\udc7e APPELIETEN</span><strong id=\"apples\">-</strong></div>\n        <div class=\"metric\"><span>\ud83d\udc80 DEATHS</span><strong id=\"deaths\">-</strong></div>\n        <div class=\"metric\"><span>\ud83d\udc08 TEDDY</span><strong id=\"teddy\">-</strong></div>\n        <div class=\"metric\"><span>\ud83d\udcac CAF\u00c9</span><strong id=\"postCount\">-</strong></div>\n      </div>\n      <div class=\"row\"><span>Potjes / speler</span><strong id=\"gamesPerPlayer\">-</strong></div>\n      <div class=\"row\"><span>Appelieten / potje</span><strong id=\"applesPerGame\">-</strong></div>\n      <div class=\"row\"><span>Laatste refresh</span><strong id=\"lastRefresh\">-</strong></div>\n      <button id=\"refreshBtn\" style=\"width:100%;margin-top:10px\">VERVERS DASHBOARD</button>\n    </div>\n\n    <div class=\"card\">\n      <h2>\ud83d\udc65 Spelers</h2>\n      <input id=\"playerSearch\" type=\"search\" placeholder=\"Zoek naam of speler-ID\" style=\"width:100%;margin-bottom:10px\">\n      <div id=\"playerList\"></div>\n    </div>\n\n    <div class=\"card\">\n      <h2>\ud83c\udff0 Levels</h2>\n      <div class=\"small\">Starts \u00b7 voltooid \u00b7 deaths \u00b7 voltooiingspercentage</div>\n      <div id=\"levelAnalytics\"></div>\n    </div>\n\n    <div class=\"card\">\n      <h2>\ud83c\udf81 Bonusvoorwerpen</h2>\n      <div id=\"bonusAnalytics\"></div>\n    </div>\n\n    <div class=\"card\">\n      <h2>\ud83d\udcf1 Platform & audio</h2>\n      <h3>Platform</h3>\n      <div id=\"platformAnalytics\"></div>\n      <h3>Geluid</h3>\n      <div id=\"audioAnalytics\"></div>\n    </div>\n\n    <div class=\"card\">\n      <h2>\ud83d\udc08 Teddy ontdekkingen</h2>\n      <div class=\"teddyDiscoveryGrid\">\n        <div>\n          <h3>\ud83c\udfae Teddy Encounter \u00b7 +2000</h3>\n          <div id=\"teddyEncounterList\" class=\"discoveryList\"></div>\n        </div>\n        <div>\n          <h3>\ud83e\udd5a Verborgen Easter Egg \u00b7 +1000</h3>\n          <div id=\"teddyEasterList\" class=\"discoveryList\"></div>\n        </div>\n      </div>\n    </div>\n\n    <div class=\"card\">\n      <h2>\ud83d\udd52 Recente activiteit</h2><div class=\"small\">Spelersnaam wordt getoond; device-ID blijft alleen achter de schermen als technische koppeling.</div>\n      <div id=\"recentEvents\"></div>\n    </div>\n\n    <div class=\"card\">\n      <h2>\ud83d\udcac Caf\u00e9 beheer</h2>\n      <div id=\"cafeStatus\" class=\"small\"></div>\n      <div id=\"posts\"></div>\n    </div>\n\n    <div class=\"card\">\n      <h2>\u2699\ufe0f Beheer</h2>\n      <div class=\"grid\">\n        <button id=\"openGameBtn\">\ud83c\udfae OPEN SPEL</button>\n        <button id=\"logoutBtn\">\ud83d\udeaa UITLOGGEN</button>\n      </div>\n    </div>\n  </section>\n</div>\n\n<script src=\"config.js?v=222\"></script>\n<script src=\"admin.js?v=222\" defer></script>\n\n<section class=\"panel\"><h2>\ud83d\udcca v2.22 Kasteelarchief</h2><div id=\"v222Analytics\">Nieuwe analytics worden geladen\u2026</div></section>";

(function(){
  const $=id=>document.getElementById(id);
  const tabs=[...document.querySelectorAll("#portalTabs [data-tab]")];
  const panels=[...document.querySelectorAll("[data-panel]")];
  tabs.forEach(btn=>btn.addEventListener("click",()=>{
    tabs.forEach(x=>x.classList.toggle("active",x===btn));
    panels.forEach(p=>p.classList.toggle("active",p.dataset.panel===btn.dataset.tab));
  }));

  // Keep all previous admin functionality available under System.
  const legacy=$("legacyMount");
  if(legacy && typeof V222_LEGACY_HTML==="string") legacy.innerHTML=V222_LEGACY_HTML;

  function fmt(n){return Number(n||0).toLocaleString("nl-NL")}
  function duration(sec){
    sec=Number(sec||0); if(!sec)return "0m";
    const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60);
    return h?`${h}u ${m}m`:`${m}m`;
  }
  async function rpc(name,body={}){
    const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{
      method:"POST",headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify(body)
    });
    if(!r.ok)throw new Error(`${name}: ${r.status}`);
    return r.json();
  }
  function cards(target,items){
    const el=$(target); if(!el)return;
    el.innerHTML=items.map(([icon,title,value,sub])=>`<article class="metricCard"><span>${icon}</span><h3>${title}</h3><b>${value}</b><small>${sub||""}</small></article>`).join("");
  }
  async function refreshV222Portal(){
    try{
      const [pub,analytics,hall]=await Promise.all([
        rpc("get_public_stats"),
        rpc("get_v222_analytics"),
        rpc("get_hall_of_fame",{p_device_id:null})
      ]);
      $("systemSupabase").textContent="● VERBONDEN";
      $("dashHealth").innerHTML="<b>🟢 Supabase verbonden</b><br><small>Live functies reageren.</small>";
      $("dashPlayers").textContent=fmt(pub?.players);
      $("dashGames").textContent=fmt(pub?.games);
      $("dashApples").textContent=fmt(pub?.apples);
      $("dashTeddy").textContent=fmt(pub?.teddy);
      $("dashPlaytime").textContent=duration(analytics?.total_play_seconds);
      $("systemEvents").textContent=fmt(analytics?.total_metric_events);
      const champ=hall?.podium?.[0];
      $("dashHighscore").textContent=champ?fmt(champ.value):"—";
      const countries=Object.entries(analytics?.countries||{});
      $("dashCountries").innerHTML=countries.length?countries.map(([k,v])=>`<div class="miniRow"><b>${k}</b><span>${v}</span></div>`).join(""):"Nog geen land/regio geregistreerd.";

      const starts=analytics?.level_starts||{}, completes=analytics?.level_completions||{};
      const levels=[1,2,3,4,5].map(l=>{
        const s=Number(starts[l]||0),c=Number(completes[l]||0),pct=s?Math.round(c/s*100):0;
        return ["🏰",`Level ${l}`,`${c}/${s}`,s?`${pct}% voltooid`:"nog geen data"];
      });
      cards("levelsDashboard",levels);
      cards("gameplayDashboard",[
        ["🎮","Potjes",fmt(pub?.games),"totaal"],
        ["🍎","Appelieten",fmt(pub?.apples),"verslagen"],
        ["💀","Deaths",fmt(pub?.deaths),"totaal"],
        ["⏱️","Speeltijd",duration(analytics?.total_play_seconds),"vanaf v2.22"]
      ]);
      const teddy=hall?.leaderboards?.teddy||[];
      cards("teddyDashboard",[
        ["🐈","Ontmoetingen",fmt(pub?.teddy),"geregistreerd"],
        ["🐾","Top vinder",teddy[0]?.player_name||"—",teddy[0]?`${teddy[0].value} keer`:""],
        ["🥚","Eerste Easter Egg",hall?.firsts?.teddy_easter?.player_name||"—","geheimenjager"]
      ]);
      const bonus=hall?.leaderboards?.bonus||[];
      cards("bonusDashboard",[
        ["🎁","Top bonusjager",bonus[0]?.player_name||"—",bonus[0]?`${bonus[0].value} gepakt`:""],
        ["📊","Tracking","ACTIEF","spawn/collect vanaf v2.22"]
      ]);
      $("recordsDashboard").innerHTML=(hall?.podium||[]).map((x,i)=>`<div class="recordAdminRow"><span>${["🥇","🥈","🥉"][i]||i+1}</span><b>${x.player_name}</b><strong>${fmt(x.value)}</strong></div>`).join("")||"Nog geen records.";
      $("dashRecent").textContent="Gebruik het bestaande activiteitenoverzicht onder Systeem voor de volledige live eventfeed.";
      $("dashTrend").innerHTML="📈 Vanaf v2.22 bouwen we historische level- en speeltijddata op.<br><small>Dag/weekgrafieken kunnen hierna zonder nieuwe tracking worden toegevoegd.</small>";
    }catch(e){
      console.error(e);
      if($("systemSupabase"))$("systemSupabase").textContent="⚠ CONTROLEER SQL";
      if($("dashHealth"))$("dashHealth").innerHTML="<b>⚠ Dashboarddata niet volledig bereikbaar.</b><br><small>Controleer SQL 006/007 en ververs.</small>";
    }
  }
  $("refreshPortalBtn")?.addEventListener("click",refreshV222Portal);
  setTimeout(refreshV222Portal,150);
})();
