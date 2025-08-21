(function () {
  'use strict';

  var DEFAULTS = {
    visibleAfterPx: 260,
    sizePx: 48,
    insetRightPx: 16,
    insetBottomPx: 16,
    ringRadius: 22 // fixed radius for proper circle alignment
  };

  var userConfig = window.BackToTopConfig || {};
  var config = Object.assign({}, DEFAULTS, userConfig);

  var rootId = 'et-btt';

  var state = {
    hasMounted: false,
    ticking: false,
    prefersReducedMotion: false,
    lastKnownScrollY: 0,
    maxScrollable: 1,
    ringCircumference: 2 * Math.PI * config.ringRadius,
    elements: { root: null, button: null, ringIndicator: null }
  };

  function mount() {
    if (document.getElementById(rootId)) return;
    var root = document.createElement('div');
    root.id = rootId;
    root.className = 'et-btt';
    root.setAttribute('aria-hidden', 'true');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'et-btt__btn';
    btn.setAttribute('aria-label', 'Back to top');
    btn.title = 'Back to top';
    btn.style.setProperty('--et-btt-size', config.sizePx + 'px');

    // Progress ring SVG
    var svgRing = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgRing.setAttribute('class', 'et-btt__ring');
    svgRing.setAttribute('width', String(config.sizePx));
    svgRing.setAttribute('height', String(config.sizePx));
    svgRing.setAttribute('viewBox', '0 0 48 48');

    var track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    track.setAttribute('class', 'et-btt__ring-track');
    track.setAttribute('cx', '24');
    track.setAttribute('cy', '24');
    track.setAttribute('r', String(config.ringRadius));

    var indicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    indicator.setAttribute('class', 'et-btt__ring-indicator');
    indicator.setAttribute('cx', '24');
    indicator.setAttribute('cy', '24');
    indicator.setAttribute('r', String(config.ringRadius));
    indicator.setAttribute('stroke-dasharray', String(state.ringCircumference));
    indicator.setAttribute('stroke-dashoffset', String(state.ringCircumference));

    svgRing.appendChild(track);
    svgRing.appendChild(indicator);

    // Arrow icon SVG
    var svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgIcon.setAttribute('class', 'et-btt__icon');
    svgIcon.setAttribute('viewBox', '0 0 24 24');
    svgIcon.setAttribute('aria-hidden', 'true');
    var iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    iconPath.setAttribute('fill', 'currentColor');
    iconPath.setAttribute('d', 'M12 6l-5 5h3v7h4v-7h3z');
    svgIcon.appendChild(iconPath);

    btn.appendChild(svgRing);
    btn.appendChild(svgIcon);
    root.appendChild(btn);
    document.body.appendChild(root);

    state.elements.root = root;
    state.elements.button = btn;
    state.elements.ringIndicator = indicator;
  }

  function getScrollTop() {
    return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }

  function getMaxScrollable() {
    var doc = document.documentElement;
    var body = document.body;
    var scrollHeight = Math.max(body.scrollHeight, doc.scrollHeight);
    var clientHeight = doc.clientHeight;
    return Math.max(1, scrollHeight - clientHeight);
  }

  function setVisible(isVisible) {
    if (!state.elements.root) return;
    if (isVisible) {
      state.elements.root.classList.add('is-visible');
      state.elements.root.setAttribute('aria-hidden', 'false');
    } else {
      state.elements.root.classList.remove('is-visible');
      state.elements.root.setAttribute('aria-hidden', 'true');
    }
  }

  function updateProgress(scrollY) {
    if (!state.elements.ringIndicator) return;
    var percent = Math.min(1, Math.max(0, scrollY / state.maxScrollable));
    var offset = state.ringCircumference - percent * state.ringCircumference;
    state.elements.ringIndicator.setAttribute(
      'stroke-dashoffset',
      String(Math.max(0, Math.min(state.ringCircumference, offset)))
    );
  }

  function rafUpdate() {
    state.ticking = false;
    state.lastKnownScrollY = getScrollTop();
    state.maxScrollable = getMaxScrollable();
    setVisible(state.lastKnownScrollY > config.visibleAfterPx && state.maxScrollable > 1);
    updateProgress(state.lastKnownScrollY);
  }

  function onScrollOrResize() {
    if (!state.ticking) {
      state.ticking = true;
      window.requestAnimationFrame(rafUpdate);
    }
  }

  function onClick() {
    if (state.prefersReducedMotion) {
      window.scrollTo(0, 0);
      return;
    }
    if ('scrollBehavior' in document.documentElement.style && typeof window.scrollTo === 'function') {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); return; } catch (_) {}
    }
    window.scrollTo(0, 0);
  }

  function onKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
  }

  function init() {
    if (state.hasMounted) return;
    state.prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    mount();
    if (!state.elements.button) return;
    state.elements.button.addEventListener('click', onClick);
    state.elements.button.addEventListener('keydown', onKeydown);
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    document.addEventListener('visibilitychange', onScrollOrResize);
    onScrollOrResize();
    state.hasMounted = true;
  }

  function destroy() {
    if (!state.hasMounted) return;
    if (state.elements.button) {
      state.elements.button.removeEventListener('click', onClick);
      state.elements.button.removeEventListener('keydown', onKeydown);
    }
    window.removeEventListener('scroll', onScrollOrResize);
    window.removeEventListener('resize', onScrollOrResize);
    document.removeEventListener('visibilitychange', onScrollOrResize);
    if (state.elements.root && state.elements.root.parentNode) {
      state.elements.root.parentNode.removeChild(state.elements.root);
    }
    state.hasMounted = false;
  }

  window.BackToTop = {
    init: init,
    destroy: destroy,
    show: function () { setVisible(true); },
    hide: function () { setVisible(false); },
    update: function () { onScrollOrResize(); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
