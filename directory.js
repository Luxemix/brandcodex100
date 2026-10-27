'use strict';
const catalog = window.CODEX_CATALOG;
const logic = window.CODEX_LOGIC;
const esc = logic.escape;
const $ = selector => document.querySelector(selector);
const params = new URLSearchParams(location.search);
let filters = logic.readFilters(params, catalog);
let view = ['grid', 'compact', 'list'].includes(params.get('view')) ? params.get('view') : 'grid';
let sort = ['name', 'price-up', 'price-down'].includes(params.get('sort')) ? params.get('sort') : 'name';
let searchTimer;
let cardObserver;
const viewedBrands = new Set();
const track = (name, values) => window.bcTrack?.(name, values);
const brandEvent = brand => ({brand: brand.name, aesthetic: brand.worlds.join(' | '), price_tier: brand.priceVerified ? brand.priceTier.length : 'under_review'});
const controls = {q:'search', when:'occasion-filter', product:'product-filter', price:'price-filter', silhouette:'silhouette-filter', structure:'structure-filter', surface:'surface-filter', color:'color-filter'};
const colors = {'Quiet Luxury':['#e5ded2','#594d3f'],'Clean Girl':['#e8e8df','#4b5045'],'Parisian Chic':['#eaded7','#674d43'],'Romantic Feminine':['#efdee1','#855565'],'Eclectic Maximalist':['#e0dfb9','#5b602e'],'Athletic Luxe':['#dce5de','#365b4c'],'Going Out':['#dcd8e6','#594969'],'Cool Girl Streetwear':['#dfe4e7','#40545e'],'Dark Romance':['#ded3d8','#694754'],'Coastal / Boho':['#e6e0cf','#68563f']};
function tags(values) { return values.map(value => `<span class="tag">${esc(value)}</span>`).join(''); }
function safeLink(url) { try { return ['http:', 'https:'].includes(new URL(url).protocol) ? esc(url) : '#'; } catch { return '#'; } }
function priceLabel(brand) { return brand.priceVerified ? esc(brand.priceTier) : 'Price under review'; }
function syncUrl() {
  const next = new URLSearchParams(location.search);
  [...Object.keys(filters), 'view', 'sort'].forEach(key => next.delete(key));
  Object.entries(filters).forEach(([key, value]) => { if (value && key !== 'q') next.set(key, value); });
  if (view !== 'grid') next.set('view', view);
  if (sort !== 'name') next.set('sort', sort);
  const query = next.toString();
  try { history.replaceState(null, '', location.pathname + (query ? '?' + query : '') + location.hash); } catch {}
}
function renderWorlds() {
  $('#worlds').innerHTML = ['', ...catalog.worlds].map(world => {
    const count = world ? catalog.brands.filter(b => b.worlds.includes(world)).length : catalog.brands.length;
    return `<button class="world-button ${filters.world === world ? 'active' : ''}" type="button" data-world="${esc(world)}" aria-pressed="${filters.world === world}">${esc(world || 'All worlds')} <small>${count}</small></button>`;
  }).join('');
}
function brandCard(brand) {
  const [cover, ink] = colors[brand.worlds[0]] || ['#e5ded2','#594d3f'];
  return `<article class="brand-card" data-record="${esc(brand.id)}">
    <div class="brand-cover" style="--cover:${cover};--cover-ink:${ink}"><span class="cover-label">${esc(brand.worlds.join(' · '))}</span><h3 class="brand-title">${esc(brand.name)}</h3></div>
    <div class="brand-body"><div class="brand-meta"><span>${esc(brand.location || 'Explore the collection')}</span><span class="price-badge ${brand.priceVerified ? '' : 'pending'}">${priceLabel(brand)}</span></div>
    <p class="brand-description">${esc(brand.description)}</p><div class="tags">${tags(brand.tags['Product strengths'].slice(0, 3))}</div>
    ${brand.name === 'Ille de Cocos' ? '<p class="status-note">Current shop availability unconfirmed</p>' : ''}
    <div class="brand-actions"><button class="text-button" type="button" data-brand="${esc(brand.id)}" aria-label="Explore ${esc(brand.name)}">Explore brand</button><span class="arrow-button" aria-hidden="true">↗</span></div></div></article>`;
}
function renderIndex() {
  cardObserver?.disconnect();
  const results = logic.select(catalog.brands, filters, sort);
  renderWorlds();
  $('#brand-grid').className = 'brand-grid ' + (view === 'grid' ? '' : view);
  $('#brand-grid').innerHTML = results.map(brandCard).join('');
  $('#result-count').textContent = `${results.length} ${results.length === 1 ? 'brand' : 'brands'}${Object.values(filters).some(Boolean) ? ' matching your filters' : ' to explore'}`;
  $('#empty-state').hidden = results.length !== 0;
  $('#filter-chips').innerHTML = Object.entries(filters).filter(([,value]) => value).map(([key,value]) => `<button type="button" class="filter-chip" data-remove="${key}" aria-label="Remove ${esc(value)} filter">${esc(value)} ×</button>`).join('') + (Object.values(filters).some(Boolean) ? '<button type="button" class="filter-chip clear-chip" data-reset>Clear all</button>' : '');
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
  syncUrl();
  if ('IntersectionObserver' in window) {
    cardObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting || viewedBrands.has(entry.target.dataset.record)) return;
      const brand = catalog.brands.find(item => item.id === entry.target.dataset.record);
      if (brand) { viewedBrands.add(brand.id); track('brand_view', {...brandEvent(brand), rank: results.indexOf(brand) + 1}); }
      cardObserver.unobserve(entry.target);
    }), {threshold: 0.5});
    document.querySelectorAll('.brand-card').forEach(card => cardObserver.observe(card));
  }
}
function fillControls() {
  for (const [key, field] of Object.entries(logic.fields)) {
    const control = document.getElementById(controls[key]);
    catalog.vocabulary[field].forEach(value => control.add(new Option(value, value)));
  }
  updateControls();
  $('#sort').value = sort;
}
function updateControls() { Object.entries(controls).forEach(([key,id]) => { document.getElementById(id).value = filters[key] || ''; }); }
function sampleTable(sample) {
  return `<table class="sample-table"><caption>Five-style clothing sample · USD</caption><thead><tr><th scope="col">Style / source</th><th scope="col">Price</th></tr></thead><tbody>${sample.map(item => `<tr><td><a href="${safeLink(item.url || item.source)}" target="_blank" rel="noopener noreferrer">${esc(item.item)} ↗</a></td><td>$${Number(item.usd).toLocaleString('en-US')}</td></tr>`).join('')}</tbody></table>`;
}
function showBrand(id) {
  const brand = catalog.brands.find(item => item.id === id);
  if (!brand) return;
  const pricing = brand.priceVerified ? `<p><strong>${esc(brand.priceTier)} · $${Number(brand.median).toLocaleString('en-US')} sample median</strong></p><p>Price sample checked: ${esc(brand.checked)}. This describes a five-style sample, not every item or today’s stock.</p>${brand.priceSample.length ? sampleTable(brand.priceSample) : `<p>The five-style sample was checked on the date above.</p>`}` : `<p><strong>Price under review</strong></p><p>${esc(brand.exception?.reason || 'A comparable current clothing sample is not yet verified.')}</p>${brand.exception?.operating_status ? `<p>${esc(brand.exception.operating_status)}</p>` : ''}`;
  $('#dialog-content').innerHTML = `<p class="eyebrow">${esc(brand.worlds.join(' · '))}</p><h2 id="dialog-title">${esc(brand.name)}</h2><p class="lede">${esc(brand.description)}</p><div class="profile-facts"><span><b>Location</b>${esc(brand.location || 'Not recorded')}</span><span><b>Founded</b>${esc(brand.founded || 'Not recorded')}</span></div><div class="profile-tags">${Object.entries(brand.tags).map(([field,values]) => `<section><h3>${esc(field)}</h3><div class="tags">${values.length ? tags(values) : '<span class="quiet">Not specified</span>'}</div></section>`).join('')}</div><details class="profile-pricing"><summary>How this price tier was checked</summary>${pricing}</details><div class="profile-links"><a class="button" href="${safeLink(brand.website)}" target="_blank" rel="noopener noreferrer">${(brand.name === 'Ille de Cocos' || brand.websiteUnconfirmed) ? 'Recorded website · availability unconfirmed' : 'Visit official website'} ↗</a></div>`;
  $('#brand-dialog').showModal();
  $('#brand-dialog').scrollTop = 0;
  $('#dialog-content .profile-links a').addEventListener('click', () => track('shop_click', {...brandEvent(brand), link_url: brand.website, link_type: 'button'}));
  track('brand_open', brandEvent(brand));
}
function filterEvent(key, value) { track('filter_change', {filter_type: key, filter_value: value || 'all', results_count: logic.select(catalog.brands, filters, sort).length}); }
function resetFilters() { filters = logic.readFilters(new URLSearchParams(), catalog); updateControls(); renderIndex(); filterEvent('all', 'reset'); }
$('#filter-form').addEventListener('submit', event => event.preventDefault());
Object.entries(controls).forEach(([key,id]) => document.getElementById(id).addEventListener(key === 'q' ? 'input' : 'change', event => {
  filters[key] = event.target.value; renderIndex();
  if (key === 'q') { clearTimeout(searchTimer); searchTimer = setTimeout(() => track('directory_search', {results_count: logic.select(catalog.brands, filters, sort).length}), 500); }
  else filterEvent(key, filters[key]);
}));
$('#sort').addEventListener('change', event => { sort = event.target.value; renderIndex(); track('sort_change', {sort_value: sort}); });
document.addEventListener('click', event => {
  const button = event.target.closest('button,a');
  if (!button) return;
  if (button.hasAttribute('data-world')) { filters.world = button.dataset.world; renderIndex(); filterEvent('aesthetic', filters.world); }
  if (button.hasAttribute('data-remove')) { const key = button.dataset.remove; filters[key] = ''; updateControls(); renderIndex(); filterEvent(key, 'removed'); }
  if (button.hasAttribute('data-reset')) resetFilters();
  if (button.dataset.view) { view = button.dataset.view; renderIndex(); track('view_change', {view_name: view}); }
  if (button.dataset.brand) showBrand(button.dataset.brand);
  if (button.hasAttribute('data-page')) window.scrollTo({top:0, behavior:'instant'});
});
$('#dialog-close').addEventListener('click', () => $('#brand-dialog').close());
$('#brand-dialog').addEventListener('click', event => {
  if (event.target !== $('#brand-dialog')) return;
  const rect = event.target.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.target.close();
});

fillControls(); renderIndex();
const scrollMilestones = new Set();
window.addEventListener('scroll', () => {
  const available = document.documentElement.scrollHeight - window.innerHeight;
  if (available <= 0) return;
  const percent = Math.round(window.scrollY / available * 100);
  [25, 50, 75, 100].forEach(value => { if (percent >= value && !scrollMilestones.has(value)) { scrollMilestones.add(value); track('scroll_depth', {percent: value}); } });
}, {passive: true});
