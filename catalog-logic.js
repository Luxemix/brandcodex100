(function () {
  'use strict';
  const fields = {
    when: 'When to wear', product: 'Product strengths',
    silhouette: 'Silhouette & proportion', structure: 'Structure & movement',
    surface: 'Surface & detail', color: 'Color & pattern'
  };
  const fold = value => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function select(brands, filters, sort = 'name') {
    const terms = fold(filters.q).split(' ').filter(Boolean);
    const result = brands.filter(brand => {
      if (filters.world && !brand.worlds.includes(filters.world)) return false;
      for (const [key, field] of Object.entries(fields)) {
        if (filters[key] && !brand.tags[field].includes(filters[key])) return false;
      }
      if (filters.price === 'review' && brand.priceVerified) return false;
      if (filters.price && filters.price !== 'review' && (!brand.priceVerified || brand.priceTier !== filters.price)) return false;
      const haystack = fold([brand.name, brand.description, brand.location, ...brand.worlds, ...Object.values(brand.tags).flat()].join(' '));
      return terms.every(term => haystack.includes(term));
    });
    return result.sort((a, b) => {
      if (sort.startsWith('price-')) {
        if (a.priceVerified !== b.priceVerified) return a.priceVerified ? -1 : 1;
        if (a.priceVerified && a.priceTier.length !== b.priceTier.length) {
          return (a.priceTier.length - b.priceTier.length) * (sort === 'price-down' ? -1 : 1);
        }
      }
      return a.name.localeCompare(b.name, 'en', {sensitivity: 'base'});
    });
  }
  function readFilters(params, catalog) {
    const filters = {q: params.get('q') || '', world: '', price: ''};
    if (catalog.worlds.includes(params.get('world'))) filters.world = params.get('world');
    if (['$', '$$', '$$$', '$$$$', '$$$$$', 'review'].includes(params.get('price'))) filters.price = params.get('price');
    for (const [key, field] of Object.entries(fields)) filters[key] = catalog.vocabulary[field].includes(params.get(key)) ? params.get(key) : '';
    return filters;
  }
  window.CODEX_LOGIC = {fields, fold, escape, select, readFilters};
})();
