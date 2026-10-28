(() => {
  'use strict';
  const cards = [...document.querySelectorAll('.ww-card')];
  const browse = document.querySelector('.ww-browse');
  const select = document.getElementById('wwBrandJump');
  const toggle = document.getElementById('wwPriceToggle');
  const panel = document.getElementById('wwPricePanel');
  const status = document.getElementById('wwBrowseStatus');
  const low = document.getElementById('wwMin');
  const high = document.getElementById('wwMax');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sizeToolbar = () => document.documentElement.style.setProperty('--browse-height', `${browse.getBoundingClientRect().height}px`);
  cards.forEach(card => {
    const heading = card.querySelector('h3');
    card.id = `brand-${heading.textContent.trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/g, '')}`;
    heading.tabIndex = -1;
  });
  function updateControls() {
    const current = select.value;
    const visible = cards.filter(card => !card.hidden);
    select.replaceChildren(new Option('Choose a brand', ''));
    visible.forEach(card => {
      select.add(new Option(`${card.querySelector('h3').textContent.trim()} · ${'$'.repeat(+card.dataset.tier)}`, card.id));
    });
    select.value = visible.some(card => card.id === current) ? current : '';
    const a = +low.value;
    const b = +high.value;
    const label = a === 1 && b === 5 ? 'All' : a === b ? '$'.repeat(a) : `${'$'.repeat(a)}–${'$'.repeat(b)}`;
    toggle.textContent = `Price · ${label}`;
    status.textContent = `${visible.length === 14 ? '14 brands' : `${visible.length} of 14 brands`} · Splurge to steal`;
    sizeToolbar();
  }
  function setPanel(open) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    sizeToolbar();
  }
  function jumpTo(card) {
    setPanel(false);
    card.scrollIntoView({behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start'});
    card.querySelector('h3').focus({preventScroll: true});
    history.replaceState(null, '', `#${card.id}`);
  }
  toggle.disabled = false;
  setPanel(false);
  toggle.addEventListener('click', () => setPanel(panel.hidden));
  select.addEventListener('change', () => {
    const card = cards.find(item => item.id === select.value);
    if (card && !card.hidden) jumpTo(card);
  });
  [low, high].forEach(input => input.addEventListener('input', updateControls));
  document.getElementById('wwReset').addEventListener('click', () => {
    low.value = '1';
    high.value = '5';
    low.dispatchEvent(new Event('input', {bubbles: true}));
  });
  browse.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) {
      setPanel(false);
      toggle.focus();
    }
  });
  updateControls();
  if ('ResizeObserver' in window) new ResizeObserver(sizeToolbar).observe(browse);
  const linkedCard = cards.find(card => `#${card.id}` === location.hash);
  if (linkedCard) jumpTo(linkedCard);
})();
