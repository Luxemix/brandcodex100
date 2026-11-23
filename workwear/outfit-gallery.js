(() => {
  'use strict';
  const track = document.getElementById('wwTrack');
  const slides = [...track.querySelectorAll('.ww-slide')];
  const previous = document.getElementById('wwPrev');
  const next = document.getElementById('wwNext');
  const status = document.getElementById('gallery-position');
  const dialog = document.getElementById('look-dialog');
  const modalImage = document.getElementById('dialog-image');
  const modalPrevious = document.getElementById('dialog-prev');
  const modalNext = document.getElementById('dialog-next');
  const canvas = document.getElementById('gallery-canvas');
  const zoom = document.getElementById('gallery-zoom');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0, opener, priorHash = '';
  const step = () => slides[1].offsetLeft - slides[0].offsetLeft;
  function updatePosition() {
    const first = Math.round(track.scrollLeft / step());
    const count = Math.max(1, Math.floor((track.clientWidth + 18) / step()));
    const last = Math.min(slides.length, first + count);
    status.textContent = `${first + 1}${last > first + 1 ? '–' + last : ''} of ${slides.length}`;
    previous.disabled = track.scrollLeft < 2;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  }
  function moveGallery(direction) {
    track.scrollBy({left: direction * step(), behavior: reduced.matches ? 'instant' : 'smooth'});
  }
  function renderLook(index) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    const slide = slides[current], image = slide.querySelector('img');
    modalImage.src = image.src;
    modalImage.alt = image.alt;
    document.getElementById('dialog-title').textContent = slide.querySelector('h3').textContent;
    const occasion = slide.querySelector('.wear-it-for a');
    const detail = document.getElementById('dialog-detail');
    if (occasion) detail.replaceChildren('Wear it for ', occasion.cloneNode(true));
    else detail.textContent = slide.querySelector('figcaption p')?.textContent || '';
    canvas.classList.remove('zoomed'); zoom.textContent = 'Zoom in'; zoom.setAttribute('aria-pressed','false');
    const shopping = document.getElementById('dialog-shop');
    shopping.hidden = !slide.id.startsWith('LM-W');
    shopping.href = slide.querySelector('.gallery-shop')?.href || '';
    shopping.dataset.lookId = slide.id;
    document.getElementById('dialog-counter').textContent = `${current + 1} of ${slides.length}`;
    modalPrevious.disabled = current === 0;
    modalNext.disabled = current === slides.length - 1;
    history.replaceState(null, '', '#' + slide.id);
  }
  function openLook(index, source) {
    priorHash = location.hash.startsWith('#LM-W') || location.hash.startsWith('#existing-look-') ? '' : location.hash;
    opener = source;
    renderLook(index);
    dialog.showModal();
    document.body.classList.add('look-is-open');
  }
  previous.addEventListener('click', () => moveGallery(-1));
  next.addEventListener('click', () => moveGallery(1));
  track.addEventListener('scroll', updatePosition, {passive:true});
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); moveGallery(event.key === 'ArrowRight' ? 1 : -1);
  });
  track.querySelectorAll('.look-open').forEach(button => button.addEventListener('click', () => openLook(+button.dataset.index, button)));
  document.getElementById('close-look').addEventListener('click', () => dialog.close());
  zoom.addEventListener('click', () => {
    const enlarged = canvas.classList.toggle('zoomed'); zoom.textContent = enlarged ? 'Fit image' : 'Zoom in'; zoom.setAttribute('aria-pressed',String(enlarged));
  });
  modalPrevious.addEventListener('click', () => renderLook(current - 1));
  modalNext.addEventListener('click', () => renderLook(current + 1));
  dialog.addEventListener('keydown', event => {
    if (canvas.classList.contains('zoomed')) return;
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); renderLook(current + (event.key === 'ArrowRight' ? 1 : -1));
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('look-is-open');
    history.replaceState(null, '', location.pathname + location.search + priorHash);
    opener?.focus({preventScroll:true});
  });
  new ResizeObserver(updatePosition).observe(track);
  updatePosition();
  const returnId = new URLSearchParams(location.search).get('look');
  const returnSlide = slides.find(slide => slide.id === returnId);
  if (returnSlide) requestAnimationFrame(() => {
    track.scrollLeft = returnSlide.offsetLeft - slides[0].offsetLeft;
    updatePosition();
  });
  const linked = slides.findIndex(slide => '#' + slide.id === location.hash);
  if (linked >= 0) openLook(linked, slides[linked].querySelector('button'));
})();
