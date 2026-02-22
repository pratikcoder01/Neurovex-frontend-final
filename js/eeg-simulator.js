// Demo EEG simulator: emits 'eeg:data' events
(function(){
  if(!window) return;
  const ctx = {t:0};
  function generateSample(){
    ctx.t += 1/128; // 128Hz
    // base rhythms
    const delta = Math.sin(2*Math.PI*1*ctx.t) * (Math.random()*0.6+0.2);
    const theta = Math.sin(2*Math.PI*5*ctx.t) * (Math.random()*0.4+0.1);
    const alpha = Math.sin(2*Math.PI*10*ctx.t) * (Math.random()*0.5+0.1);
    const beta  = Math.sin(2*Math.PI*20*ctx.t) * (Math.random()*0.7+0.1);
    const gamma = Math.sin(2*Math.PI*40*ctx.t) * (Math.random()*0.3+0.05);
    const raw = delta+theta+alpha+beta+gamma + (Math.random()-0.5)*0.05;
    // quality metric (0..1)
    const quality = 0.8 + (Math.random()*0.2);
    return {timestamp:Date.now(), raw, bands:{delta,theta,alpha,beta,gamma}, quality};
  }

  let running=false; let intervalId=null;
  function start(){
    if(running) return; running=true;
    intervalId = setInterval(()=>{
      const s = generateSample();
      window.App.dispatchEvent(new CustomEvent('eeg:data',{detail:s}));
    }, 1000/32); // emit 32 times/sec
  }
  function stop(){ running=false; clearInterval(intervalId); }

  window.addEventListener('demo:start', start);
  window.App.eegSim = {start,stop};
})();
