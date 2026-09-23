/* Shared resilience helpers. No dependencies and no changes to browser globals. */
(function(root){
  'use strict';
  function storage(name){
    const memory=new Map();
    let backend;
    try { backend=root[name]; } catch (_) { /* Private/restricted browser. */ }
    return {
      getItem(key){
        if(memory.has(key))return memory.get(key);
        try{return backend?.getItem(key)??null;}catch(_){return null;}
      },
      setItem(key,value){
        memory.set(key,String(value));
        try{backend?.setItem(key,String(value));}catch(_){/* Keep this session playable. */}
      },
      removeItem(key){
        memory.set(key,null);
        try{backend?.removeItem(key);}catch(_){}
      }
    };
  }
  async function fetchWithTimeout(url,options={}){
    const controller=new AbortController();
    const upstream=options.signal;
    const abort=()=>controller.abort(upstream?.reason);
    if(upstream?.aborted)abort();
    else upstream?.addEventListener('abort',abort,{once:true});
    const timer=setTimeout(()=>controller.abort(),10000);
    try{return await root.fetch(url,{...options,signal:controller.signal});}
    finally{clearTimeout(timer);upstream?.removeEventListener('abort',abort);}
  }
  function fixedStep(update,step=1000/60){
    let previous=null,accumulator=0;
    return timestamp=>{
      if(previous===null){previous=timestamp;return;}
      const elapsed=timestamp-previous;previous=timestamp;
      if(elapsed<0||elapsed>250){accumulator=0;return;}
      accumulator+=elapsed;
      while(accumulator+1e-7>=step){update();accumulator-=step;}
    };
  }
  const api={storage,fetchWithTimeout,fixedStep};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.StampertjesRuntime=api;
})(typeof window!=='undefined'?window:globalThis);
