const c=document.getElementById('game'),ctx=c.getContext('2d');
const overlay=document.getElementById("overlay");
const musicToggle=document.getElementById("musicToggle");
const menuMusicIcon=document.getElementById("menuMusicIcon");
const startBtn=document.getElementById("startBtn");
const introCanvas=document.getElementById("introCanvas");
const ictx=introCanvas.getContext("2d");
ictx.imageSmoothingEnabled=false;
const highscoreEntry=document.getElementById("highscoreEntry");
const nameInput=document.getElementById("nameInput");
const saveScoreBtn=document.getElementById("saveScoreBtn");
const scoreList=document.getElementById("scoreList");
const introText=document.getElementById("introText");
const mainMenu=document.getElementById("mainMenu");
const scoresSection=document.getElementById("scoresSection");
const helpSection=document.getElementById("helpSection");
const historySection=document.getElementById("historySection");
const playMenuBtn=document.getElementById("playMenuBtn");
const scoresMenuBtn=document.getElementById("scoresMenuBtn");
const statsMenuBtn=document.getElementById("statsMenuBtn");
const statsSection=document.getElementById("statsSection");
const statsList=document.getElementById("statsList");
const resetStatsBtn=document.getElementById("resetStatsBtn");
const onlineStatsStatus=document.getElementById("onlineStatsStatus");
const onlineStatsList=document.getElementById("onlineStatsList");
const onlineStatsLeaders=document.getElementById("onlineStatsLeaders");
const helpMenuBtn=document.getElementById("helpMenuBtn");
const historyMenuBtn=document.getElementById("historyMenuBtn");
const newsMenuBtn=document.getElementById("newsMenuBtn");
const roadmapSection=document.getElementById("roadmapSection");
const chroniclePage=document.getElementById("chroniclePage");
const chroniclePageContent=document.getElementById("chroniclePageContent");
const chroniclePrev=document.getElementById("chroniclePrev");
const chronicleNext=document.getElementById("chronicleNext");
const chroniclePageNumber=document.getElementById("chroniclePageNumber");

const hallMenuBtn=document.getElementById("hallMenuBtn");
const hallSection=document.getElementById("hallSection");
const hallChampion=document.getElementById("hallChampion");
const hallChampionScore=document.getElementById("hallChampionScore");
const hallHighestLevel=document.getElementById("hallHighestLevel");
const hallTeddyFinders=document.getElementById("hallTeddyFinders");
const hallStatus=document.getElementById("hallStatus");

const cafeMenuBtn=document.getElementById("cafeMenuBtn");
const cafeSection=document.getElementById("cafeSection");
const cafeName=document.getElementById("cafeName");
const cafeType=document.getElementById("cafeType");
const cafeMessage=document.getElementById("cafeMessage");
const cafeCounter=document.getElementById("cafeCounter");
const cafeSubmitBtn=document.getElementById("cafeSubmitBtn");
const cafeStatus=document.getElementById("cafeStatus");
const cafeAdminStatus=document.getElementById("cafeAdminStatus");
const cafeCancelEditBtn=document.getElementById("cafeCancelEditBtn");
const cafePosts=document.getElementById("cafePosts");
const cafeTotalCount=document.getElementById("cafeTotalCount");
const cafeIdeaCount=document.getElementById("cafeIdeaCount");
const cafeBugCount=document.getElementById("cafeBugCount");
const cafeHighscoreCount=document.getElementById("cafeHighscoreCount");
const updateOverlay=document.getElementById("updateOverlay");
const closeUpdateBtn=document.getElementById("closeUpdateBtn");
const gameTitle=document.getElementById("gameTitle");
const versionLabel=document.getElementById("versionLabel");
const studioLine=document.getElementById("studioLine");
const teddyEgg=document.getElementById("teddyEgg");
const attractPrompt=document.getElementById("attractPrompt");
const levelOverlay=document.getElementById("levelOverlay");
const levelTitle=document.getElementById("levelTitle");
const levelSubtitle=document.getElementById("levelSubtitle");
let levelTransitioning=false;

function showLevelTransition(completedLevel,nextLevel){
  if(musicOn&&!menuSoundtrack.paused)menuSoundtrack.volume=.06;
  levelTransitioning=true;
  state="transition";
  document.body.classList.remove("gameplayActive");
  levelTitle.textContent=`LEVEL ${completedLevel} VOLTOOID`;
  levelSubtitle.textContent=`NIEUWE ZAAL — LEVEL ${nextLevel}`;
  levelOverlay.classList.remove("hidden");

  setTimeout(()=>{
    levelTitle.textContent=`LEVEL ${nextLevel}`;
    levelSubtitle.textContent="MAAK JE KLAAR!";
  },900);

  setTimeout(()=>{
    levelOverlay.classList.add("hidden");
    levelTransitioning=false;
    state="play";
    spawnLevel();
    if(musicOn){
      if(menuSoundtrack.paused)startMusic();
      else applyMusicVolume();
    }
    document.body.classList.add("gameplayActive");
  },1900);
}

let introFrame=0;
let pendingScore=0;

const SUPABASE_URL=window.STAMPERTJES_CONFIG.supabaseUrl;
const SUPABASE_KEY=window.STAMPERTJES_CONFIG.supabaseKey;
let onlineScores=[];

function getLocalHighscores(){
  try{
    const data=JSON.parse(localStorage.getItem("stampertjesHighscores")||"[]");
    return Array.isArray(data)?data:[];
  }catch{return []}
}
function saveLocalHighscores(scores){
  localStorage.setItem("stampertjesHighscores",JSON.stringify(scores));
}
function normalizeScores(rows){
  return (rows||[])
    .map(row=>({
      name:String(row.name||"SPELER").toUpperCase().slice(0,10),
      score:Number(row.score)||0,
      level:Number(row.level)||1,
      created_at:row.created_at||null
    }))
    .sort((a,b)=>{
      if(b.score!==a.score)return b.score-a.score;
      return String(a.created_at||"").localeCompare(String(b.created_at||""));
    })
    .slice(0,10);
}
async function loadHallOfFame(){
  hallStatus.textContent="Live gegevens worden uit het kasteel opgehaald…";
  try{
    const [scoreResponse,statsResponse]=await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/highscores?select=name,score,level,created_at&order=score.desc&limit=1`,{
        headers:{
          "apikey":SUPABASE_KEY,
          "Authorization":`Bearer ${SUPABASE_KEY}`
        }
      }),
      fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_stats`,{
        method:"POST",
        headers:{
          "apikey":SUPABASE_KEY,
          "Authorization":`Bearer ${SUPABASE_KEY}`,
          "Content-Type":"application/json"
        },
        body:"{}"
      })
    ]);

    if(!scoreResponse.ok)throw new Error(`Scores ${scoreResponse.status}`);
    if(!statsResponse.ok)throw new Error(`Stats ${statsResponse.status}`);

    const scores=await scoreResponse.json();
    const stats=await statsResponse.json();
    const champion=Array.isArray(scores)&&scores.length?scores[0]:null;
    const totals=stats?.totals||{};

    hallChampion.textContent=champion?String(champion.name||"SPELER").toUpperCase():"NOG GEEN";
    hallChampionScore.textContent=champion?`${Number(champion.score)||0} punten · Lv${Number(champion.level)||1}`:"De troon is nog vrij";
    hallHighestLevel.textContent=`LEVEL ${Number(totals.highest_level)||1}`;
    hallTeddyFinders.textContent=String(Number(totals.teddy_finders)||0);
    hallStatus.textContent="Hall of Fame bijgewerkt vanuit de wereldstatistieken.";
  }catch(err){
    console.error("Hall of Fame laden mislukt:",err);
    hallChampion.textContent="NIET BEREIKBAAR";
    hallChampionScore.textContent="probeer later opnieuw";
    hallHighestLevel.textContent="—";
    hallTeddyFinders.textContent="—";
    hallStatus.textContent="Live Hall of Fame-gegevens zijn tijdelijk niet bereikbaar.";
  }
}

async function loadOnlineHighscores(){
  scoreList.innerHTML="<div>Online scores laden…</div>";
  try{
    const response=await fetch(
      `${SUPABASE_URL}/rest/v1/highscores?select=name,score,level,created_at&order=score.desc&limit=200`,
      {
        headers:{
          "apikey":SUPABASE_KEY,
          "Authorization":`Bearer ${SUPABASE_KEY}`
        }
      }
    );
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    onlineScores=normalizeScores(await response.json());
    renderHighscores();
  }catch(err){
    console.warn("Online highscores niet bereikbaar:",err);
    onlineScores=[];
    renderHighscores(true);
  }
}
async function submitOnlineScore(name,value,reachedLevel){
  const body={name,score:value,level:reachedLevel};
  const response=await fetch(`${SUPABASE_URL}/rest/v1/highscores`,{
    method:"POST",
    headers:{
      "apikey":SUPABASE_KEY,
      "Authorization":`Bearer ${SUPABASE_KEY}`,
      "Content-Type":"application/json",
      "Prefer":"return=minimal"
    },
    body:JSON.stringify(body)
  });
  if(!response.ok){
    const text=await response.text();
    throw new Error(`Score opslaan mislukt (${response.status}): ${text}`);
  }
}
function renderHighscores(useLocalFallback=false){
  const scores=(useLocalFallback ? getLocalHighscores() : onlineScores).slice(0,10);
  const medals=["🥇","🥈","🥉"];

  const rows=Array.from({length:10},(_,i)=>{
    const s=scores[i];
    const rank=i<3?medals[i]:`${i+1}.`;

    if(!s){
      return `<div class="scoreRow emptyScore">
        <span>${rank}</span>
        <span>---</span>
        <span>-----</span>
        <span>Lv-</span>
      </div>`;
    }

    const name=String(s.name||"---").toUpperCase().slice(0,10);
    const scoreText=String(s.score||0).padStart(5,"0");
    const levelText=`Lv${Number(s.level)||1}`;

    return `<div class="scoreRow">
      <span>${rank}</span>
      <span>${name}</span>
      <span>${scoreText}</span>
      <span>${levelText}</span>
    </div>`;
  });

  scoreList.innerHTML=rows.join("");
}
function qualifiesForHighscore(value){
  const scores=onlineScores;
  return value>0 && (scores.length<10 || value>scores[scores.length-1].score);
}

function updateMenuMusicIconVisibility(){
  const visible=state==="intro" &&
    !mainMenu.classList.contains("hidden") &&
    !overlay.classList.contains("hidden");
  menuMusicIcon.classList.toggle("hidden",!visible);
}

function showMainMenu(){
  document.body.classList.remove("scoreMode");
  document.body.classList.remove("gameplayActive");
  if(!attractActive){
    document.body.classList.remove("attractMode");
    attractPrompt.classList.add("hidden");
  }
  mainMenu.classList.remove("hidden");
  scoresSection.classList.add("hidden");
  helpSection.classList.add("hidden");
  historySection.classList.add("hidden");
  roadmapSection.classList.add("hidden");
  hallSection.classList.add("hidden");
  cafeSection.classList.add("hidden");
  statsSection.classList.add("hidden");
  highscoreEntry.classList.add("hidden");
  document.getElementById("highscoreBox").classList.add("hidden");
  introText.innerHTML="<strong>Het kasteel is gevallen...</strong><br>Alleen een echte Stampertjes-held kan de Appelieten nog stoppen.";
  if(musicOn&&state==="intro")startMusic();
  updateMenuMusicIconVisibility();
}
function showMenuSection(section){
  mainMenu.classList.add("hidden");
  scoresSection.classList.add("hidden");
  helpSection.classList.add("hidden");
  historySection.classList.add("hidden");
  roadmapSection.classList.add("hidden");
  hallSection.classList.add("hidden");
  cafeSection.classList.add("hidden");
  statsSection.classList.add("hidden");
  section.classList.remove("hidden");
  updateMenuMusicIconVisibility();
}
function activateButton(button,handler){
  let locked=false;
  const run=e=>{
    if(e){
      e.preventDefault();
      e.stopPropagation();
    }
    if(locked)return;
    locked=true;
    handler();
    setTimeout(()=>{locked=false},220);
  };
  button.addEventListener("click",run);
  button.addEventListener("touchend",run,{passive:false});
}

