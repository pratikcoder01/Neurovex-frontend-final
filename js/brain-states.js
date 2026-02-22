// Pattern detection: decide 'Focus','Relax','Fatigue' based on band ratios
(function(){
  const thresholds = {betaHigh:0.18,alphaHigh:0.12,gammaHigh:0.05};
  window.App.addEventListener('analyzer:data', (e)=>{
    const {bands,quality} = e.detail;
    const beta = bands.beta; const alpha = bands.alpha; const gamma = bands.gamma;
    let state='Relax'; let reason=''; let confidence=0.5;
    if(beta>thresholds.betaHigh && alpha< thresholds.alphaHigh){ state='Focus'; reason='High beta + low alpha'; confidence=0.8; }
    else if(alpha>thresholds.alphaHigh && beta< thresholds.betaHigh){ state='Relax'; reason='High alpha'; confidence=0.75; }
    else if(beta<0.06 && alpha<0.06){ state='Fatigue'; reason='Low overall activity'; confidence=0.85; }
    // degrade confidence by quality
    confidence = Math.max(0, Math.min(1, confidence * quality));
    const out = {state,reason,confidence,safe: confidence>0.25};
    window.App.dispatchEvent(new CustomEvent('brain:state',{detail:out}));
  });
})();
