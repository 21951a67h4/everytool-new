(function () {
  'use strict';

  var DEFAULTS = {
    visibleAfterPx: 260,
    sizePx: 52, // CHANGED: Overall size reduced
    ringRadius: 24.5 // CHANGED: Recalculated for 52px size with 3px stroke
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
    root.setAttribute('aria-hidden', 'true');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'et-btt__btn';
    btn.setAttribute('aria-label', 'Back to top');
    btn.title = 'Back to top';
    btn.style.setProperty('--et-btt-size', config.sizePx + 'px');

    var svgRing = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgRing.setAttribute('class', 'et-btt__ring');
    svgRing.setAttribute('viewBox', '0 0 ' + config.sizePx + ' ' + config.sizePx);

    var center = config.sizePx / 2;
    var track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    track.setAttribute('class', 'et-btt__ring-track');
    track.setAttribute('cx', String(center));
    track.setAttribute('cy', String(center));
    track.setAttribute('r', String(config.ringRadius));

    var indicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    indicator.setAttribute('class', 'et-btt__ring-indicator');
    indicator.setAttribute('cx', String(center));
    indicator.setAttribute('cy', String(center));
    indicator.setAttribute('r', String(config.ringRadius));
    indicator.setAttribute('stroke-dasharray', String(state.ringCircumference));
    indicator.setAttribute('stroke-dashoffset', String(state.ringCircumference));

    svgRing.appendChild(track);
    svgRing.appendChild(indicator);
    
    var svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgIcon.setAttribute('class', 'et-btt__icon');
    svgIcon.setAttribute('viewBox', '0 0 24 24');
    svgIcon.setAttribute('aria-hidden', 'true');
    
    var iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    iconPath.setAttribute('fill', 'currentColor');
    iconPath.setAttribute('d', 'M12 4l-7 7h5v9h4v-9h5z'); // Arrow icon
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
    return Math.max(1, doc.scrollHeight - doc.clientHeight);
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

  function onClick(e) {
    // Click feedback: Ripple Effect
    if (state.elements.button) {
      var rect = state.elements.button.getBoundingClientRect();
      var ripple = document.createElement('span');

      ripple.className = 'et-btt__ripple';
      ripple.style.height = ripple.style.width = Math.max(rect.width, rect.height) + 'px';
      ripple.style.top = (e.clientY - rect.top - ripple.offsetHeight / 2) + 'px';
      ripple.style.left = (e.clientX - rect.left - ripple.offsetWidth / 2) + 'px';
      
      var style = document.createElement('style');
      style.textContent = `
        .et-btt__ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          transform: scale(0);
          animation: et-btt-ripple-animation 0.6s linear;
          pointer-events: none;
        }
        @keyframes et-btt-ripple-animation {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
      state.elements.button.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    }
    
    // Smooth scroll functionality
    if (state.prefersReducedMotion) {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function onKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(e);
    }
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
    rafUpdate(); // Initial check
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
    if (state.elements.root && state.elements.root.parentNode) {
      state.elements.root.parentNode.removeChild(state.elements.root);
    }
    state.hasMounted = false;
  }
  
  // Expose public methods
  window.BackToTop = {
    init: init,
    destroy: destroy
  };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();