activateButton(playMenuBtn,()=>startGame());
activateButton(statsMenuBtn,async()=>{
  stopAttractMode();
  showMenuSection(statsSection);
  renderStats();
  await loadOnlineStats();
});
activateButton(resetStatsBtn,async()=>{
  localStorage.removeItem("stampertjesStats");
  const reset={...DEFAULT_STATS};
  saveStats(reset);
  renderStats();
  await loadOnlineStats();
});

activateButton(scoresMenuBtn,async()=>{
  stopAttractMode();
  document.body.classList.add("scoreMode");
  showMenuSection(scoresSection);
  await loadOnlineHighscores();
});
activateButton(helpMenuBtn,()=>{
  stopAttractMode();
  showMenuSection(helpSection);
});
activateButton(historyMenuBtn,()=>{
  stopAttractMode();
  chronicleIndex=0;
  renderChroniclePage();
  showMenuSection(historySection);
});
activateButton(newsMenuBtn,()=>{
  stopAttractMode();
  showMenuSection(roadmapSection);
});
activateButton(hallMenuBtn,async()=>{
  stopAttractMode();
  showMenuSection(hallSection);
  await loadHallOfFame();
});

activateButton(cafeMenuBtn,async()=>{
  stopAttractMode();
  showMenuSection(cafeSection);
  await loadCafePosts();
});




const DEFAULT_STATS={
  gamesPlayed:0,
  bestScore:0,
  highestLevel:1,
  applesDefeated:0,
  deaths:0,
  longestCombo:0,
  teddyFound:false,
  achievements:[]
};

let statsSyncTimer=null;

function getStats(){
  try{
    const saved=JSON.parse(localStorage.getItem("stampertjesStats")||"{}");
    return {...DEFAULT_STATS,...saved};
  }catch{
    return {...DEFAULT_STATS};
  }
}

function getStatsDeviceId(){
  let id=localStorage.getItem("stampertjesDeviceId");
  if(!id){
    if(window.crypto&&crypto.randomUUID){
      id=crypto.randomUUID();
    }else{
      id="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{
        const r=Math.random()*16|0;
        const v=c==="x"?r:(r&3|8);
        return v.toString(16);
      });
    }
    localStorage.setItem("stampertjesDeviceId",id);
  }
  return id;
}

function rememberPlayerName(value){
  const clean=String(value||"").trim().toUpperCase().slice(0,10);
  if(clean)localStorage.setItem("stampertjesPlayerName",clean);
  return clean;
}

function getPlayerName(){
  return (
    localStorage.getItem("stampertjesPlayerName") ||
    rememberPlayerName(nameInput?.value) ||
    rememberPlayerName(cafeName?.value) ||
    "SPELER"
  );
}

function saveStats(stats){
  const clean={
    ...DEFAULT_STATS,
    ...stats,
    gamesPlayed:Math.max(0,Number(stats.gamesPlayed)||0),
    bestScore:Math.max(0,Number(stats.bestScore)||0),
    highestLevel:Math.max(1,Number(stats.highestLevel)||1),
    applesDefeated:Math.max(0,Number(stats.applesDefeated)||0),
    deaths:Math.max(0,Number(stats.deaths)||0),
    longestCombo:Math.max(0,Number(stats.longestCombo)||0),
    teddyFound:Boolean(stats.teddyFound),
    achievements:Array.isArray(stats.achievements)?stats.achievements:[]
  };
  localStorage.setItem("stampertjesStats",JSON.stringify(clean));
  queueStatsSync(clean);
}

function queueStatsSync(stats=getStats()){
  clearTimeout(statsSyncTimer);
  statsSyncTimer=setTimeout(()=>{
    syncOnlineStats(stats).catch(err=>console.warn("Statistieken synchroniseren mislukt:",err));
  },650);
}

async function syncOnlineStats(stats=getStats()){
  const payload={
    p_device_id:getStatsDeviceId(),
    p_player_name:getPlayerName(),
    p_games_played:Number(stats.gamesPlayed)||0,
    p_best_score:Number(stats.bestScore)||0,
    p_highest_level:Number(stats.highestLevel)||1,
    p_apples_defeated:Number(stats.applesDefeated)||0,
    p_deaths:Number(stats.deaths)||0,
    p_longest_combo:Number(stats.longestCombo)||0,
    p_teddy_found:Boolean(stats.teddyFound)
  };

  const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_player_stats`,{
    method:"POST",
    headers:{
      "apikey":SUPABASE_KEY,
      "Authorization":`Bearer ${SUPABASE_KEY}`,
      "Content-Type":"application/json"
    },
    body:JSON.stringify(payload)
  });

  if(!response.ok){
    const text=await response.text();
    throw new Error(`${response.status}: ${text}`);
  }
}

function renderStats(){
  const s=getStats();
  const achievements=Array.isArray(s.achievements)?s.achievements:[];
  statsList.innerHTML=`
    <div class="statRow"><span>Spelersnaam</span><strong>${escapeHtml(getPlayerName())}</strong></div>
    <div class="statRow"><span>Gespeelde potjes</span><strong>${Number(s.gamesPlayed)||0}</strong></div>
    <div class="statRow"><span>Beste score</span><strong>${Number(s.bestScore)||0}</strong></div>
    <div class="statRow"><span>Hoogste level</span><strong>${Number(s.highestLevel)||1}</strong></div>
    <div class="statRow"><span>Verslagen Appelieten</span><strong>${Number(s.applesDefeated)||0}</strong></div>
    <div class="statRow"><span>Gevallen</span><strong>${Number(s.deaths)||0}</strong></div>
    <div class="statRow"><span>Langste combo</span><strong>${Number(s.longestCombo)||0}</strong></div>
    <div class="statRow"><span>Teddy gevonden</span><strong>${s.teddyFound?"JA":"NEE"}</strong></div>
    <div class="statRow"><span>Achievements</span><strong>${achievements.length}</strong></div>
  `;
}

async function loadOnlineStats(){
  onlineStatsStatus.textContent="Online statistieken laden…";
  onlineStatsList.innerHTML="";
  onlineStatsLeaders.innerHTML="";

  try{
    await syncOnlineStats(getStats());

    const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_stats`,{
      method:"POST",
      headers:{
        "apikey":SUPABASE_KEY,
        "Authorization":`Bearer ${SUPABASE_KEY}`,
        "Content-Type":"application/json"
      },
      body:"{}"
    });

    if(!response.ok){
      const text=await response.text();
      throw new Error(`${response.status}: ${text}`);
    }

    const data=await response.json();
    const totals=data?.totals||{};
    const leaders=Array.isArray(data?.leaders)?data.leaders:[];

    onlineStatsStatus.textContent="Bijgewerkt vanuit het Stampertjes-kasteel";
    onlineStatsList.innerHTML=`
      <div class="statRow"><span>Spelers</span><strong>${Number(totals.players)||0}</strong></div>
      <div class="statRow"><span>Gespeelde potjes</span><strong>${Number(totals.games_played)||0}</strong></div>
      <div class="statRow"><span>Appelieten verslagen</span><strong>${Number(totals.apples_defeated)||0}</strong></div>
      <div class="statRow"><span>Totaal gevallen</span><strong>${Number(totals.deaths)||0}</strong></div>
      <div class="statRow"><span>Teddy gevonden</span><strong>${Number(totals.teddy_finders)||0} spelers</strong></div>
      <div class="statRow"><span>Hoogste level wereldwijd</span><strong>${Number(totals.highest_level)||1}</strong></div>
    `;

    if(leaders.length){
      onlineStatsLeaders.innerHTML=`
        <h3>BESTE AVONTURIERS</h3>
        ${leaders.map((p,i)=>`
          <div class="onlineLeader">
            <span>${i+1}.</span>
            <span>${escapeHtml(p.player_name||"SPELER")}</span>
            <span>${Number(p.best_score)||0}</span>
            <span>Lv${Number(p.highest_level)||1}</span>
          </div>
        `).join("")}
      `;
    }
  }catch(err){
    console.error(err);
    onlineStatsStatus.textContent="Online statistieken zijn nog niet beschikbaar. Voer eerst de nieuwe Supabase-SQL uit.";
  }
}

