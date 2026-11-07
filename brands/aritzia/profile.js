(() => {
  'use strict';
  const details = {brand: 'Aritzia', aesthetic: 'Clean Girl', price_tier: 2};
  const track = (name, values = {}) => window.bcTrack?.(name, {...details, ...values});
  const from = new URLSearchParams(location.search).get('from');
  if (from) {
    try {
      const destination = new URL(from, location.origin);
      if (destination.origin === location.origin && destination.pathname === '/') {
        const back = document.getElementById('profile-back');
        back.href = destination.href;
        back.textContent = '← Back to your results';
      }
    } catch {}
  }
  track('brand_open');
  document.getElementById('visit-brand').addEventListener('click', event => {
    track('shop_click', {link_url: event.currentTarget.href, link_type: 'button'});
  });
  document.getElementById('lookbook-link').addEventListener('click', event => {
    track('cross_site_click', {
      link_url: event.currentTarget.href,
      link_type: 'lookbook_context'
    });
  });
  try {
    if (/^(www\.)?luxemix\.com$/.test(new URL(document.referrer).hostname)) {
      track('cross_site_arrival', {link_type: 'from_luxemix'});
    }
  } catch {}
})();
