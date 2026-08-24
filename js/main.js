// js/main.js — Training configurator interactions
// Progressive training planning interface: requirement → design → scheduling → capacity → delivery

(function(){
  'use strict';

  // Find configurator container on training page
  const configurator = document.querySelector('[data-configurator]');
  if (!configurator) return;

  const TYPES = ['individual','group','workplace','customized'];
  const PRICES = { individual: 200, group: 150 };

  const typeButtons = Array.from(configurator.querySelectorAll('[data-type]'));
  const panels = Array.from(configurator.querySelectorAll('[data-panel]'));
  const pipeline = Array.from(configurator.querySelectorAll('[data-pipeline-stage]'));
  const participantRange = configurator.querySelector('[data-participant-range]');
  const participantCountNodes = Array.from(configurator.querySelectorAll('[data-participant-count]'));
  const participantTotalNode = configurator.querySelector('[data-participant-total]');
  const participantMaxNode = configurator.querySelector('[data-participant-max]');
  const requestLinks = Array.from(configurator.querySelectorAll('[data-request]'));

  function setActiveType(type){
    typeButtons.forEach(btn=> btn.classList.toggle('active', btn.dataset.type===type));
    panels.forEach(p=> p.classList.toggle('active', p.dataset.panel===type));

    // pipeline step
    const step = pipelineStep(type);
    pipeline.forEach(p => {
      const s = Number(p.dataset.pipelineStage || 0);
      p.classList.toggle('active', s <= step);
    });

    if (type === 'group') updateGroupMath();
  }

  function pipelineStep(type){
    switch(type){
      case 'individual': return 2;
      case 'group': return 3;
      case 'workplace': return 4;
      case 'customized': return 4;
      default: return 1;
    }
  }

  function updateGroupMath(){
    if (!participantRange) return;
    const count = Math.min(6, Math.max(1, Number(participantRange.value))); // clamp 1..6
    participantCountNodes.forEach(n => n.textContent = count);
    const total = count * PRICES.group;
    if (participantTotalNode) participantTotalNode.textContent = '$' + total;
    if (participantMaxNode) participantMaxNode.textContent = '6 max';
  }

  // Wire type buttons
  typeButtons.forEach(btn => {
    btn.addEventListener('click', ()=>{
      setActiveType(btn.dataset.type);
      // update URL param for linking
      history.replaceState(null, '', '?type=' + btn.dataset.type);
    });
  });

  // participant range
  if (participantRange){
    participantRange.addEventListener('input', updateGroupMath);
    participantRange.addEventListener('change', updateGroupMath);
    updateGroupMath();
  }

  // request links — prefill contact anchor with params
  requestLinks.forEach(link => {
    link.addEventListener('click', (e)=>{
      e.preventDefault();
      const type = link.dataset.type || (configurator.querySelector('.type-option.active')?.dataset.type) || 'individual';
      const participants = participantRange ? Math.min(6, Number(participantRange.value)) : 1;
      const total = (type==='group') ? (participants * PRICES.group) : (type==='individual' ? PRICES.individual : 'Contact');

      // Prepare formprefill payload as querystring to contact.html anchor; the contact form posts to Formspree
      const qs = new URLSearchParams({
        'training-type': type,
        'participants': participants,
        'estimated-price': (typeof total === 'number'? '$'+total : 'Contact')
      }).toString();

      // Navigate to contact anchor on site with context (contact.html preserves legal pages)
      window.location.href = 'contact.html#booking?'+qs;
    });
  });

  // initialize from URL param
  const params = new URLSearchParams(window.location.search);
  const qtype = params.get('type');
  if (qtype && TYPES.includes(qtype)) setActiveType(qtype);
  else setActiveType('individual');

})();