const chroniclePages=[
  {
    title:"🌩️ De Eerste Scheur",
    art:"🏰  ⚡  🪨",
    body:`<p><span class="chapterDrop">L</span>ang voordat iemand het woord Appeliet kende, was het kasteel een rustige plek. De vloeren kraakten, de torens piepten in de wind en 's nachts sloeg alleen de oude klok.</p>
    <p>Tot een storm boven het dal bleef hangen. Bij de laatste donderslag trilde de grote zaal en verscheen midden in de stenen vloer een haarfijne scheur.</p>
    <p>De volgende ochtend was de scheur breder. En vanuit de diepte klonk iets dat verdacht veel leek op... gelach.</p>
    <p class="chronicleCliff">Die nacht rolde er iets groens uit de opening.</p>`
  },
  {
    title:"🍏 De Eerste Appeliet",
    art:"🕳️  🍏  ❓",
    body:`<p>Het wezen was rond, groen en opvallend eigenwijs. Het wandelde door de gangen alsof het kasteel altijd al van hem was geweest.</p>
    <p>De bewoners probeerden hem weg te jagen met bezems, emmers en een bijzonder slechte vioolspeler. Niets hielp.</p>
    <p>Toen verschenen er twee. Daarna vijf. Binnen enkele dagen krioelde het op de onderste verdieping van de Appelieten.</p>
    <p class="chronicleCliff">En precies toen begaf de eerste vloerplaat het.</p>`
  },
  {
    title:"👣 De Eerste Stampertjes",
    art:"👢  💥  🍏",
    body:`<p><span class="chapterDrop">N</span>iemand weet meer wie de eerste was. Volgens de ene legende was het een bewaker, volgens de andere een kok die zijn soeppan liet vallen.</p>
    <p>Wat wel vaststaat: drie harde stampen maakten de verzwakte vloer open. Een Appeliet viel erin en zat muurvast.</p>
    <p>De bewoners begrepen het onmiddellijk. Lokken. Stampen. Vangen. En nog één laatste dreun.</p>
    <p>De dappersten onder hen kregen al snel een naam: <strong>De Stampertjes</strong>.</p>
    <p class="chronicleCliff">Maar de Appelieten leerden sneller dan iemand had verwacht.</p>`
  },
  {
    title:"🏰 Het Kasteel Groeit",
    art:"🪜  🏰  🪜",
    body:`<p>Nieuwe zalen werden geopend en oude trappen hersteld. Waar eerst één verdieping was, ontstond een doolhof van ladders, balkons en gangen.</p>
    <p>De Appelieten pasten zich aan. Sommige werden sneller, andere taaier. Ze begonnen ladders te gebruiken en wachtten soms precies naast de plek waar een Stampertje wilde landen.</p>
    <p>Voor iedere nieuwe zaal ontstonden nieuwe trucs, nieuwe helden en nieuwe verhalen.</p>
    <p class="chronicleCliff">Tot iemand achter een dichtgemetselde muur een deur vond zonder klink.</p>`
  },
  {
    title:"📚 De Verborgen Bibliotheek",
    art:"📚  🗝️  🗺️",
    body:`<p>Achter de deur lag een bibliotheek die op geen enkele plattegrond stond. Het stof was dik, maar één boek lag open alsof iemand het zojuist had neergelegd.</p>
    <p>Op de tafel lag een kaart van het kasteel. Alleen... de kaart toonde veel meer verdiepingen dan er volgens de bouwmeester bestonden.</p>
    <p>Sommige routes eindigden bij zwarte inktvlekken. Eén route liep recht naar beneden en eindigde bij een klein kroontje.</p>
    <p class="chronicleCliff">In de marge stond slechts één woord: <strong>KONING</strong>.</p>`
  },
  {
    title:"🐈 Teddy, de Wachter",
    art:"🌙  🐈  🔑",
    body:`<p><span class="chapterDrop">V</span>anaf die dag begonnen avonturiers een grote kat in de gangen te zien. Hij verscheen nooit lang en zat vaak op plekken waar kort daarna iets bijzonders werd ontdekt.</p>
    <p>Zijn naam was Teddy. Niemand wist waar hij vandaan kwam. Sommige Stampertjes beweerden dat hij ouder was dan het kasteel zelf.</p>
    <p>Wie hem volgde, vond soms een verborgen doorgang. Wie hem probeerde te vangen, vond meestal alleen een lege gang en een paar haren op de vloer.</p>
    <p class="chronicleCliff">Op een nacht bleef Teddy voor het eerst staan... voor de trap naar de kelder.</p>`
  },
  {
    title:"⚔️ De Verdwenen Held",
    art:"🛡️  🕯️  ?",
    body:`<p>Een beroemde Stampertjes-held besloot de waarschuwingen te negeren en alleen af te dalen. Hij nam een lamp, een hamer en de kaart uit de bibliotheek mee.</p>
    <p>Drie dagen later werd de lamp teruggevonden. De kaart was verdwenen. Van de held zelf ontbrak ieder spoor.</p>
    <p>Alleen twee afdrukken van laarzen stonden in het stof. Ze wezen niet naar de uitgang, maar naar een muur.</p>
    <p class="chronicleCliff">Achter die muur klonk heel zacht: drie stampen.</p>`
  },
  {
    title:"🕯️ De Donkere Kerkers",
    art:"🕯️  🌫️  🚪",
    body:`<p>De oude kerkers werden afgesloten. Toch hoorden wachters 's nachts kettingen, druppelend water en voetstappen onder de stenen.</p>
    <p>Soms waaide er koude mist omhoog door scheuren in de vloer. Andere keren doofden alle fakkels tegelijk.</p>
    <p>De meest ervaren Stampertjes zeiden dat de Appelieten daar beneden anders bewogen. Alsof ze bevelen ontvingen.</p>
    <p class="chronicleCliff">En toen werd er voor het eerst een gouden glans in het donker gezien.</p>`
  },
  {
    title:"🌍 De Wereld Ontdekt het Kasteel",
    art:"🌍  🏆  🏰",
    body:`<p>Verhalen over het kasteel verspreidden zich tot ver buiten het dal. Nieuwe avonturiers kwamen hun geluk beproeven.</p>
    <p>Scores verschenen op een wereldwijde ranglijst. In het Stampertjes Café werden tactieken gedeeld, bugs gemeld en wilde theorieën besproken.</p>
    <p>Sommige spelers kwamen voor de punten. Anderen zochten Teddy. Een enkeling zocht vooral naar de deur uit de oude kaart.</p>
    <p class="chronicleCliff">Toen plaatste iemand in het Café een bericht: “Ik heb de kroon gezien.”</p>`
  },
  {
    title:"☕ Geruchten uit het Café",
    art:"☕  💬  👑",
    body:`<p>Niet ieder verhaal in het Café is waar. Waarschijnlijk.</p>
    <p>Er wordt gesproken over een Appeliet die door muren kan lopen, een kamer waarin de tijd langzamer gaat en een melodie die alleen klinkt als alle lichten uit zijn.</p>
    <p>Ook zou er ergens een sleutel bestaan die niet op een deur past, maar op een hoofdstuk.</p>
    <p class="chronicleCliff">Opvallend genoeg verdween het bericht over die sleutel dezelfde nacht.</p>`
  },
  {
    title:"👑 De Schaduw van de Appelkoning",
    art:"🚪  👁️👁️  👑",
    body:`<p><span class="chapterDrop">O</span>nder het oudste deel van het kasteel staat een poort die geen enkele smid heeft kunnen openen.</p>
    <p>Op de steen erboven staat een kroon. Soms trilt de poort als een Appeliet wordt verslagen. Soms klinkt er aan de andere kant iets dat op applaus lijkt.</p>
    <p>Niemand weet wie of wat er wacht. Maar één ding wordt steeds duidelijker: de Appelieten kwamen niet zomaar naar boven.</p>
    <p class="chronicleCliff">Iemand heeft ze gestuurd.</p>`
  },
  {
    title:"✍️ Jouw Hoofdstuk",
    art:"📜  ✍️  💡",
    body:`<p>De Kronieken zijn nog niet af. Nieuwe zalen worden ontdekt, nieuwe Appelieten verschijnen en iedere speler schrijft een klein stukje geschiedenis.</p>
    <p>Heb jij een idee voor een level, vijand, geheim, power-up of eindbaas? Laat het achter in het <strong>Stampertjes Café</strong>.</p>
    <p>Misschien wordt jouw idee ooit onderdeel van het kasteel.</p>
    <p style="text-align:center;margin-top:24px"><strong>🙏 Speciale dank aan Vera voor het bugtesten.</strong></p>
    <p style="text-align:center"><strong>Ontwikkeld door GJ Studios</strong></p>`
  },
  {
    title:"❓ Hoofdstuk XIII",
    art:"🔒  ?  🔒",
    locked:true,
    body:`<div class="chronicleLocked">
      <div class="lock">🔒</div>
      <p><strong>DIT HOOFDSTUK IS NOG NIET ONTDEKT...</strong></p>
      <p>Ergens in een toekomstige versie verandert deze bladzijde.</p>
      <p>Tot die tijd blijft de laatste pagina van de Kronieken verzegeld.</p>
    </div>`
  }
];

let chronicleIndex=0;
let chronicleTurning=false;

async function sfxPageTurn(){
  const ready=await audio();
  if(!ready||!audioCtx)return;
  const now=audioCtx.currentTime;
  const buffer=audioCtx.createBuffer(1,Math.floor(audioCtx.sampleRate*.11),audioCtx.sampleRate);
  const data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++){
    const fade=1-(i/data.length);
    data[i]=(Math.random()*2-1)*fade*.06;
  }
  const source=audioCtx.createBufferSource();
  const filter=audioCtx.createBiquadFilter();
  const gain=audioCtx.createGain();
  filter.type="highpass";
  filter.frequency.value=650;
  gain.gain.value=.20;
  source.buffer=buffer;
  source.connect(filter);filter.connect(gain);gain.connect(audioCtx.destination);
  source.start(now);
}

function renderChroniclePage(direction=0){
  const page=chroniclePages[chronicleIndex];
  chroniclePageContent.innerHTML=`
    <div class="chronicleChapter">HOOFDSTUK ${String(chronicleIndex+1).padStart(2,"0")}</div>
    <h3>${page.title}</h3>
    <div class="chronicleArt">${page.art||"🏰"}</div>
    ${page.body}
  `;
  chroniclePageNumber.textContent=`Pagina ${chronicleIndex+1} van ${chroniclePages.length}`;
  chroniclePrev.disabled=chronicleIndex===0;
  chronicleNext.disabled=chronicleIndex===chroniclePages.length-1;

  if(direction!==0){
    const cls=direction>0?"turningNext":"turningPrev";
    chroniclePage.classList.remove("turningNext","turningPrev");
    void chroniclePage.offsetWidth;
    chroniclePage.classList.add(cls);
    setTimeout(()=>chroniclePage.classList.remove(cls),360);
  }
}

activateButton(chroniclePrev,()=>{
  if(chronicleTurning||chronicleIndex===0)return;
  chronicleTurning=true;
  chronicleIndex--;
  sfxPageTurn();
  renderChroniclePage(-1);
  setTimeout(()=>{chronicleTurning=false},380);
});

activateButton(chronicleNext,()=>{
  if(chronicleTurning||chronicleIndex===chroniclePages.length-1)return;
  chronicleTurning=true;
  chronicleIndex++;
  sfxPageTurn();
  renderChroniclePage(1);
  setTimeout(()=>{chronicleTurning=false},380);
});

renderChroniclePage();


function getCafeDeviceId(){
  let id=localStorage.getItem("stampertjesCafeDeviceId");
  if(!id){
    if(window.crypto&&crypto.randomUUID){
      id=crypto.randomUUID();
    }else{
      id="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{
        const r=Math.random()*16|0;
        const v=c==="x"?r:(r&3|8);
        return v.toString(16);
      });
    }
    localStorage.setItem("stampertjesCafeDeviceId",id);
  }
  return id;
}

let cafeAdminCode=sessionStorage.getItem("stampertjesCafeAdminCode")||"";
let cafeEditingPostId=null;

function isCafeAdmin(){
  return Boolean(cafeAdminCode);
}


async function verifyCafeAdminCode(code){
  try{
    const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/verify_stampertjes_admin`,{
      method:"POST",
      headers:{
        "apikey":SUPABASE_KEY,
        "Authorization":`Bearer ${SUPABASE_KEY}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({p_admin_code:String(code||"")})
    });
    if(!response.ok)return false;
    const result=await response.json();
    return result===true;
  }catch(err){
    console.error("Admincode controleren mislukt:",err);
    return false;
  }
}

function setCafeAdminMode(on,code=""){
  cafeAdminCode=on?String(code||""):"";
  if(cafeAdminCode){
    sessionStorage.setItem("stampertjesCafeAdminCode",cafeAdminCode);
    cafeAdminStatus.classList.remove("hidden");
  }else{
    sessionStorage.removeItem("stampertjesCafeAdminCode");
    cafeAdminStatus.classList.add("hidden");
  }
}

function resetCafeEdit(){
  cafeEditingPostId=null;
  cafeSubmitBtn.textContent="BERICHT PLAATSEN";
  cafeCancelEditBtn.classList.add("hidden");
  cafeMessage.value="";
  cafeCounter.textContent="0 / 240";
}

function escapeHtml(value){
  return String(value??"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function cafeTypeLabel(type){
  const labels={
    "Algemeen":"💬 Algemeen",
    "Idee":"💡 Idee",
    "Bug":"🐞 Bug",
    "Highscore":"🎉 Highscore",
    "GJ Studios":"📢 GJ Studios"
  };
  return labels[type]||"💬 Algemeen";
}

function cafeMessageNotice(type){
  if(type==="Idee")return "⭐ Dit idee kan in een toekomstige update worden opgenomen.";
  if(type==="Bug")return "🔧 Bedankt! Deze melding helpt ons het spel te verbeteren.";
  if(type==="Highscore")return "🏆 Mooie prestatie! Kun jij de wereldwijde Top 10 halen?";
  return "";
}

function formatCafeDate(value){
  try{
    return new Intl.DateTimeFormat("nl-NL",{
      day:"2-digit",month:"2-digit",year:"numeric",
      hour:"2-digit",minute:"2-digit"
    }).format(new Date(value));
  }catch{return ""}
}

async function fetchCafeCount(type=null){
  const filter=type?`&type=eq.${encodeURIComponent(type)}`:"";
  const response=await fetch(
    `${SUPABASE_URL}/rest/v1/community_posts?select=id${filter}`,
    {
      headers:{
        "apikey":SUPABASE_KEY,
        "Authorization":`Bearer ${SUPABASE_KEY}`,
        "Prefer":"count=exact",
        "Range":"0-0"
      }
    }
  );
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const range=response.headers.get("content-range")||"0-0/0";
  return Number(range.split("/")[1])||0;
}

async function loadCafeStats(){
  try{
    const [total,ideas,bugs,highscores]=await Promise.all([
      fetchCafeCount(),fetchCafeCount("Idee"),fetchCafeCount("Bug"),fetchCafeCount("Highscore")
    ]);
    cafeTotalCount.textContent=total;
    cafeIdeaCount.textContent=ideas;
    cafeBugCount.textContent=bugs;
    cafeHighscoreCount.textContent=highscores;
  }catch(err){
    console.warn("Caféstatistieken niet bereikbaar",err);
    cafeTotalCount.textContent=cafeIdeaCount.textContent=cafeBugCount.textContent=cafeHighscoreCount.textContent="—";
  }
}

async function loadCafePosts(){
  cafePosts.innerHTML="<div>Berichten laden…</div>";
  cafeStatus.textContent="";
  try{
    const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_community_posts`,{
      method:"POST",
      headers:{
        "apikey":SUPABASE_KEY,
        "Authorization":`Bearer ${SUPABASE_KEY}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({p_device_id:getCafeDeviceId()})
    });
    if(!response.ok)throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    const posts=await response.json();
    renderCafePosts(posts);
  }catch(err){
    console.error(err);
    cafePosts.innerHTML="<div>Het Café is tijdelijk niet bereikbaar. Probeer het later opnieuw.</div>";
  }
}

