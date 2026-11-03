const toggle=document.querySelector('.nav-toggle');
const navigation=toggle&&document.getElementById(toggle.getAttribute('aria-controls'));

if(toggle&&navigation){
 const mobile=window.matchMedia('(max-width: 700px)');
 const isOpen=()=>toggle.getAttribute('aria-expanded')==='true';
 const setOpen=open=>{
  toggle.setAttribute('aria-expanded',String(open));
  toggle.setAttribute('aria-label',open?'Chiudi menu':'Apri menu');
 };
 const closeMenu=(restoreFocus=false)=>{
  setOpen(false);
  if(restoreFocus&&mobile.matches)toggle.focus();
 };

 toggle.addEventListener('click',()=>setOpen(!isOpen()));
 navigation.addEventListener('click',event=>{
  if(event.target.closest?.('a'))closeMenu(true);
 });
 // This is a non-modal disclosure: let Tab leave it without covering the new focus.
 document.addEventListener('focusin',event=>{
  if(isOpen()&&event.target!==toggle&&!navigation.contains(event.target))closeMenu();
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&isOpen())closeMenu(true);
 });
 mobile.addEventListener('change',event=>{
  closeMenu(event.matches&&navigation.contains(document.activeElement));
 });
 // Collapse only after the event handlers are ready; keep links visible without JS.
 toggle.setAttribute('data-ready','true');
}
