// Lightweight analyzer: aggregate band power and smooth
(function(){
  const buffer=[]; const maxBuf=64;
  const smooth=(arr)=>{const sum=arr.reduce((a,b)=>a+b,0);return sum/arr.length};

  window.App.addEventListener('eeg:data', (e)=>{
    const d = e.detail;
    buffer.push(d);
    if(buffer.length>maxBuf) buffer.shift();
    // compute average band powers over buffer
    const avg = {delta:0,theta:0,alpha:0,beta:0,gamma:0};
    buffer.forEach(s=>{ for(const k in s.bands) avg[k]+=Math.abs(s.bands[k]); });
    for(const k in avg) avg[k] = avg[k]/buffer.length;
    // simple signal quality from recent samples
    const quality = smooth(buffer.slice(-8).map(s=>s.quality));
    window.App.dispatchEvent(new CustomEvent('analyzer:data',{detail:{bands:avg,quality}}));
  });
})();
