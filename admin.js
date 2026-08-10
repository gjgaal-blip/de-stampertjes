const SUPABASE_URL=window.STAMPERTJES_CONFIG.supabaseUrl;
const SUPABASE_KEY=window.STAMPERTJES_CONFIG.supabaseKey;
console.info("De Stampertjes Developer Portal BUILD 2227 geladen");

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
    await refreshNewDashboard();
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
        alert("Verwijderen is mislukt. Controleer of de v2.22.7 SQL-migratie is uitgevoerd.");
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
  }).join(""):"<div class='small emptyBox'>Nog geen level-events geregistreerd. Speel v2.22.7 om deze data te vullen.</div>";
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
  `).join(""):"<div class='small emptyBox'>Nog geen v2.22.7-events.</div>";
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

loginBtn?.addEventListener("click",login);
adminCode?.addEventListener("keydown",e=>{if(e.key==="Enter")login()});
refreshBtn.addEventListener("click",async()=>{await refreshAll();await refreshNewDashboard();});
$("refreshPortalDashboardBtn")?.addEventListener("click",refreshNewDashboard);
$("addManualScoreBtn")?.addEventListener("click",openManualScoreForm);
$("saveManualScoreBtn")?.addEventListener("click",addManualScore);
$("cancelManualScoreBtn")?.addEventListener("click",closeManualScoreForm);
initDashboardTabs();
playerSearch?.addEventListener("input",()=>renderPlayers(dashboardPlayers));
openGameBtn?.addEventListener("click",()=>location.href="./index.html");
logoutBtn?.addEventListener("click",()=>{
  sessionStorage.removeItem("stampertjesAdminPortalCode");activeAdminCode="";
  portal.classList.add("hidden");loginCard.classList.remove("hidden");
  adminCode.value="";loginStatus.textContent="Uitgelogd.";
});



let adminHighscores=[];

async function loadAdminHighscores(){
  const box=document.getElementById("recordsDashboard");
  const status=document.getElementById("scoreAdminStatus");
  if(!box||!activeAdminCode)return;
  try{
    const data=await rpc("admin_get_highscores",{p_admin_code:activeAdminCode});
    adminHighscores=Array.isArray(data)?data:[];
    renderAdminHighscores();
    if(status)status.textContent=`${adminHighscores.length} scores geladen`;
  }catch(err){
    console.error("Highscorebeheer laden mislukt:",err);
    box.innerHTML="<div class='small emptyBox'>Highscorebeheer niet beschikbaar. Voer SQL 012 uit.</div>";
    if(status)status.textContent="SQL 013 vereist.";
  }
}

function renderAdminHighscores(){
  const box=document.getElementById("recordsDashboard");
  if(!box)return;
  const top=adminHighscores.slice(0,20);
  box.innerHTML=top.length?top.map((s,i)=>`
    <div class="adminScoreRow" data-score-id="${esc(s.id)}">
      <span class="adminScoreRank">${i<3?["🥇","🥈","🥉"][i]:`${i+1}.`}</span>
      <div class="adminScoreMain">
        <strong>${esc(String(s.name||"SPELER").toUpperCase())}</strong>
        <small>Lv${n(s.level)||1} · ${date(s.created_at)} ${s.is_manual?'<b class="manualBadge">HANDMATIG</b>':""}</small>
      </div>
      <b>${n(s.score).toLocaleString("nl-NL")}</b>
      <div class="adminScoreActions">
        <button type="button" data-edit-score="${esc(s.id)}">✏️</button>
        <button type="button" data-delete-score="${esc(s.id)}">🗑️</button>
      </div>
    </div>
  `).join(""):"<div class='small emptyBox'>Nog geen highscores.</div>";

  box.querySelectorAll("[data-edit-score]").forEach(btn=>btn.addEventListener("click",()=>editAdminScore(btn.dataset.editScore)));
  box.querySelectorAll("[data-delete-score]").forEach(btn=>btn.addEventListener("click",()=>deleteAdminScore(btn.dataset.deleteScore)));
}

async function editAdminScore(id){
  const item=adminHighscores.find(x=>String(x.id)===String(id));
  if(!item)return;
  const name=prompt("Spelersnaam:",item.name||"SPELER");
  if(name===null)return;
  const scoreRaw=prompt("Score:",String(item.score||0));
  if(scoreRaw===null)return;
  const levelRaw=prompt("Level:",String(item.level||1));
  if(levelRaw===null)return;
  const score=Math.max(0,parseInt(scoreRaw,10)||0);
  const level=Math.max(1,parseInt(levelRaw,10)||1);
  try{
    await rpc("admin_update_highscore",{
      p_admin_code:activeAdminCode,
      p_id:Number(id),
      p_name:String(name).trim().slice(0,30),
      p_score:score,
      p_level:level
    });
    await loadAdminHighscores();
    await refreshNewDashboard();
  }catch(err){
    console.error(err); alert("Score aanpassen mislukt. Controleer SQL 013.");
  }
}

async function deleteAdminScore(id){
  const item=adminHighscores.find(x=>String(x.id)===String(id));
  if(!confirm(`Score van ${item?.name||"deze speler"} verwijderen?`))return;
  try{
    await rpc("admin_delete_highscore",{p_admin_code:activeAdminCode,p_id:Number(id)});
    await loadAdminHighscores();
    await refreshNewDashboard();
  }catch(err){
    console.error(err); alert("Score verwijderen mislukt. Controleer SQL 013.");
  }
}

function openManualScoreForm(){
  const form=document.getElementById("manualScoreForm");
  if(!form)return;
  const now=new Date();
  const localDate=new Date(now.getTime()-now.getTimezoneOffset()*60000);
  document.getElementById("manualScoreDate").value=localDate.toISOString().slice(0,10);
  document.getElementById("manualScoreTime").value=localDate.toISOString().slice(11,16);
  form.classList.remove("hidden");
  document.getElementById("manualScoreName")?.focus();
}
function closeManualScoreForm(){document.getElementById("manualScoreForm")?.classList.add("hidden");}
async function addManualScore(){
  const name=String(document.getElementById("manualScoreName")?.value||"").trim();
  const score=Math.max(0,parseInt(document.getElementById("manualScoreValue")?.value||"0",10)||0);
  const level=Math.max(1,parseInt(document.getElementById("manualScoreLevel")?.value||"1",10)||1);
  const dateValue=document.getElementById("manualScoreDate")?.value||"";
  const timeValue=document.getElementById("manualScoreTime")?.value||"";
  if(!name||score<=0||!dateValue||!timeValue){alert("Vul naam, score, level, datum en tijd in.");return;}
  const localDate=new Date(`${dateValue}T${timeValue}:00`);
  if(Number.isNaN(localDate.getTime())){alert("Datum of tijd is niet geldig.");return;}
  try{
    await rpc("admin_add_highscore",{p_admin_code:activeAdminCode,p_name:name.slice(0,30),p_score:score,p_level:level,p_created_at:localDate.toISOString()});
    closeManualScoreForm();await loadAdminHighscores();await refreshNewDashboard();
  }catch(err){console.error(err);alert("Handmatige score toevoegen mislukt. Controleer SQL 013.");}
}

function fmtDash(v){return Number(v||0).toLocaleString("nl-NL")}
function fmtDuration(sec){
  sec=Number(sec||0);
  if(!sec)return "0m";
  const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60);
  return h?`${h}u ${m}m`:`${m}m`;
}
function dashboardCards(target,items){
  const el=$(target); if(!el)return;
  el.innerHTML=items.map(([icon,title,value,sub])=>`
    <article class="metricCard">
      <span>${icon}</span><h3>${esc(title)}</h3><b>${esc(value)}</b><small>${esc(sub||"")}</small>
    </article>`).join("");
}
function initDashboardTabs(){
  const tabs=[...document.querySelectorAll("#portalTabs [data-tab]")];
  const panels=[...document.querySelectorAll("[data-dash-panel]")];
  tabs.forEach(btn=>btn.addEventListener("click",()=>{
    tabs.forEach(x=>x.classList.toggle("active",x===btn));
    panels.forEach(p=>p.classList.toggle("active",p.dataset.dashPanel===btn.dataset.tab));
  }));
}
async function refreshNewDashboard(){
  if(!activeAdminCode)return;
  const health=$("dashHealth");
  try{
    if(!(await verify(activeAdminCode)))throw new Error("admin verification failed");

    const [stats,analytics,hall,dash]=await Promise.all([
      rpc("get_public_stats",{}),
      rpc("get_v222_analytics",{}),
      rpc("get_hall_of_fame",{p_device_id:null}),
      rpc("admin_get_player_dashboard",{p_admin_code:activeAdminCode})
    ]);

    const t=stats?.totals||{};
    const activity=dash?.activity||{};
    setMetric("dashPlayers",fmtDash(t.players));
    setMetric("dashGames",fmtDash(t.games_played));
    setMetric("dashApples",fmtDash(t.apples_defeated));
    setMetric("dashTeddy",fmtDash(t.teddy_finders));
    setMetric("dashPlaytime",fmtDuration(analytics?.total_play_seconds));

    const champ=Array.isArray(hall?.podium)&&hall.podium.length?hall.podium[0]:null;
    setMetric("dashHighscore",champ?fmtDash(champ.value):"—");
    setMetric("dashMetricEvents",fmtDash(analytics?.total_metric_events));

    if(health)health.innerHTML="<b>🟢 SUPABASE VERBONDEN</b><br><small>Admin- en analyticsfuncties reageren.</small>";
    const act=$("dashActivity");
    if(act)act.innerHTML=`<div class="miniRow"><span>Actief 24u</span><b>${fmtDash(activity.active_24h)}</b></div>
      <div class="miniRow"><span>Actief 7d</span><b>${fmtDash(activity.active_7d)}</b></div>
      <div class="miniRow"><span>Nieuw 7d</span><b>${fmtDash(activity.new_7d)}</b></div>`;

    const countries=Object.entries(analytics?.countries||{});
    const ce=$("dashCountries");
    if(ce)ce.innerHTML=countries.length
      ?countries.map(([k,v])=>`<div class="miniRow"><span>${esc(k)}</span><b>${fmtDash(v)}</b></div>`).join("")
      :"Nog geen land/regio geregistreerd.";

    dashboardCards("gameplayDashboard",[
      ["🎮","Potjes",fmtDash(t.games_played),"totaal"],
      ["🍎","Appelieten",fmtDash(t.apples_defeated),"verslagen"],
      ["💀","Deaths",fmtDash(t.deaths),"totaal"],
      ["⏱️","Speeltijd",fmtDuration(analytics?.total_play_seconds),"vanaf v2.22"]
    ]);

    const starts=analytics?.level_starts||{}, completes=analytics?.level_completions||{};
    dashboardCards("levelsDashboard",[1,2,3,4,5].map(l=>{
      const s=Number(starts[String(l)]||starts[l]||0),c=Number(completes[String(l)]||completes[l]||0);
      return ["🏰",`Level ${l}`,`${c}/${s}`,s?`${Math.round(c/s*100)}% voltooid`:"nog geen v2.22-data"];
    }));

    // Volledig highscorebeheer wordt apart geladen via SQL 012.
    await loadAdminHighscores();

    const teddyList=hall?.leaderboards?.teddy||[];
    dashboardCards("teddyDashboard",[
      ["🐈","Teddy-vinders",fmtDash(t.teddy_finders),"unieke spelers"],
      ["🐾","Top vinder",teddyList[0]?.player_name||"—",teddyList[0]?`${fmtDash(teddyList[0].value)} encounters`:""],
      ["🥚","Eerste Easter Egg",hall?.firsts?.teddy_easter?.player_name||"—","geheimenjager"]
    ]);

    // Merch is optional: SQL 008 may not have been executed yet.
    try{
      const merch=await rpc("admin_get_merch_summary",{p_key:activeAdminCode});
      setMetric("merchInterestCount",fmtDash(merch?.interested));
      setMetric("merchPersonalized",`${fmtDash(merch?.personalized)} geïnteresseerd in personalisatie`);
      const sizes=Object.entries(merch?.sizes||{});
      const designs=Object.entries(merch?.designs||{});
      setMetric("merchSizes",sizes.length?sizes.map(([k,v])=>`${k}: ${v}`).join(" · "):"nog geen maten");
      const merchBox=document.getElementById("merchPersonalized");
      if(merchBox){
        const pers=`${fmtDash(merch?.personalized)} geïnteresseerd in personalisatie`;
        const des=designs.length?` · ${designs.map(([k,v])=>`${k.toUpperCase()}: ${v}`).join(" · ")}`:"";
        merchBox.textContent=pers+des;
      }
    }catch(_){
      setMetric("merchInterestCount","—");
      setMetric("merchPersonalized","SQL 008 nog niet actief");
      setMetric("merchSizes","—");
    }
    try{const downloads=await rpc("get_wallpaper_download_counts",{});const el=document.getElementById("adminWallpaperCounts");if(el){const labels={kasteel_nacht:"KASTEEL IN DE NACHT",entreehal:"ENTREEHAL",kasteel_banner:"KASTEELBANNER",vera_bug_tester:"VERA · BUG TESTER"};el.innerHTML=Object.entries(labels).map(([key,label])=>`<div class="miniRow"><span>${label}</span><b>${fmtDash(downloads?.[key]||0)}</b></div>`).join("");}}catch(_){const el=document.getElementById("adminWallpaperCounts");if(el)el.textContent="SQL 011 nog niet actief.";}
  }catch(err){
    console.error("Nieuw dashboard laden mislukt:",err);
    if(health)health.innerHTML="<b>🔴 DASHBOARD FOUT</b><br><small>Controleer SQL 006/007 en de admin-login.</small>";
  }
}
(async()=>{
  const raw=window.STAMPERTJES_CONFIG?.version||"2.22.7";
  const version=$("portalVersion");
  if(version)version.textContent="v"+raw.replace("-beta"," Beta ");
  if(activeAdminCode){
    try{
      if(await verify(activeAdminCode)){
        loginCard.classList.add("hidden");portal.classList.remove("hidden");await refreshAll();await refreshNewDashboard();
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
  }catch(e){el.textContent="v2.22.7 analytics nog niet beschikbaar — controleer SQL 007.";}
}
loadV222Analytics();

document.documentElement.dataset.adminBuild="2227";
const buildMark=document.getElementById("loginStatus");
if(buildMark && !sessionStorage.getItem("stampertjesAdminPortalCode")){
  buildMark.textContent="Portal build 2222 geladen · klaar om in te loggen.";
}