function renderCafePosts(posts){
  if(!posts.length){
    cafePosts.innerHTML="<div>Nog geen berichten. Plaats de eerste!</div>";
    return;
  }

  cafePosts.innerHTML=posts.map(post=>{
    const own=Boolean(post.is_own);
    const canDelete=own||isCafeAdmin();
    const canEdit=own;
    const actions=(canEdit||canDelete)?`
      <div class="cafePostActions">
        ${canEdit?`<button class="cafeActionBtn cafeEditBtn" data-edit-id="${Number(post.id)}">✏️ BEWERK</button>`:""}
        ${canDelete?`<button class="cafeActionBtn cafeDeleteBtn" data-delete-id="${Number(post.id)}">🗑️ VERWIJDER</button>`:""}
      </div>`:"";

    return `
      <article class="cafePost">
        <div class="cafePostHeader">
          <div>
            <div class="cafePostName">${escapeHtml(post.name)}</div>
            <div class="cafePostType">${cafeTypeLabel(post.type)}</div>
          </div>
          <div>${formatCafeDate(post.created_at)}</div>
        </div>
        <div class="cafePostMessage">${escapeHtml(post.message)}</div>
        ${post.type==="Idee"?`<div class="cafeEditBadge">⭐ Dit idee kan terugkomen in een toekomstige update.</div>`:""}
        ${post.type==="Bug"?`<div class="cafeEditBadge">🔧 Bedankt! Deze melding helpt het spel verbeteren.</div>`:""}
        ${post.type==="Highscore"?`<div class="cafeEditBadge">🏆 Mooie prestatie!</div>`:""}
        <div class="cafePostFooter">
          <span>${Number(post.likes)||0} ${Number(post.likes)===1?"like":"likes"}</span>
          <div class="cafePostActions">
            <button class="likeBtn" data-like-id="${Number(post.id)}">👍 LIKE</button>
            ${actions}
          </div>
        </div>
      </article>
    `;
  }).join("");

  cafePosts.querySelectorAll("[data-like-id]").forEach(btn=>{
    activateButton(btn,async()=>{
      const id=Number(btn.dataset.likeId);
      btn.disabled=true;
      try{
        const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/like_community_post`,{
          method:"POST",
          headers:{
            "apikey":SUPABASE_KEY,
            "Authorization":`Bearer ${SUPABASE_KEY}`,
            "Content-Type":"application/json"
          },
          body:JSON.stringify({p_post_id:id})
        });
        if(!response.ok)throw new Error(`HTTP ${response.status}`);
        await loadCafePosts();
      }catch(err){
        console.error(err);
        cafeStatus.textContent="Liken lukte niet.";
      }finally{
        btn.disabled=false;
      }
    });
  });

  cafePosts.querySelectorAll("[data-delete-id]").forEach(btn=>{
    activateButton(btn,async()=>{
      const id=Number(btn.dataset.deleteId);
      if(!confirm("Weet je zeker dat je dit bericht wilt verwijderen?"))return;
      btn.disabled=true;
      try{
        const rpc=isCafeAdmin()?"admin_delete_community_post":"delete_own_community_post";
        const body=isCafeAdmin()
          ? {p_post_id:id,p_admin_code:cafeAdminCode}
          : {p_post_id:id,p_device_id:getCafeDeviceId()};

        const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${rpc}`,{
          method:"POST",
          headers:{
            "apikey":SUPABASE_KEY,
            "Authorization":`Bearer ${SUPABASE_KEY}`,
            "Content-Type":"application/json"
          },
          body:JSON.stringify(body)
        });
        if(!response.ok)throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        const deleted=await response.json();
        if(deleted!==true){
          throw new Error("Supabase heeft het bericht niet verwijderd.");
        }
        cafeStatus.textContent="Bericht verwijderd.";
        await loadCafePosts();
      }catch(err){
        console.error(err);
        cafeStatus.textContent=isCafeAdmin()
          ?"Verwijderen mislukt. Controleer je beheercode."
          :"Je kunt alleen je eigen berichten verwijderen.";
      }finally{
        btn.disabled=false;
      }
    });
  });

  cafePosts.querySelectorAll("[data-edit-id]").forEach(btn=>{
    activateButton(btn,()=>{
      const id=Number(btn.dataset.editId);
      const post=posts.find(p=>Number(p.id)===id);
      if(!post)return;
      cafeEditingPostId=id;
      cafeName.value=post.name||"";
      cafeType.value=post.type||"Algemeen";
      cafeMessage.value=post.message||"";
      cafeCounter.textContent=`${cafeMessage.value.length} / 240`;
      cafeSubmitBtn.textContent="WIJZIGING OPSLAAN";
      cafeCancelEditBtn.classList.remove("hidden");
      cafeMessage.focus();
      cafeMessage.scrollIntoView({behavior:"smooth",block:"center"});
    });
  });
}

nameInput.addEventListener("input",()=>rememberPlayerName(nameInput.value));
cafeName.addEventListener("input",()=>rememberPlayerName(cafeName.value));

cafeMessage.addEventListener("input",()=>{
  cafeCounter.textContent=`${cafeMessage.value.length} / 240`;
});

activateButton(cafeSubmitBtn,async()=>{
  const name=(cafeName.value.trim()||"SPELER").toUpperCase().slice(0,10);
  rememberPlayerName(name);
  const type=cafeType.value;
  const message=cafeMessage.value.trim().slice(0,240);

  if(message.length<2){
    cafeStatus.textContent="Typ eerst een bericht.";
    return;
  }

  cafeSubmitBtn.disabled=true;
  cafeStatus.textContent="";

  try{
    const editing=Number.isFinite(cafeEditingPostId);
    const rpc=editing?"update_own_community_post":"create_community_post";
    const payload=editing
      ? {
          p_post_id:cafeEditingPostId,
          p_device_id:getCafeDeviceId(),
          p_player_name:name,
          p_type:type,
          p_message:message
        }
      : {
          p_device_id:getCafeDeviceId(),
          p_player_name:name,
          p_type:type,
          p_message:message
        };

    const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${rpc}`,{
      method:"POST",
      headers:{
        "apikey":SUPABASE_KEY,
        "Authorization":`Bearer ${SUPABASE_KEY}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify(payload)
    });
    if(!response.ok)throw new Error(`${response.status}: ${await response.text()}`);

    cafeStatus.textContent=editing?"Bericht aangepast!":"Bericht geplaatst!";
    resetCafeEdit();
    await loadCafePosts();
  }catch(err){
    console.error(err);
    cafeStatus.textContent="Opslaan lukte niet. Probeer het later opnieuw.";
  }finally{
    cafeSubmitBtn.disabled=false;
    if(!cafeEditingPostId)cafeSubmitBtn.textContent="BERICHT PLAATSEN";
  }
});

const CURRENT_VERSION="2.15";
function showUpdateOnce(){
  const seen=localStorage.getItem("stampertjesSeenVersion");
  if(seen!==CURRENT_VERSION){
    updateOverlay.classList.remove("hidden");
  }
}
activateButton(closeUpdateBtn,()=>{
  localStorage.setItem("stampertjesSeenVersion",CURRENT_VERSION);
  updateOverlay.classList.add("hidden");
  armAttractMode();
});


activateButton(cafeCancelEditBtn,()=>{
  resetCafeEdit();
  cafeStatus.textContent="Bewerken geannuleerd.";
});



let studioAdminTapCount=0;
let studioAdminTapTimer=null;
activateButton(studioLine,()=>{
  studioAdminTapCount++;
  clearTimeout(studioAdminTapTimer);
  studioAdminTapTimer=setTimeout(()=>{studioAdminTapCount=0},1800);
  if(studioAdminTapCount>=5){
    studioAdminTapCount=0;
    window.location.href="./admin.html";
  }
});

let teddyTapCount=0;
let teddyTapTimer=null;
let teddyEggActive=false;
activateButton(versionLabel,()=>{
  teddyTapCount++;
  clearTimeout(teddyTapTimer);
  teddyTapTimer=setTimeout(()=>{teddyTapCount=0},1800);
  if(teddyTapCount>=5){
    teddyTapCount=0;
    teddyEggActive=true;

    const teddyStats=getStats();
    teddyStats.teddyFound=true;
    if(!Array.isArray(teddyStats.achievements))teddyStats.achievements=[];
    if(!teddyStats.achievements.includes("teddy")){
      teddyStats.achievements.push("teddy");
    }
    saveStats(teddyStats);

    teddyEgg.classList.remove("hidden");
    duckMenuMusic(500);
    tone(330,.08,"square",.04,440);
    setTimeout(()=>tone(440,.08,"square",.04,660),90);
    setTimeout(()=>tone(660,.12,"square",.04,880),180);
    setTimeout(()=>{
      teddyEgg.classList.add("hidden");
      teddyEggActive=false;
    },5000);
  }
});
document.querySelectorAll("[data-back]").forEach(btn=>{
  activateButton(btn,()=>{
    stopAttractMode();
    showMainMenu();
    armAttractMode();
  });
});

let attractTimer=null;
let attractActive=false;
let attractCycleTimer=null;

function stopAttractMode(){
  clearTimeout(attractTimer);
  clearTimeout(attractCycleTimer);
  attractActive=false;
  document.body.classList.remove("attractMode");
  attractPrompt.classList.add("hidden");
}
function startAttractMode(){
  if(!updateOverlay.classList.contains("hidden"))return;
  if(state!=="intro"||mainMenu.classList.contains("hidden"))return;
  attractActive=true;
  document.body.classList.add("attractMode");
  attractPrompt.classList.remove("hidden");

  attractCycleTimer=setTimeout(async()=>{
    if(!attractActive)return;
    document.body.classList.add("scoreMode");
    showMenuSection(scoresSection);
    await loadOnlineHighscores();

    attractCycleTimer=setTimeout(()=>{
      if(!attractActive)return;
      document.body.classList.remove("scoreMode");
      showMainMenu();
      document.body.classList.add("attractMode");
      attractPrompt.classList.remove("hidden");
    },5000);
  },12000);
}
function armAttractMode(){
  clearTimeout(attractTimer);
  if(state!=="intro")return;
  attractTimer=setTimeout(startAttractMode,15000);
}
["pointerdown","touchstart","keydown"].forEach(ev=>{
  window.addEventListener(ev,()=>{
    if(state==="intro"){
      const wasAttractActive=attractActive;
      stopAttractMode();

      // Alleen vanuit de automatische attract mode terug naar het hoofdmenu.
      // Normale taps op Uitleg, Highscores, Historie of Ontwikkeling
      // mogen het gekozen scherm niet meteen weer sluiten.
      if(wasAttractActive)showMainMenu();

      armAttractMode();
    }
  },{passive:true,capture:false});
});

