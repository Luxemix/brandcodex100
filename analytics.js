(function () {
  'use strict';
  const measurement = 'G-M84DX16EL1';
  const production = /^(www\.)?brandcodex100\.com$/.test(location.hostname);
  const query = new URLSearchParams(location.search);
  const qa = query.get('utm_source') === 'codex_qa';
  const banner = document.getElementById('cookieBanner');
  let choice = null;
  try { choice = localStorage.getItem('bc100_cookies'); } catch {}
  let loaded = false;
  function safePage() { const url = new URL(location.href); url.searchParams.delete('q'); return url.href; }
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window['ga-disable-' + measurement] = choice === 'declined';
  function load() {
    if (loaded || !production || choice === 'declined') return;
    loaded = true;
    window.gtag('js', new Date());
    window.gtag('config', measurement, {anonymize_ip: true, page_location: safePage(), ...(qa ? {debug_mode: true} : {})});
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurement;
    document.head.appendChild(script);
    if (window.bcInitPosthog) window.bcInitPosthog();
  }
  const allowed = new Set(['brand', 'aesthetic', 'price_tier', 'filter_type', 'filter_value', 'results_count', 'view_name', 'sort_value', 'link_url', 'link_type', 'rank', 'percent']);
  window.bcTrack = function (name, values = {}) {
    const clean = {page: 'brand_index', page_location: safePage(), transport_type: 'beacon'};
    for (const [key, value] of Object.entries(values)) if (allowed.has(key)) clean[key] = value;
    if (choice === 'declined') return;
    if (!production) { if (qa) console.info('Brand Codex QA event', name, JSON.stringify(clean)); return; }
    load();
    if (qa) clean.debug_mode = true;
    window.gtag('event', name, clean);
    if (window.posthog) window.posthog.capture(name, {...clean, $current_url: safePage()});
  };
  function setChoice(value) {
    choice = value;
    try { localStorage.setItem('bc100_cookies', value); } catch {}
    window['ga-disable-' + measurement] = value === 'declined';
    if (value === 'accepted') { load(); if (window.posthog) window.posthog.opt_in_capturing(); }
    else if (window.posthog) window.posthog.opt_out_capturing();
    banner.hidden = true;
  }
  banner.hidden = choice !== null;
  document.getElementById('cookie-accept').addEventListener('click', () => setChoice('accepted'));
  document.getElementById('cookie-decline').addEventListener('click', () => setChoice('declined'));
  document.getElementById('cookie-preferences').addEventListener('click', () => { banner.hidden = false; });
  window.bcStartAnalytics = load;
})();

window.bcInitPosthog = function () {
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace('.i.','.') + "/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId setPersonProperties".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

    posthog.init('phc_qjvE9zsEscWDjVcCBQ39HhtgpFXMYQ4JzxzfegkYC2PC', {
      api_host: 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false,
      capture_pageleave: false,
      autocapture: false
    });


const pageUrl = new URL(location.href);
pageUrl.searchParams.delete('q');
posthog.capture('$pageview', {$current_url: pageUrl.href});
};
window.bcStartAnalytics();
