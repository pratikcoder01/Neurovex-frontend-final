// App bootstrap + simple EventBus
window.App = new EventTarget();
window.App.state = {demo: false};

function startDemo(){
  if(window.App.state.demo) return;
  window.App.state.demo = true;
  window.dispatchEvent(new CustomEvent('demo:start'));
}

document.addEventListener('DOMContentLoaded', ()=>{
  const start = document.getElementById('startDemo');
  if(start) start.addEventListener('click', startDemo);
});