function openIntro(){
  document.body.classList.remove("gameplayActive");
  state="intro";
  keys.left=keys.right=keys.up=keys.down=false;
  pauseOverlay.classList.add("hidden");
  pauseToggle.textContent="⏸ PAUZE";
  startBtn.classList.add("hidden");
  overlay.classList.remove("hidden");
  showMainMenu();
  armAttractMode();
}
let startingGame=false;
function startGame(){
  ensureGameplayControlsVisible();
  menuMusicIcon.classList.add("hidden");
  stopAttractMode();
  document.body.classList.remove("scoreMode");
  document.body.classList.add("gameplayActive");
  if(startingGame||state==="play")return;
  startingGame=true;
  playMenuBtn.textContent="SPELEN";
  audio();
  score=0;level=1;lives=3;state="play";
  if(musicOn)startMusic();
  const gameStats=getStats();
  gameStats.gamesPlayed=(Number(gameStats.gamesPlayed)||0)+1;
  saveStats(gameStats);player.fastStamp=0;pauseOverlay.classList.add("hidden");pauseToggle.textContent="⏸ PAUZE";
  spawnLevel();
  clearStartZone();
  startFreeze=90;
  overlay.classList.add("hidden");
  setTimeout(()=>{startingGame=false},250);
}
function showGameOverPanel(){
  document.body.classList.remove("gameplayActive");
  if(musicOn)startMusic();
  pendingScore=score;
  overlay.classList.remove("hidden");
  mainMenu.classList.add("hidden");
  scoresSection.classList.add("hidden");
  helpSection.classList.add("hidden");
  historySection.classList.add("hidden");
  roadmapSection.classList.add("hidden");
  hallSection.classList.add("hidden");
  cafeSection.classList.add("hidden");
  statsSection.classList.add("hidden");
  startBtn.classList.add("hidden");
  document.getElementById("introText").textContent=`Je eindscore: ${score}`;
  document.getElementById("highscoreBox").classList.toggle("hidden",qualifiesForHighscore(score));
  highscoreEntry.classList.toggle("hidden",!qualifiesForHighscore(score));
  if(qualifiesForHighscore(score)){
    nameInput.focus();
    nameInput.select();
  }else{
    mainMenu.classList.remove("hidden");
    playMenuBtn.textContent="OPNIEUW SPELEN";
  }
}
startBtn.addEventListener("pointerdown",e=>{
  e.preventDefault();
  startBtn.textContent="START SPEL";
  startGame();
});
saveScoreBtn.addEventListener("pointerdown",async e=>{
  e.preventDefault();
  const name=(nameInput.value.trim()||"SPELER").toUpperCase().slice(0,10);
  rememberPlayerName(name);
  saveScoreBtn.disabled=true;
  saveScoreBtn.textContent="OPSLAAN…";

  // Lokale reservekopie
  const local=getLocalHighscores();
  local.push({name,score:pendingScore,level});
  local.sort((a,b)=>b.score-a.score);
  saveLocalHighscores(normalizeScores(local));

  try{
    await submitOnlineScore(name,pendingScore,level);
    highscoreEntry.classList.add("hidden");
    document.getElementById("highscoreBox").classList.remove("hidden");
    await loadOnlineHighscores();
    document.getElementById("introText").textContent="Je score staat online!";
  }catch(err){
    console.error(err);
    highscoreEntry.classList.add("hidden");
    document.getElementById("highscoreBox").classList.remove("hidden");
    renderHighscores(true);
    document.getElementById("introText").textContent=
      "Online opslaan lukte niet. De score is wel lokaal bewaard.";
  }finally{
    saveScoreBtn.disabled=false;
    saveScoreBtn.textContent="SCORE OPSLAAN";
    mainMenu.classList.remove("hidden");
    playMenuBtn.textContent="OPNIEUW SPELEN";
  }
});

function drawIntroPlayer(x,y,pose="walk"){
  ictx.fillStyle="#111";
  ictx.fillRect(x+7,y,10,8);
  ictx.fillRect(x+3,y+8,18,13);
  ictx.fillRect(x,y+12,4,8);
  ictx.fillRect(x+20,y+12,4,8);

  if(pose==="stamp"){
    ictx.fillRect(x+2,y+21,9,7);
    ictx.fillRect(x+13,y+21,9,7);
  }else{
    const step=Math.floor(introFrame/7)%2;
    if(step===0){
      ictx.fillRect(x+3,y+21,7,7);
      ictx.fillRect(x+14,y+21,7,7);
    }else{
      ictx.fillRect(x+6,y+21,7,7);
      ictx.fillRect(x+11,y+21,7,7);
    }
  }
}
function drawIntroApple(x,y,trapped=false,panic=false){
  ictx.fillStyle="#111";
  ictx.beginPath();
  ictx.arc(x+14,y+11,13,0,Math.PI*2);
  ictx.fill();
  ictx.fillRect(x+12,y-5,4,7);
  ictx.fillRect(x+3,y+21,6,5);
  ictx.fillRect(x+19,y+21,6,5);

  ictx.fillStyle="#fff";
  if(panic){
    ictx.fillRect(x+5,y+6,5,5);
    ictx.fillRect(x+18,y+6,5,5);
  }else{
    ictx.fillRect(x+7,y+7,3,3);
    ictx.fillRect(x+18,y+7,3,3);
  }
  ictx.fillStyle="#111";

  if(trapped){
    ictx.fillRect(x+1,y+24,26,3);
  }
}
function drawIntroLadder(x,y1,y2){
  ictx.fillRect(x,y1,3,y2-y1);
  ictx.fillRect(x+20,y1,3,y2-y1);
  for(let y=y1+8;y<y2;y+=10)ictx.fillRect(x,y,23,2);
}
function drawIntroFloor(y,holeX=null,crackStage=0){
  ictx.fillStyle="#111";
  if(holeX===null){
    ictx.fillRect(12,y-4,396,8);
  }else{
    ictx.fillRect(12,y-4,holeX-12,8);
    ictx.fillRect(holeX+42,y-4,408-(holeX+42),8);
  }

  ictx.fillStyle="#fff";
  for(let x=20;x<400;x+=22){
    if(holeX!==null && x>holeX-8 && x<holeX+45)continue;
    ictx.fillRect(x,y-1,10,2);
  }
  ictx.fillStyle="#111";

  if(crackStage>0){
    ictx.lineWidth=2;
    ictx.beginPath();
    ictx.moveTo(holeX+10,y-7);ictx.lineTo(holeX+20,y);ictx.lineTo(holeX+13,y+7);
    if(crackStage>1){
      ictx.moveTo(holeX+32,y-7);ictx.lineTo(holeX+23,y);ictx.lineTo(holeX+31,y+7);
    }
    ictx.stroke();
  }
}
function drawIntroDust(x,y,size){
  ictx.beginPath();ictx.arc(x-size,y,size*.45,0,Math.PI*2);ictx.fill();
  ictx.beginPath();ictx.arc(x+size,y,size*.45,0,Math.PI*2);ictx.fill();
  ictx.beginPath();ictx.arc(x,y-size*.35,size*.55,0,Math.PI*2);ictx.fill();
}
function drawIntro(){
  introFrame++;
  const phase=introFrame%420;

  ictx.fillStyle="#fff";
  ictx.fillRect(0,0,420,180);
  ictx.fillStyle="#111";
  ictx.strokeStyle="#111";
  ictx.lineWidth=4;
  ictx.strokeRect(6,6,408,168);

  drawIntroLadder(70,48,96);
  drawIntroLadder(282,96,144);

  // Extra attract-mode detail: een Appeliet klimt rustig op de linker ladder.
  const ladderCycle=introFrame%300;
  if(ladderCycle<110){
    const climbProgress=ladderCycle/110;
    drawIntroApple(66,70-(climbProgress*46),false,false);
  }

  let crackStage=0;
  let holeOpen=false;
  if(phase>=80&&phase<115)crackStage=1;
  if(phase>=115&&phase<150)crackStage=2;
  if(phase>=150)holeOpen=true;

  drawIntroFloor(48);
  drawIntroFloor(96);
  drawIntroFloor(144,holeOpen?274:null,crackStage);

  // Player movement and stamping
  let px=34,pose="walk";
  if(phase<70){
    px=34+phase*2.8;
  }else if(phase<150){
    px=230;pose="stamp";
  }else if(phase<250){
    px=230;
  }else if(phase<330){
    px=230+(phase-250)*.55;
  }else if(phase<400){
    px=274;pose="stamp";
  }else{
    px=274-(phase-400)*3.2;
  }

  // Apple approaches and gets trapped
  let ax=355,ay=116,trapped=false,panic=false,visible=true;
  if(phase<150){
    ax=355-(phase*.45);
  }else if(phase<235){
    ax=287;
    ay=128;
    trapped=true;panic=true;
  }else if(phase<330){
    ax=287;ay=128;trapped=true;panic=true;
  }else if(phase<365){
    ax=287;ay=132;trapped=true;panic=true;
  }else{
    visible=false;
  }

  drawIntroPlayer(px,116,pose);
  if(visible)drawIntroApple(ax,ay,trapped,panic);

  // Text effects
  ictx.font="bold 12px monospace";
  if(phase>=80&&phase<115)ictx.fillText("KRAK!",235,112);
  if(phase>=115&&phase<150)ictx.fillText("KRAK!!",232,112);
  if(phase>=150&&phase<175)ictx.fillText("GAT!",242,112);
  if(phase>=330&&phase<350)ictx.fillText("BAM!",250,106);
  if(phase>=350&&phase<370)ictx.fillText("BAM!!",246,106);
  if(phase>=365&&phase<400){
    drawIntroDust(292,136,Math.min((phase-365)*.7,14));
    ictx.fillText("+300",276,105);
  }

  // Teddy easter egg runs through intro when active
  if(teddyEggActive){
    const tx=20+((introFrame*1.8)%360);
    ictx.font="20px monospace";
    ictx.fillText("ᓚᘏᗢ",tx,38);
  }

  requestAnimationFrame(drawIntro);
}
window.addEventListener("load",()=>{
  openIntro();
  drawIntro();
  setTimeout(tryImmediateMenuAutoplay,200);
  setTimeout(showUpdateOnce,250);
});
ctx.imageSmoothingEnabled=false;
const W=c.width,H=c.height;
const floors=[74,136,198,260,310];
const FLOOR_HITS=3;
const ladderLayouts=[
  [
    {x:78,top:74,bottom:136},{x:308,top:74,bottom:136},
    {x:180,top:136,bottom:198},{x:398,top:136,bottom:198},
    {x:72,top:198,bottom:260},{x:292,top:198,bottom:260},
    {x:210,top:260,bottom:310},{x:420,top:260,bottom:310}
  ],
  [
    {x:150,top:74,bottom:136},{x:390,top:74,bottom:136},
    {x:55,top:136,bottom:198},{x:270,top:136,bottom:198},
    {x:165,top:198,bottom:260},{x:405,top:198,bottom:260},
    {x:85,top:260,bottom:310},{x:315,top:260,bottom:310}
  ],
  [
    {x:50,top:74,bottom:136},{x:235,top:74,bottom:136},
    {x:355,top:136,bottom:198},{x:120,top:136,bottom:198},
    {x:245,top:198,bottom:260},{x:420,top:198,bottom:260},
    {x:155,top:260,bottom:310},{x:365,top:260,bottom:310}
  ],
  [
    {x:110,top:74,bottom:136},{x:350,top:74,bottom:136},
    {x:205,top:136,bottom:198},{x:430,top:136,bottom:198},
    {x:45,top:198,bottom:260},{x:330,top:198,bottom:260},
    {x:240,top:260,bottom:310},{x:405,top:260,bottom:310}
  ],
  [
    {x:60,top:74,bottom:136},{x:275,top:74,bottom:136},
    {x:155,top:136,bottom:198},{x:370,top:136,bottom:198},
    {x:95,top:198,bottom:260},{x:255,top:198,bottom:260},
    {x:175,top:260,bottom:310},{x:390,top:260,bottom:310}
  ]
];
let ladders=ladderLayouts[0];
let currentLayoutIndex=0;

let keys={left:false,right:false,up:false,down:false};
let frame=0,score=0,level=1,lives=3,state="intro",shake=0,startFreeze=0,deathAnimating=false,deathFrame=0;
let holes=[],cracks=[],enemies=[],effects=[],bonus=null,bonusSpawnTimer=420,combo=0,comboTimer=0,enemyIdCounter=1;
let player={x:30,y:282,w:24,h:28,onLadder:false,cool:0,dir:1,invulnerable:0};

let audioCtx=null;
let audioUnlocked=false;
let lastTrapSound=0;

async function audio(){
  try{
    if(!audioCtx){
      audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    }
    if(audioCtx.state==="suspended"){
      await audioCtx.resume();
    }

    // Een vrijwel onhoorbaar tikje ontgrendelt WebAudio op iPhone.
    if(!audioUnlocked){
      const buffer=audioCtx.createBuffer(1,1,22050);
      const source=audioCtx.createBufferSource();
      source.buffer=buffer;
      source.connect(audioCtx.destination);
      source.start(0);
      audioUnlocked=true;
    }
    return true;
  }catch(err){
    console.warn("Audio kon niet worden gestart:",err);
    return false;
  }
}
async function tone(f,d=.08,t="square",v=.05,end=f){
  const ready=await audio();
  if(!ready||!audioCtx)return;
  const now=audioCtx.currentTime;
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type=t;
  o.frequency.setValueAtTime(f,now);
  o.frequency.linearRampToValueAtTime(end,now+d);
  g.gain.setValueAtTime(Math.max(v,.001),now);
  g.gain.exponentialRampToValueAtTime(.001,now+d);
  o.connect(g);g.connect(audioCtx.destination);
  o.start(now);o.stop(now+d);
}
const sfxCrack=()=>tone(140,.09,"square",.06,95);
const sfxBreak=()=>tone(85,.18,"sawtooth",.09,45);
const sfxTrap=()=>tone(360,.09,"square",.05,210);
const sfxHit=()=>tone(240,.09,"square",.07,120);
const sfxKill=()=>{tone(120,.2,"sawtooth",.08,45);setTimeout(()=>tone(520,.1,"square",.05,720),100)};
const sfxHurt=()=>tone(170,.22,"sawtooth",.08,70);

