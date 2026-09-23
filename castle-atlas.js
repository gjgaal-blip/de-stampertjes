/* The atlas reuses the existing room layouts and practice engine. */
const ROOM_GUIDES=[
  ['🚪','Je eerste stappen','Leer lopen, klimmen en drie keer stampen.'],
  ['⚔️','Kies je positie','Gebruik de ladders om de Appelieten te slim af te zijn.'],
  ['📚','Kennis is macht','Verken de galerijen en plan je ontsnappingsroute.'],
  ['⛓️','Diep onder het kasteel','Houd een ladder dichtbij in de donkere kerkers.'],
  ['👑','Een koninklijke uitdaging','Bewaar je rust tussen troon en banieren.'],
  ['🍇','Tussen de vaten','Wissel van verdieping voordat je wordt ingesloten.'],
  ['⚗️','Een gevaarlijk experiment','Combineer goed geplaatste gaten met snelle bewegingen.'],
  ['💎','Op jacht naar punten','Lok je tegenstanders en bouw je combo op.'],
  ['🕯️','Geheime doorgangen','Leer de zigzagroutes van de catacomben kennen.'],
  ['🏰','Boven alles uit','Gebruik de verticale routes naar de top.']
];
function refreshPersonalSummary(){
  const stats=getStats();
  const summary=document.getElementById('personalSummary');
  if(!summary)return;
  const items=[['BESTE SCORE',Number(stats.bestScore)||0],['HOOGSTE LEVEL',Number(stats.highestLevel)||1],['POTJES',Number(stats.gamesPlayed)||0]];
  summary.replaceChildren(...items.map(([label,value])=>{
    const item=document.createElement('div'),number=document.createElement('strong'),caption=document.createElement('span');
    number.textContent=value.toLocaleString('nl-NL');caption.textContent=label;
    item.append(number,caption);return item;
  }));
}
function renderCastleAtlas(){
  const highest=Number(getStats().highestLevel)||1;
  document.getElementById('roomsGrid').innerHTML=CASTLE_ROOM_THEMES.map((room,i)=>{
    const [icon,subtitle,tip]=ROOM_GUIDES[i];
    return `<article class="roomCard"><div class="roomTop"><span class="roomIcon" aria-hidden="true">${icon}</span><span class="roomNumber">KAMER ${String(i+1).padStart(2,'0')}</span></div><h3>${room.name}</h3><strong class="roomSubtitle">${subtitle}</strong><p>${tip}</p><span class="roomProgress">${i+1<=highest?'✓ BEREIKT':'NOG TE ONTDEKKEN'}</span><button data-practice-level="${i+1}" aria-label="Oefen ${room.name}">OEFEN DEZE KAMER →</button></article>`;
  }).join('');
}
activateButton(document.getElementById('roomsMenuBtn'),()=>{
  stopAttractMode();renderCastleAtlas();showMenuSection(document.getElementById('roomsSection'));
});
document.getElementById('roomsGrid').addEventListener('click',event=>{
  const button=event.target.closest('[data-practice-level]');
  if(!button)return;
  startGame(Number(button.dataset.practiceLevel));
});
// Focus follows menu navigation; Escape and Tab remain usable in pause dialogs.
const pauseFocusObserver=new MutationObserver(()=>{
  if(!pauseOverlay.classList.contains('hidden')){
    const target=pauseConfirmStop.classList.contains('hidden')?pauseResumeBtn:pauseCancelStopBtn;
    target.focus();
  }else if(state==='play')pauseToggle.focus();
});
pauseFocusObserver.observe(pauseOverlay,{attributes:true,attributeFilter:['class']});
pauseFocusObserver.observe(pauseConfirmStop,{attributes:true,attributeFilter:['class']});
pauseOverlay.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const buttons=[...pauseOverlay.querySelectorAll('button')].filter(button=>button.getClientRects().length&&!button.disabled);
  const first=buttons[0],last=buttons.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
refreshPersonalSummary();
