// Safety checks: headband connected, quality threshold, emergency stop
(function(){
  const state = {headbandConnected:true,emergency:false,qualityThreshold:0.45};
  // expose setter for UI or tests
  window.App.safetyState = state;

  function evaluate(){
    // default safe
    let safe = state.headbandConnected && !state.emergency;
    let reason = safe? 'ok' : 'disabled';
    window.App.dispatchEvent(new CustomEvent('safety:status',{detail:{safe,reason}}));
  }

  window.App.addEventListener('analyzer:data',(e)=>{
    const q = e.detail.quality;
    if(q < state.qualityThreshold) {
      window.App.dispatchEvent(new CustomEvent('safety:status',{detail:{safe:false,reason:'poor_signal'}}));
    } else evaluate();
  });

  window.App.addEventListener('brain:state',(e)=>{
    if(e.detail.state==='Fatigue'){
      window.App.dispatchEvent(new CustomEvent('safety:status',{detail:{safe:false,reason:'fatigue_detected'}}));
    }
  });

  window.App.toggleEmergency = (v)=>{ state.emergency = !!v; evaluate(); };
})();
