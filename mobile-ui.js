/* Fit OS mobile header controller. No fitness data is altered. */
(()=>{
  'use strict';
  const toggle=document.getElementById('cloudMenuToggle');
  const panel=document.getElementById('cloudMenuPanel');
  const menu=document.getElementById('cloudMenu');
  if(!toggle||!panel||!menu)return;
  const isMobile=()=>window.matchMedia('(max-width: 1536px)').matches;
  function setOpen(open){
    if(!isMobile()){
      panel.hidden=false; // Cloud buttons stay visible in the desktop header.
      toggle.setAttribute('aria-expanded','false');
      return;
    }
    panel.hidden=!open;
    toggle.setAttribute('aria-expanded',String(open));
  }
  toggle.addEventListener('click',(event)=>{
    event.stopPropagation();
    setOpen(panel.hidden);
  });
  document.addEventListener('click',(event)=>{
    if(!menu.contains(event.target))setOpen(false);
  });
  // Don't close on sign-in until Firebase's popup has been initiated.
  for(const id of ['cloudLogin','cloudUpload','cloudDownload','topImport']){
    const button=document.getElementById(id);
    if(button)button.addEventListener('click',()=>setOpen(false));
  }
  document.addEventListener('keydown',(event)=>{
    if(event.key==='Escape'&&!panel.hidden){setOpen(false);toggle.focus()}
  });
  window.addEventListener('resize',()=>{
    setOpen(false);
    if(window.innerWidth>1280){
      document.getElementById('sidebar')?.classList.remove('open');
      document.getElementById('mobileShade')?.classList.remove('show');
    }
  },{passive:true});
  setOpen(false);
})();