const menuSoundtrack=document.getElementById("menuSoundtrack");
const MUSIC_VOLUME=.16;
const GAMEPLAY_MUSIC_VOLUME=.11;
let musicOn=true;
let musicFadeFrame=null;
let musicTimer=null;

if(localStorage.getItem("stampertjesAudioMigration")!=="2.12"){
  localStorage.setItem("stampertjesMusic","1");
  localStorage.setItem("stampertjesAudioMigration","2.12");
}
musicOn=localStorage.getItem("stampertjesMusic")!=="0";

function setMusicButton(){
  musicToggle.textContent="MUZIEK: "+(musicOn?"AAN":"UIT");
  menuMusicIcon.textContent=musicOn?"🔊":"🔇";
  menuMusicIcon.classList.toggle("musicOff",!musicOn);
  menuMusicIcon.setAttribute("aria-label",musicOn?"Muziek uitzetten":"Muziek aanzetten");
}

function isMenuState(){
  return state==="intro"||state==="gameover";
}
function isGameplayState(){
  return state==="play"||state==="paused"||state==="transition"||state==="dying";
}
function targetMusicVolume(){
  if(state==="dying")return .05;
  return isGameplayState()?GAMEPLAY_MUSIC_VOLUME:MUSIC_VOLUME;
}

function applyMusicVolume(){
  menuSoundtrack.volume=targetMusicVolume();
}

async function startMusic(){
  if(!musicOn)return false;
  try{
    applyMusicVolume();
    await menuSoundtrack.play();
    musicTimer=true;
    return true;
  }catch(err){
    console.warn("Muziek kon niet starten:",err);
    return false;
  }
}

function stopMusic(){
  musicTimer=null;
  menuSoundtrack.pause();
}

function setMusic(on){
  musicOn=Boolean(on);
  localStorage.setItem("stampertjesMusic",musicOn?"1":"0");
  setMusicButton();

  if(musicOn){
    return startMusic();
  }

  stopMusic();
  return Promise.resolve(false);
}

// Compatibiliteit met bestaande menu/game code.
function playMenuMusic(){return startMusic();}
function startMenuMusic(){return startMusic();}
function playMusicStep(){return startMusic();}
function stopMenuMusic(){stopMusic();}
function fadeSoundtrack(target,duration=0,pauseAfter=false){
  // v2.13.2: bewust eenvoudig en betrouwbaar.
  menuSoundtrack.volume=Math.max(0,Math.min(1,target));
  if(pauseAfter&&target<=.001)menuSoundtrack.pause();
}
function duckMenuMusic(duration=400){
  if(menuSoundtrack.paused||!musicOn)return;
  const original=targetMusicVolume();
  menuSoundtrack.volume=Math.min(original,.06);
  setTimeout(()=>{
    if(musicOn&&!menuSoundtrack.paused)menuSoundtrack.volume=targetMusicVolume();
  },duration);
}

async function tryImmediateMenuAutoplay(){
  if(musicOn&&state==="intro")await startMusic();
}

function handleFirstAudioGesture(){
  if(musicOn&&menuSoundtrack.paused){
    // Direct in dezelfde gebruikersactie proberen te starten.
    startMusic();
  }
  audio();
}
["pointerdown","touchstart","mousedown","keydown"].forEach(eventName=>{
  window.addEventListener(eventName,handleFirstAudioGesture,{
    passive:true,
    capture:true
  });
});

function toggleMusicFromUser(){
  const next=!musicOn;
  setMusicButton();
  if(next){
    musicOn=true;
    localStorage.setItem("stampertjesMusic","1");
    setMusicButton();
    startMusic();
  }else{
    musicOn=false;
    localStorage.setItem("stampertjesMusic","0");
    setMusicButton();
    stopMusic();
  }
  audio();
}

musicToggle.addEventListener("pointerdown",e=>{
  e.preventDefault();
  e.stopPropagation();
  toggleMusicFromUser();
});

musicToggle.addEventListener("click",e=>{
  // Desktop fallback als pointerdown niet geleverd wordt.
  if(e.detail===0){
    e.preventDefault();
    e.stopPropagation();
    toggleMusicFromUser();
  }
});

menuMusicIcon.addEventListener("pointerdown",e=>{
  e.preventDefault();
  e.stopPropagation();
  menuMusicIcon.classList.add("musicPulse");
  setTimeout(()=>menuMusicIcon.classList.remove("musicPulse"),160);
  toggleMusicFromUser();
});

menuSoundtrack.addEventListener("error",()=>{
  console.error("The Castle Awakens kon niet worden geladen.",menuSoundtrack.error);
  musicToggle.textContent="MUZIEK: FOUT";
  menuMusicIcon.textContent="⚠️";
  menuMusicIcon.title="Muziekbestand niet gevonden";
});

document.addEventListener("visibilitychange",()=>{
  if(document.hidden){
    menuSoundtrack.pause();
  }else if(musicOn){
    startMusic();
  }
});

setMusicButton();

const pauseToggle=document.getElementById("pauseToggle");
const deathOverlay=document.getElementById("deathOverlay");
const deathTitle=document.getElementById("deathTitle");
const deathText=document.getElementById("deathText");
const deathCanvas=document.getElementById("deathCanvas");
const dctx=deathCanvas.getContext("2d");
dctx.imageSmoothingEnabled=false;
const pauseOverlay=document.getElementById("pauseOverlay");
let previousState="play";
let pauseLocked=false;

function togglePause(){
  if(musicOn&&!menuSoundtrack.paused)applyMusicVolume();
  if(pauseLocked)return;
  if(state==="intro"||state==="gameover"||state==="transition")return;

  pauseLocked=true;

  if(state==="paused"){
    state=(previousState&&previousState!=="paused")?previousState:"play";
    pauseOverlay.classList.add("hidden");
    pauseToggle.textContent="⏸ PAUZE";
    // Gameplaymuziek is bewust uitgeschakeld; alleen geluidseffecten blijven actief.
  }else{
    previousState=state;
    state="paused";
    pauseOverlay.classList.remove("hidden");
    pauseToggle.textContent="▶ VERDER";
    musicTimer=null;
  }

  setTimeout(()=>{pauseLocked=false},180);
}

pauseToggle.addEventListener("pointerdown",e=>{
  e.preventDefault();
  e.stopPropagation();
  togglePause();
});
pauseOverlay.addEventListener("pointerdown",e=>{
  e.preventDefault();
  togglePause();
});

function floorIndex(y){
  let bi=0,bd=999;
  floors.forEach((fy,i)=>{const d=Math.abs(y-fy);if(d<bd){bd=d;bi=i}});
  return bi;
}
function tileX(x){return Math.max(18,Math.min(W-58,Math.floor((x+12)/40)*40))}
function ladderNear(x,y){
  return ladders.find(l=>x+12>l.x-12&&x+12<l.x+30&&y+28>=l.top-5&&y<=l.bottom+5);
}
function chooseLayoutForLevel(levelNumber){
  // Level 1 start altijd met de vertrouwde indeling.
  if(levelNumber===1){
    currentLayoutIndex=0;
  }else{
    const previous=currentLayoutIndex;
    let next=previous;
    while(next===previous && ladderLayouts.length>1){
      next=Math.floor(Math.random()*ladderLayouts.length);
    }
    currentLayoutIndex=next;
  }

  // Maak een kopie zodat latere animaties nooit de basislayout wijzigen.
  ladders=ladderLayouts[currentLayoutIndex].map(l=>({...l}));
}

function clearStartZone(){
  enemies.forEach((e,i)=>{
    if(e.floor===floors.length-1 && e.x<220){
      e.floor=i%4;
      e.x=260+(i%3)*58;
      e.y=floors[e.floor]-24;
      e.dir=-1;
      e.think=100+Math.random()*120;
      e.onLadder=false;
      e.ladder=null;
      e.ladderTargetFloor=null;
      e.trapped=0;
      e.ladderCooldown=150;
    }
  });
}

function ensureGameplayControlsVisible(){
  const controls=document.getElementById("controls");
  const gameOptions=document.getElementById("gameOptions");
  if(controls)controls.classList.remove("hidden");
  if(gameOptions)gameOptions.classList.remove("hidden");
}

function resetPlayerSafely(){
  ensureGameplayControlsVisible();
  player.x=30;
  player.y=floors[4]-player.h;
  player.onLadder=false;
  player.cool=0;
  player.invulnerable=210; // ongeveer 2,5 seconde bescherming
  clearStartZone();
}

function spawnLevel(){
  chooseLayoutForLevel(level);
  keys.left=keys.right=keys.up=keys.down=false;
  pauseOverlay.classList.add("hidden");
  pauseToggle.textContent="⏸ PAUZE";
  holes=[];cracks=[];enemies=[];effects=[];bonus=null;bonusSpawnTimer=300+Math.random()*300;combo=0;comboTimer=0;
  player.x=30;player.y=floors[4]-player.h;player.onLadder=false;player.cool=0;player.invulnerable=210;
  const count=Math.min(3+level,7);
  for(let i=0;i<count;i++){
    const fi=i%4;
    let type="green";
    if(level>=3 && i%4===1)type="red";
    if(level>=5 && i%5===2)type="black";
    if(level>=4 && i===count-1 && Math.random()<0.35)type="gold";

    const typeSpeed=type==="red"?.12:type==="gold"?.08:type==="black"?.03:0;
    const typeHits=type==="black"?3:(level>=4?3:2);

    enemies.push({
      id:enemyIdCounter++,
      type,
      x:410-(i*58)%330,y:floors[fi]-24,floor:fi,dir:i%2?1:-1,
      speed:.41+level*.04+(i%3)*.03+typeSpeed,trapped:0,hitsNeeded:typeHits,
      hitsLeft:typeHits,blink:0,dead:false,
      think:30+Math.random()*110,mood:Math.random(),ladderCooldown:0,
      onLadder:false,ladder:null,ladderTargetFloor:null,holeCooldown:0,slowTimer:0
    });
  }
  clearStartZone();
}
spawnLevel();

function trappedEnemyUnderPlayer(){
  const pc=player.x+player.w/2;
  return enemies.find(e=>e.trapped>0&&e.floor===floorIndex(player.y+player.h)&&Math.abs(pc-(e.x+14))<28);
}

function stamp(){
  audio();
  if(state!=="play"||player.cool>0||player.onLadder)return;

  const enemy=trappedEnemyUnderPlayer();
  if(enemy){
    enemy.hitsLeft--;
    player.cool=player.fastStamp>0?7:18;shake=7;sfxHit();
    effects.push({type:"hit",x:enemy.x+14,y:floors[enemy.floor]-18,t:24});
    if(enemy.hitsLeft<=0){
      enemy.dead=true;
      const occupiedHole=holes.find(h=>h.occupiedBy===enemy.id);
      if(occupiedHole)occupiedHole.occupiedBy=null;

      combo = comboTimer>0 ? combo+1 : 1;
      comboTimer=180;
      const base=enemy.type==="gold"?900:enemy.type==="red"?400:enemy.type==="black"?500:300;
      const comboBonus=combo>1?(combo-1)*200:0;
      const earned=base+comboBonus;
      score+=earned;
      const killStats=getStats();
      killStats.applesDefeated=(Number(killStats.applesDefeated)||0)+1;
      killStats.longestCombo=Math.max(Number(killStats.longestCombo)||0,combo);
      killStats.bestScore=Math.max(Number(killStats.bestScore)||0,score);
      killStats.highestLevel=Math.max(Number(killStats.highestLevel)||1,level);
      saveStats(killStats);

      shake=12;sfxKill();
      effects.push({type:"dust",x:enemy.x+14,y:floors[enemy.floor]-8,t:42});
      effects.push({type:"score",x:enemy.x-2,y:floors[enemy.floor]-34,t:70,text:`+${earned}`});
      if(combo>1)effects.push({type:"combo",x:enemy.x-10,y:floors[enemy.floor]-48,t:70,text:`COMBO x${combo}`});
    }
    return;
  }

  const fi=floorIndex(player.y+player.h);
  if(fi===floors.length-1)return;
  if(Math.abs((player.y+player.h)-floors[fi])>7)return;
  const gx=tileX(player.x);
  if(ladders.some(l=>{
    const sameFloor=(l.top===floors[fi]||l.bottom===floors[fi]);
    const ladderCenter=l.x+10;
    const holeCenter=gx+20;
    return sameFloor && Math.abs(ladderCenter-holeCenter)<9;
  }))return;
  if(holes.some(h=>h.floor===fi&&h.x===gx))return;

  let cr=cracks.find(q=>q.floor===fi&&q.x===gx);
  if(!cr){cr={x:gx,floor:fi,hits:0,timer:700};cracks.push(cr)}
  cr.hits++;cr.timer=700;player.cool=player.fastStamp>0?6:16;shake=3+cr.hits;sfxCrack();

  if(cr.hits>=FLOOR_HITS){
    holes.push({x:gx,floor:fi,timer:520,occupiedBy:null});
    cracks=cracks.filter(q=>q!==cr);
    shake=10;sfxBreak();
  }
}

