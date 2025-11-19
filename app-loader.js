// Universal header/footer loader and site-wide small utilities
(function(){
    function loadScript(src) {
        return new Promise(function(resolve, reject){
            var s = document.createElement('script');
            s.src = src;
            s.defer = true;
            s.onload = function(){ resolve(); };
            s.onerror = function(){ reject(new Error('Failed to load script '+src)); };
            document.body.appendChild(s);
        });
    }

    function ensureAdsenseScript() {
        try {
            if (document.querySelector('script[data-adsbygoogle-loader]') || document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
                return;
            }
            var script = document.createElement('script');
            script.async = true;
            script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7497952829371080';
            script.crossOrigin = 'anonymous';
            script.setAttribute('data-adsbygoogle-loader', 'true');
            script.onerror = function(err){
                console.warn('AdSense script failed to load', err);
            };
            document.head.appendChild(script);
        } catch (err) {
            console.warn('AdSense script injection skipped:', err && err.message ? err.message : err);
        }
    }

    function injectHTML(targetId, html) {
        var el = document.getElementById(targetId);
        if (el) el.innerHTML = html;
    }

    function loadHeader() {
        var placeholder = document.getElementById('site-header') || document.getElementById('header-placeholder');
        if (!placeholder) return Promise.resolve();
        // Avoid fetch errors when opened via file:// protocol
        if (location.protocol === 'file:') return Promise.resolve();
        return fetch('/header.html')
            .then(function(r){ if(!r.ok) throw new Error('header.html'); return r.text(); })
            .then(function(html){ injectHTML(placeholder.id, html); })
            .then(function(){ return loadScript('https://cdn.jsdelivr.net/npm/fuse.js@6.6.2'); })
            .then(function(){ return loadScript('/header-search.js'); })
            .then(function(){
                if (typeof initializeHeader === 'function') initializeHeader();
            })
            .catch(function(e){ console.warn('Header load skipped:', e.message || e); });
    }

    function loadFooter() {
        var placeholder = document.getElementById('site-footer') || document.getElementById('footer-placeholder');
        if (!placeholder) return Promise.resolve();
        // Avoid fetch errors when opened via file:// protocol
        if (location.protocol === 'file:') return Promise.resolve();
        return fetch('/footer.html')
            .then(function(r){ if(!r.ok) throw new Error('footer.html'); return r.text(); })
            .then(function(html){ injectHTML(placeholder.id, html); })
            .catch(function(e){ console.warn('Footer load skipped:', e.message || e); });
    }

    function setCurrentYear() {
        try {
            var yearSpan = document.querySelector('.current-year');
            if (yearSpan) yearSpan.textContent = new Date().getFullYear();
        } catch(_) {}
    }

    document.addEventListener('DOMContentLoaded', function(){
        setCurrentYear();
        ensureAdsenseScript();
        // Best-effort, non-breaking loader
        loadHeader();
        loadFooter();
    });
})();


