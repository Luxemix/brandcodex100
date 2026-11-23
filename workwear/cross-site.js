/* Workwear to Lookbook journeys use the existing Brand Codex measurement tag. */
(() => {
  'use strict';
  if (!/^(www\.)?brandcodex100\.com$/.test(location.hostname)) return;
  function track(name, values) {
    try { if (localStorage.getItem('bc100_cookies') === 'declined') return; } catch {}
    const params = {site:'brand_codex', content_area:'workwear', transport_type:'beacon', ...values};
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
    else (window._bcQ = window._bcQ || []).push([name, params]);
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const url = new URL(link.href, location.href);
    if (!/^(www\.)?luxemix\.com$/.test(url.hostname) || !url.pathname.startsWith('/lookbook/')) return;
    track('cross_site_click', {
      destination_site:'luxemix', destination_context:'lookbook',
      look_id:url.hash.match(/^#\/look\/([^?]+)/)?.[1] || link.closest('.ww-slide')?.id || '',
      link_type:link.classList.contains('gallery-shop') ? 'outfit_context' : 'occasion_context',
      link_url:url.href
    });
  });
  try {
    if (/^(www\.)?luxemix\.com$/.test(new URL(document.referrer).hostname)) {
      track('cross_site_arrival', {source_site:'luxemix', source_context:'lookbook', look_id:new URLSearchParams(location.search).get('look') || ''});
    }
  } catch {}
})();