function bind(id,key){
  const el=document.getElementById(id);
  ['pointerdown','touchstart'].forEach(ev=>el.addEventListener(ev,e=>{e.preventDefault();audio();keys[key]=true}));
  ['pointerup','pointercancel','pointerleave','touchend'].forEach(ev=>el.addEventListener(ev,e=>{e.preventDefault();keys[key]=false}));
}
bind("left","left");bind("right","right");bind("up","up");bind("down","down");
let keyboardDetected=false;

function isTypingTarget(target){
  if(!target)return false;
  const tag=String(target.tagName||"").toLowerCase();
  return tag==="input" || tag==="textarea" || tag==="select" || target.isContentEditable===true;
}

function enableKeyboardMode(){
  if(keyboardDetected)return;
  keyboardDetected=true;
  document.body.classList.add("keyboardMode");
}

window.addEventListener("keydown",e=>{
  if(isTypingTarget(e.target))return;
  enableKeyboardMode();

  const controlKeys=["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"," ","Spacebar","p","P","m","M","Escape"];
  if(controlKeys.includes(e.key))e.preventDefault();

  if(e.key==="ArrowLeft")keys.left=true;
  if(e.key==="ArrowRight")keys.right=true;
  if(e.key==="ArrowUp")keys.up=true;
  if(e.key==="ArrowDown")keys.down=true;

  if((e.key===" "||e.key==="Spacebar")&&!e.repeat){
    stamp();
  }

  if((e.key==="p"||e.key==="P")&&!e.repeat){
    togglePause();
  }

  if((e.key==="m"||e.key==="M")&&!e.repeat){
    toggleMusicFromUser();
  }

  if(e.key==="Escape"&&!e.repeat){
    if(state==="paused"){
      togglePause();
    }
    if(state==="play"||state==="transition"){
      state="intro";
      document.body.classList.remove("gameplayActive");
      keys.left=keys.right=keys.up=keys.down=false;
      pauseOverlay.classList.add("hidden");
      overlay.classList.remove("hidden");
      openIntro();
      if(musicOn)startMenuMusic();
    }else if(state==="intro"){
      showMainMenu();
    }
  }
});

window.addEventListener("keyup",e=>{
  if(isTypingTarget(e.target))return;
  if(e.key==="ArrowLeft")keys.left=false;
  if(e.key==="ArrowRight")keys.right=false;
  if(e.key==="ArrowUp")keys.up=false;
  if(e.key==="ArrowDown")keys.down=false;
});

// Als een fysiek toetsenbord aanwezig lijkt, schakel direct de ruimere desktopweergave in.
if(window.matchMedia("(pointer:fine)").matches && window.innerWidth>=700){
  document.body.classList.add("keyboardMode");
  keyboardDetected=true;
}
document.getElementById("stamp").addEventListener("pointerdown",e=>{e.preventDefault();stamp()});


function updatePlayer(){
  if(player.cool>0)player.cool--;if(player.invulnerable>0)player.invulnerable--;
  const lad=ladderNear(player.x,player.y);
  if(lad&&(keys.up||keys.down||player.onLadder)){
    player.onLadder=true;
    player.x+=(lad.x-player.x)*.38;
    if(keys.up)player.y-=2.3;
    if(keys.down)player.y+=2.3;
    if(player.y<lad.top-player.h){player.y=lad.top-player.h;player.onLadder=false}
    if(player.y>lad.bottom-player.h){player.y=lad.bottom-player.h;player.onLadder=false}
    return;
  }

  player.onLadder=false;
  if(keys.left){player.x-=2.25;player.dir=-1}
  if(keys.right){player.x+=2.25;player.dir=1}
  player.x=Math.max(10,Math.min(W-player.w-10,player.x));

  const fi=floorIndex(player.y+player.h);
  const fy=floors[fi];
  const center=player.x+player.w/2;
  const under=holes.find(h=>h.floor===fi&&center>h.x&&center<h.x+40);

  // Zodra een appel vastzit, wordt de HELE opening beloopbaar.
  const trappedInHole=enemies.find(e=>{
    if(e.trapped<=0||e.floor!==fi)return false;
    const hole=holes.find(h=>h.floor===fi&&h.occupiedBy===e.id);
    return !!hole;
  });

  let supported=false;
  if(under&&trappedInHole){
    const h=holes.find(h=>h.floor===fi&&h.occupiedBy===trappedInHole.id);
    supported = !!h && center>h.x-8 && center<h.x+48;
  }

  if(under&&!supported){
    player.y+=3.5;
    if(player.y+player.h>floors[fi+1])player.y=floors[fi+1]-player.h;
  }else{
    player.y=fy-player.h;
  }
}

function startEnemyLadder(e,l,targetFloor){
  e.onLadder=true;
  e.ladder=l;
  e.ladderTargetFloor=targetFloor;
  e.x=l.x-4;
  e.ladderCooldown=120;
}


function drawDeathScene(progress){
  dctx.fillStyle="#fff";
  dctx.fillRect(0,0,deathCanvas.width,deathCanvas.height);
  dctx.fillStyle="#111";
  dctx.strokeStyle="#111";

  // Ground
  dctx.fillRect(10,125,220,7);

  // Appleiet
  dctx.beginPath();
  dctx.arc(168,104,15,0,Math.PI*2);
  dctx.fill();
  dctx.fillRect(166,83,4,8);
  dctx.fillRect(156,117,7,5);
  dctx.fillRect(174,117,7,5);
  dctx.fillStyle="#fff";
  dctx.fillRect(161,99,3,3);
  dctx.fillRect(173,99,3,3);
  dctx.fillStyle="#111";

  // Player falls backwards in stages
  const x=78;
  const y=94-Math.sin(Math.min(progress,0.55)*Math.PI)*18;
  const angle=Math.min(progress*1.8,1.4);
  dctx.save();
  dctx.translate(x+12,y+14);
  dctx.rotate(-angle);
  dctx.translate(-12,-14);

  dctx.fillRect(7,0,10,8);
  dctx.fillRect(3,8,18,13);
  dctx.fillRect(0,12,4,8);
  dctx.fillRect(20,12,4,8);
  dctx.fillRect(3,21,7,7);
  dctx.fillRect(14,21,7,7);
  dctx.restore();

  // Stars
  if(progress>.35){
    dctx.font="18px monospace";
    dctx.fillText("✦",48,58);
    dctx.fillText("✦",92,48);
    dctx.fillText("✦",120,66);
  }

  dctx.font="bold 14px monospace";
  if(progress>.12)dctx.fillText("BAM!",92,28);
}

function animateDeath(startTime,duration,isGameOver){
  const now=performance.now();
  const progress=Math.min((now-startTime)/duration,1);
  drawDeathScene(progress);

  if(progress<1){
    requestAnimationFrame(()=>animateDeath(startTime,duration,isGameOver));
  }
}

function showDeathSequence(isGameOver){
  if(musicOn&&!menuSoundtrack.paused){ menuSoundtrack.volume=.05; }
  if(deathAnimating)return;
  deathAnimating=true;
  state="dying";
  document.body.classList.remove("gameplayActive");
  keys.left=keys.right=keys.up=keys.down=false;
  pauseOverlay.classList.add("hidden");

  deathTitle.textContent=isGameOver?"GAME OVER":"AUW!";
  deathText.textContent=isGameOver
    ?"Je laatste leven is voorbij..."
    :"Even bijkomen...";

  deathOverlay.classList.remove("hidden");
  sfxHurt();
  animateDeath(performance.now(),1150,isGameOver);

  setTimeout(()=>{
    deathText.textContent=isGameOver?"Eindscore wordt klaargemaakt...":"Nieuw leven over 1...";
  },1150);

  setTimeout(()=>{
    deathOverlay.classList.add("hidden");
    deathAnimating=false;

    if(isGameOver){
      state="gameover";
      showGameOverPanel();
    }else{
      resetPlayerSafely();
      ensureGameplayControlsVisible();
      startFreeze=90;
      state="play";
      if(musicOn&&!menuSoundtrack.paused)applyMusicVolume();
      document.body.classList.add("gameplayActive");
    }
  },2200);
}

