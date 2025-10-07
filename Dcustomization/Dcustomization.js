// Smooth-scroll for internal anchors
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if(el){
      e.preventDefault();
      el.scrollIntoView({behavior:'smooth', block:'start'});
    }
  });
});

// Template confirm modal
(function(){
  const modal = document.getElementById('tplModal');
  if(!modal) return;

  const title = document.getElementById('tplModalTitle');
  const text  = document.getElementById('tplModalText');
  const img   = document.getElementById('tplModalImg');
  const confirmBtn = document.getElementById('tplConfirmBtn');
  const cancelBtn  = document.getElementById('tplCancelBtn');
  const closeBtn   = modal.querySelector('.tpl-modal__close');

  function openModal(opts){
    title.textContent = 'Use this template?';
    text.textContent  = `Are you sure you want to use "${opts.title}"?`;
    img.src = opts.img || '';
    img.alt = opts.title || '';
    confirmBtn.href = opts.href || '#';
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(){
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.use-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      openModal({
        title: btn.dataset.title || 'Selected template',
        img:   btn.dataset.img   || '',
        href:  btn.dataset.href  || btn.getAttribute('href') || '#'
      });
    });
  });

  confirmBtn.addEventListener('click', ()=> closeModal());
  cancelBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e)=>{ if(e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal(); });
})();

// HOW-TO rail + indicator logic
(function(){
  const stepsEl = document.querySelector('.howto .steps');
  if(!stepsEl) return;
  const indicator = document.getElementById('howtoIndicator');
  const items = Array.from(stepsEl.querySelectorAll('.stepitem'));

  function setActive(i){
    items.forEach((el,idx)=> el.classList.toggle('is-active', idx===i));
    const target = items[i];
    const rect = target.getBoundingClientRect();
    const host = stepsEl.getBoundingClientRect();
    const top = rect.top - host.top + stepsEl.scrollTop;
    const pad = 4;
    indicator.style.height = Math.max(48, rect.height - pad*2) + 'px';
    indicator.style.transform = `translateY(${top + pad}px)`;
  }

  let activeIndex = Math.max(0, items.findIndex(el=>el.classList.contains('is-active')));
  setActive(activeIndex);

  items.forEach((el,idx)=>{
    el.addEventListener('click', ()=>{
      activeIndex = idx;
      setActive(activeIndex);
    });
  });

  window.addEventListener('resize', ()=> setActive(activeIndex));
})();
