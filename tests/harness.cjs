const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function boot({storage={},blockedStorage=false,url='https://stampertjes.test/'}={}){
  const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url,runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window, requests=[],timers=new Map();let timerId=0;
  const ctx=new Proxy({measureText:text=>({width:String(text).length*8}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
  w.HTMLCanvasElement.prototype.getContext=()=>ctx;
  w.HTMLMediaElement.prototype.play=()=>Promise.resolve();w.HTMLMediaElement.prototype.pause=()=>{};w.HTMLMediaElement.prototype.load=()=>{};
  w.AudioContext=class{constructor(){this.state='running';this.currentTime=0;this.destination={}}createBuffer(){return {}}createBufferSource(){return {connect(){},start(){}}}createOscillator(){return {frequency:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},start(){},stop(){}}}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}}};
  w.matchMedia=()=>({matches:false,addEventListener(){}});w.requestAnimationFrame=()=>1;
  w.setTimeout=(fn,delay)=>{timers.set(++timerId,{fn,delay});return timerId;};w.clearTimeout=id=>timers.delete(id);
  w.setInterval=()=>1;w.clearInterval=()=>{};
  w.prompt=()=>null;w.confirm=()=>true;
  w.fetch=async(url,options={})=>{requests.push({url:String(url),options});return {ok:true,status:200,json:async()=>String(url).includes('highscores')?[]:{},text:async()=>''};};
  for(const [k,v]of Object.entries(storage))w.localStorage.setItem(k,v);
  if(blockedStorage)Object.defineProperty(w,'localStorage',{get(){throw new Error('storage blocked')}});
  const context=dom.getInternalVMContext();
  for(const filename of ['runtime.js','config.js','game.js','castle-atlas.js'])vm.runInContext(fs.readFileSync(path.join(root,filename),'utf8'),context,{filename});
  const evaluate=source=>vm.runInContext(source,context);
  return {dom,w,requests,timers,evaluate,runTimers(delay){for(const[id,timer]of [...timers])if(timer.delay===delay){timers.delete(id);timer.fn();}},close(){dom.window.close();}};
}
module.exports={boot};