function updateEnemies(){
  if(startFreeze>0){
    startFreeze--;
    return;
  }
  enemies.forEach(e=>{
    if(e.dead)return;

    if(e.trapped>0){
      e.trapped--;e.blink++;
      if(e.trapped<=0){
        const occupiedHole=holes.find(h=>h.occupiedBy===e.id);
        if(occupiedHole)occupiedHole.occupiedBy=null;

        e.trapped=0;
        e.y=floors[e.floor]-24;
        e.dir=(e.dir===0?1:e.dir);
        e.x=Math.max(14,Math.min(W-42,e.x+e.dir*30));
        e.hitsLeft=e.hitsNeeded;
        e.holeCooldown=120;
        e.think=70+Math.random()*100;

        effects.push({type:"escape",x:e.x,y:e.y-8,t:45,text:"ONTsnapt!"});
      }
      return;
    }

    // Soepel ladderklimmen: eerst naar het midden van de ladder,
    // daarna pixel voor pixel omhoog of omlaag.
    if(e.onLadder && e.ladder){
      const targetY=floors[e.ladderTargetFloor]-24;
      e.x+=(e.ladder.x-4-e.x)*.28;
      const dy=targetY-e.y;
      const climbSpeed=(1.25+Math.min(level*.03,.35))*(e.slowTimer>0?.5:1);

      if(Math.abs(dy)<=climbSpeed+1){
        e.y=targetY;
        e.floor=e.ladderTargetFloor;
        e.onLadder=false;
        e.ladder=null;
        e.ladderTargetFloor=null;
        e.think=70+Math.random()*90;e.ladderCooldown=120;e.holeCooldown=45;
      }else{
        e.y+=Math.sign(dy)*climbSpeed;
      }
      return;
    }

    const pc=player.x+12;
    if(e.ladderCooldown>0)e.ladderCooldown--; if(e.holeCooldown>0)e.holeCooldown--;
    e.think--;

    if(e.think<=0){
      const roll=Math.random();

      // Meestal rustig richting de speler, maar niet altijd.
      if(roll<0.64){
        e.dir=pc>(e.x+14)?1:-1;
      }else if(roll<0.82){
        e.dir=Math.random()<.5?-1:1;
      }else{
        e.dir=pc>(e.x+14)?-1:1;
      }

      // Iets langer vasthouden aan een keuze voorkomt zenuwachtig heen-en-weer lopen.
      e.think=60+Math.random()*150;
    }

    // Minder vaak spontaan omdraaien.
    if(Math.random()<0.0012)e.dir*=-1;

    // Kies alleen een ladder wanneer de appel er echt vlakbij staat.
    // De kans is hoger wanneer de speler op een andere verdieping staat.
    if(e.ladderCooldown===0){
      for(const l of ladders){
        const near=Math.abs((e.x+14)-(l.x+10))<8;
        if(!near)continue;

        const playerFloor=floorIndex(player.y+player.h);
        const wantsOtherFloor=playerFloor!==e.floor;

        // Als de speler op een andere verdieping staat, zoekt de appel
        // duidelijk vaker een ladder. Op dezelfde verdieping blijft hij rustiger.
        const floorDistance=Math.abs(playerFloor-e.floor);
        const chance=wantsOtherFloor
          ? 0.045 + Math.min(floorDistance*0.012,0.035)
          : 0.006;

        if(Math.random()<chance){
          if(l.top===floors[e.floor] && e.floor<floors.length-1){
            startEnemyLadder(e,l,e.floor+1);
            return;
          }
          if(l.bottom===floors[e.floor] && e.floor>0){
            startEnemyLadder(e,l,e.floor-1);
            return;
          }
        }
      }
    }

    if(e.type==="black"){
      const ahead=e.x+14+e.dir*22;
      const danger=holes.find(h=>h.floor===e.floor&&h.occupiedBy===null&&ahead>h.x&&ahead<h.x+40);
      if(danger && Math.random()<0.82)e.dir*=-1;
    }

    e.x+=e.dir*e.speed*(e.slowTimer>0?.5:1);
    if(e.x<14){e.x=14;e.dir=1}
    if(e.x>W-42){e.x=W-42;e.dir=-1}


    const occupiedBridge=holes.find(h=>
      h.floor===e.floor &&
      h.occupiedBy!==null &&
      e.x+14>h.x-4 &&
      e.x+14<h.x+44
    );
    if(occupiedBridge){
      e.y=floors[e.floor]-24;
    }

    const h=holes.find(h=>
      h.floor===e.floor &&
      h.occupiedBy===null &&
      e.holeCooldown<=0 &&
      e.x+14>h.x+2 &&
      e.x+14<h.x+38
    );
    if(h){
      h.occupiedBy=e.id;
      e.x=h.x+6;
      e.y=floors[e.floor]-9;
      e.trapped=300-Math.min(level*6,60);
      e.hitsLeft=e.hitsNeeded;
      if(performance.now()-lastTrapSound>100){
        sfxTrap();
        lastTrapSound=performance.now();
      }
    }else{
      e.y=floors[e.floor]-24;
    }

    const collide=Math.abs((player.x+12)-(e.x+14))<20&&Math.abs((player.y+14)-(e.y+12))<21;
    if(collide&&e.trapped<=0&&player.invulnerable<=0&&state==="play"){
      lives--;
      shake=11;
      const deathStats=getStats();
      deathStats.deaths=(Number(deathStats.deaths)||0)+1;
      deathStats.bestScore=Math.max(Number(deathStats.bestScore)||0,score);
      deathStats.highestLevel=Math.max(Number(deathStats.highestLevel)||1,level);
      saveStats(deathStats);
      showDeathSequence(lives<=0);
      return;
    }
  });

  enemies=enemies.filter(e=>!e.dead);
  if(enemies.length===0 && !levelTransitioning && state==="play"){
    score+=500;
    const completedLevel=level;
    level++;
    showLevelTransition(completedLevel,level);
  }
}


function spawnBonus(){
  const types=["cherry","banana","star","clock"];
  const type=types[Math.floor(Math.random()*types.length)];

  let floor=Math.floor(Math.random()*4);
  let x=60+Math.random()*(W-120);

  for(let tries=0;tries<20;tries++){
    floor=Math.floor(Math.random()*4);
    x=60+Math.random()*(W-120);

    const nearHole=holes.some(h=>h.floor===floor && Math.abs((h.x+20)-x)<55);
    const nearLadder=ladders.some(l=>
      (l.top===floors[floor]||l.bottom===floors[floor]) &&
      Math.abs((l.x+10)-x)<35
    );

    if(!nearHole&&!nearLadder)break;
  }

  bonus={type,floor,x,y:floors[floor]-18,timer:600};
}
function collectBonus(){
  if(!bonus)return;
  let earned=0;
  if(bonus.type==="cherry")earned=500;
  if(bonus.type==="banana")earned=1000;
  if(bonus.type==="star"){
    earned=250;
    player.fastStamp=420;
  }
  if(bonus.type==="clock"){
    earned=250;
    enemies.forEach(e=>e.slowTimer=300);
  }
  score+=earned;
  effects.push({type:"score",x:bonus.x,y:bonus.y-12,t:70,text:`+${earned}`});
  tone(520,.08,"square",.04,760);
  bonus=null;
  bonusSpawnTimer=500+Math.random()*500;
}
function updateBonus(){
  if(player.fastStamp>0)player.fastStamp--;
  enemies.forEach(e=>{if(e.slowTimer>0)e.slowTimer--});

  if(bonus){
    bonus.timer--;
    const sameFloor=Math.abs((player.y+player.h)-floors[bonus.floor])<7;
    if(sameFloor && Math.abs((player.x+12)-bonus.x)<22)collectBonus();
    if(bonus && bonus.timer<=0){
      bonus=null;
      bonusSpawnTimer=300+Math.random()*500;
    }
  }else{
    bonusSpawnTimer--;
    if(bonusSpawnTimer<=0)spawnBonus();
  }
}

function update(){
  if(state!=="play")return;
  frame++;updatePlayer();updateEnemies();updateBonus();
  holes.forEach(h=>{
    // Een bezet gat blijft bestaan zolang de appel erin zit.
    if(h.occupiedBy===null)h.timer--;
  });
  holes=holes.filter(h=>h.timer>0||h.occupiedBy!==null);
  cracks.forEach(q=>q.timer--);cracks=cracks.filter(q=>q.timer>0);
  effects.forEach(e=>e.t--);effects=effects.filter(e=>e.t>0);
  if(comboTimer>0){comboTimer--;}else{combo=0;comboTimer=0;}
  if(shake>0)shake--;
}

function drawPlayer(x,y){
  ctx.fillRect(x+7,y,10,8);
  ctx.fillRect(x+3,y+8,18,13);
  ctx.fillRect(x,y+12,4,8);ctx.fillRect(x+20,y+12,4,8);
  const step=Math.floor(frame/7)%2;
  if(step===0){ctx.fillRect(x+3,y+21,7,7);ctx.fillRect(x+14,y+21,7,7)}
  else{ctx.fillRect(x+6,y+21,7,7);ctx.fillRect(x+11,y+21,7,7)}
}
function drawApple(e){
  if(e.trapped>0&&e.trapped<90&&Math.floor(e.blink/6)%2===0)return;
  ctx.save();
  if(e.type==="red")ctx.setLineDash([3,2]);
  if(e.type==="gold")ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(e.x+14,e.y+11,13,0,Math.PI*2);
  if(e.type==="red"){ctx.stroke();ctx.fill()}
  else ctx.fill();
  ctx.fillRect(e.x+12,e.y-5,4,7);
  ctx.fillRect(e.x+3,e.y+21,6,5);ctx.fillRect(e.x+19,e.y+21,6,5);
  ctx.fillStyle="#fff";
  ctx.fillRect(e.x+7,e.y+7,3,3);ctx.fillRect(e.x+18,e.y+7,3,3);
  ctx.fillStyle="#111";
  if(e.type==="black"){
    ctx.fillStyle="#fff";ctx.fillRect(e.x+3,e.y+12,22,3);ctx.fillStyle="#111";
  }
  if(e.type==="gold"){
    ctx.strokeRect(e.x-1,e.y-7,30,34);
  }
  if(e.trapped>0){
    for(let i=0;i<e.hitsLeft;i++)ctx.fillRect(e.x+3+i*8,e.y-10,6,4);
  }
  ctx.restore();
}
function drawFloor(a,b,y){
  ctx.fillRect(a,y-5,b-a,10);
  ctx.fillStyle="#fff";
  for(let x=a+8;x<b;x+=22)ctx.fillRect(x,y-1,10,2);
  ctx.fillStyle="#111";
}
function drawEffects(){
  effects.forEach(e=>{
    if(e.type==="dust"){
      const r=(42-e.t)*.7;
      ctx.beginPath();ctx.arc(e.x-r,e.y,r*.45,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(e.x+r,e.y,r*.45,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(e.x,e.y-r*.35,r*.55,0,Math.PI*2);ctx.fill();
    }else if(e.type==="score"){
      ctx.font="bold 12px monospace";ctx.fillText(e.text,e.x,e.y-(55-e.t)*.3);
    }else if(e.type==="combo"){
      ctx.font="bold 11px monospace";ctx.fillText(e.text,e.x,e.y-(70-e.t)*.25);
    }else if(e.type==="escape"){
      ctx.font="bold 10px monospace";ctx.fillText("ONTSNAPT!",e.x,e.y-(45-e.t)*.2);
    }else{
      ctx.font="bold 12px monospace";ctx.fillText("BAM!",e.x-12,e.y);
    }
  });
}

function drawBonus(){
  if(!bonus)return;
  const x=bonus.x,y=bonus.y;
  ctx.save();
  ctx.font="bold 16px monospace";
  const symbol=bonus.type==="cherry"?"●●":bonus.type==="banana"?")":bonus.type==="star"?"★":"◷";
  ctx.fillText(symbol,x-8,y);
  if(bonus.timer<120 && Math.floor(bonus.timer/8)%2===0){
    ctx.fillStyle="#fff";ctx.fillRect(x-12,y-18,30,24);
  }
  ctx.restore();
}

function draw(){
  ctx.save();
  if(shake>0)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  ctx.fillStyle="#fff";ctx.fillRect(-10,-10,W+20,H+20);
  ctx.fillStyle="#111";ctx.strokeStyle="#111";
  ctx.font="12px monospace";
  ctx.fillText(`SCORE ${String(score).padStart(5,"0")}`,12,18);
  ctx.fillText(`LEVEL ${level}`,190,18);
  ctx.fillText(`ZAAL ${currentLayoutIndex+1}`,270,18);
  ctx.fillText(`LEVENS ${lives}`,385,18);
  if(player.invulnerable>0){
    ctx.font="10px monospace";
    ctx.fillText("VEILIGE START",14,298);
    ctx.font="12px monospace";
  }
  ctx.lineWidth=3;ctx.strokeRect(8,28,W-16,H-32);

  floors.forEach((fy,fi)=>{
    let segs=[[12,W-12]];
    holes.filter(h=>h.floor===fi).forEach(h=>{
      const n=[];
      segs.forEach(([a,b])=>{
        if(h.x>b||h.x+40<a)n.push([a,b]);
        else{if(a<h.x)n.push([a,h.x]);if(h.x+40<b)n.push([h.x+40,b])}
      });
      segs=n;
    });
    segs.forEach(([a,b])=>drawFloor(a,b,fy));
  });

  cracks.forEach(q=>{
    const y=floors[q.floor];
    ctx.lineWidth=2;ctx.beginPath();
    ctx.moveTo(q.x+8,y-7);ctx.lineTo(q.x+18,y);ctx.lineTo(q.x+12,y+7);
    if(q.hits>1){ctx.moveTo(q.x+31,y-7);ctx.lineTo(q.x+22,y);ctx.lineTo(q.x+30,y+7)}
    ctx.stroke();
  });

  ladders.forEach(l=>{
    ctx.lineWidth=2;ctx.beginPath();
    ctx.moveTo(l.x,l.top);ctx.lineTo(l.x,l.bottom);
    ctx.moveTo(l.x+20,l.top);ctx.lineTo(l.x+20,l.bottom);ctx.stroke();
    for(let y=l.top+8;y<l.bottom;y+=10){
      ctx.beginPath();ctx.moveTo(l.x,y);ctx.lineTo(l.x+20,y);ctx.stroke();
    }
  });

  if(player.invulnerable<=0 || Math.floor(player.invulnerable/8)%2===0){
    drawPlayer(Math.round(player.x),Math.round(player.y));
  }
  enemies.forEach(drawApple);
  drawBonus();
  drawEffects();

  if(state==="gameover"){
    ctx.fillStyle="rgba(255,255,255,.95)";ctx.fillRect(70,108,340,92);
    ctx.fillStyle="#111";ctx.font="bold 22px monospace";ctx.fillText("GAME OVER",170,143);
    ctx.font="13px monospace";ctx.fillText("Tik STAMP om opnieuw te beginnen",110,173);
  }
  ctx.restore();
}
function loop(){update();draw();requestAnimationFrame(loop)}
loop();
