/* ============================================
   BLOG HUB - ADVANCED JAVASCRIPT
   Mouse-tracking 3D, Dynamic Filters, Real-time Search
   ============================================ */

(function() {
    'use strict';

    // State
    var state = {
        articles: [],
        currentSort: 'newest'
    };

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        cacheArticles();
        buildDynamicFilters();
        updateHeroStats();
        initScrollReveal();
        init3DMouseTracking();
        initSearch();
        initSort();
        initKeyboardNavigation();
        adjustHeroForHeader();
        computeReadTimes();
        initThemeToggle();
    }

    /* ============================================
       ADJUST HERO SECTION FOR HEADER
       ============================================ */
    function adjustHeroForHeader() {
        var headerPlaceholder = document.getElementById('header-placeholder');
        var heroSection = document.querySelector('.blog-hero');
        
        if (!headerPlaceholder || !heroSection) return;

        // Function to check and adjust padding
        function checkHeaderAndAdjust() {
            var headerHeight = 0;
            var headerContent = headerPlaceholder.querySelector('header, .header, nav');
            
            if (headerContent) {
                headerHeight = headerContent.offsetHeight || 100;
            } else if (headerPlaceholder.children.length > 0) {
                headerHeight = headerPlaceholder.offsetHeight || 100;
            }

            if (headerHeight > 0) {
                heroSection.style.paddingTop = 'calc(var(--space-20) + ' + headerHeight + 'px)';
            }
        }

        // Check immediately
        checkHeaderAndAdjust();

        // Watch for header changes (it loads via fetch)
        var observer = new MutationObserver(function(mutations) {
            checkHeaderAndAdjust();
        });

        observer.observe(headerPlaceholder, {
            childList: true,
            subtree: true,
            attributes: true
        });

        // Also check after a short delay for async loading
        setTimeout(checkHeaderAndAdjust, 500);
        setTimeout(checkHeaderAndAdjust, 1000);
    }

    /* ============================================
       CACHE ARTICLES DATA
       ============================================ */
    function cacheArticles() {
        try {
            var articleElements = document.querySelectorAll('.article-item');
            if (!articleElements || !articleElements.length) {
                console.warn('No articles found');
                state.articles = [];
                return;
            }

            state.articles = Array.prototype.slice.call(articleElements).map(function(el) {
                return {
                    element: el,
                    category: el.getAttribute('data-category') || '',
                    author: el.getAttribute('data-author') || '',
                    date: el.getAttribute('data-date') || '',
                    href: el.querySelector('a.article-link') ? el.querySelector('a.article-link').getAttribute('href') : '',
                    title: el.querySelector('.article-title') ? el.querySelector('.article-title').textContent.toLowerCase() : '',
                    excerpt: el.querySelector('.article-excerpt') ? el.querySelector('.article-excerpt').textContent.toLowerCase() : ''
                };
            });
        } catch (error) {
            console.error('Error caching articles:', error);
            state.articles = [];
        }
    }

    /* ============================================
       READ TIME ESTIMATION
       ============================================ */
    function computeReadTimes() {
        if (!state.articles || !state.articles.length || !window.fetch) return;

        state.articles.forEach(function(a) {
            if (!a.href) return;

            // Insert placeholder immediately for layout stability
            ensureReadTimeNode(a.element, 'Calculating…');

            fetch(a.href, { credentials: 'same-origin' })
                .then(function(res) { return res.text(); })
                .then(function(html) {
                    try {
                        var parser = new DOMParser();
                        var doc = parser.parseFromString(html, 'text/html');
                        // Prefer main article content if present
                        var content = doc.querySelector('article, .article, .post-content, .content, main') || doc.body;
                        if (!content) throw new Error('No content');
                        // Strip scripts/styles
                        Array.prototype.slice.call(content.querySelectorAll('script, style, noscript')).forEach(function(n){ n.parentNode.removeChild(n); });
                        var text = content.textContent || '';
                        var words = (text.match(/\b\w+\b/g) || []).length;
                        var minutes = Math.max(1, Math.round(words / 200));
                        ensureReadTimeNode(a.element, minutes + ' min read');
                    } catch (e) {
                        console.warn('Read-time parse failed for', a.href, e);
                        ensureReadTimeNode(a.element, '1 min read');
                    }
                })
                .catch(function(err) {
                    console.warn('Read-time fetch failed for', a.href, err);
                    ensureReadTimeNode(a.element, '1 min read');
                });
        });
    }

    function ensureReadTimeNode(articleEl, text) {
        var existing = articleEl.querySelector('.article-readtime');
        if (!existing) {
            var content = articleEl.querySelector('.article-content');
            if (!content) return;
            var node = document.createElement('div');
            node.className = 'article-readtime';
            node.setAttribute('aria-label', 'Estimated reading time');
            // Insert before footer if available
            var footer = content.querySelector('.article-footer');
            if (footer && footer.parentNode === content) {
                content.insertBefore(node, footer);
            } else {
                content.appendChild(node);
            }
            existing = node;
        }
        existing.textContent = text;
    }

    /* ============================================
       UPDATE HERO STATS DYNAMICALLY
       ============================================ */
    function updateHeroStats() {
        try {
            // Count only regular articles (exclude featured)
            var articleCount = state.articles.length;

            // Get unique categories from all articles
            var categories = {};
            state.articles.forEach(function(article) {
                var cat = article.category;
                if (cat && cat.trim()) {
                    categories[cat.toLowerCase()] = true;
                }
            });
            var categoryCount = Object.keys(categories).length;

        // Update stat values in hero section
            var heroStats = document.querySelector('.hero-stats');
            if (heroStats) {
                var statValues = heroStats.querySelectorAll('.stat-value');
                if (statValues[0]) statValues[0].textContent = articleCount;
                if (statValues[2]) statValues[2].textContent = categoryCount;
            }
        } catch (error) {
            console.error('Error updating hero stats:', error);
        }
    }

    /* ============================================
       DYNAMIC FILTER GENERATION
       ============================================ */
    function buildDynamicFilters() {
        var filterTabs = document.getElementById('filterTabs');
        if (!filterTabs) return;

        // Get unique categories from articles
        var categories = {};
        state.articles.forEach(function(article) {
            var cat = article.category;
            if (cat) {
                categories[cat] = (categories[cat] || 0) + 1;
            }
        });

        // Configure ARIA on container
        filterTabs.setAttribute('role', 'tablist');
        filterTabs.setAttribute('aria-label', 'Filter articles by category');

        // Create filter buttons
        var html = '<button class="tab-btn active" data-filter="all" role="tab" aria-selected="true" tabindex="0">';
        html += 'All <span style="opacity:0.7">(' + state.articles.length + ')</span>';
        html += '</button>';

        Object.keys(categories).sort().forEach(function(cat) {
            html += '<button class="tab-btn" data-filter="' + cat.toLowerCase() + '" role="tab" aria-selected="false" tabindex="-1">';
            html += cat + ' <span style="opacity:0.7">(' + categories[cat] + ')</span>';
            html += '</button>';
        });

        filterTabs.innerHTML = html;

        // Add click handlers
        var buttons = filterTabs.querySelectorAll('.tab-btn');
        buttons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                buttons.forEach(function(b) {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                    b.setAttribute('tabindex', '-1');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
                btn.setAttribute('tabindex', '0');
                filterAndSort();
            });
        });

        // Keyboard navigation for tabs
        filterTabs.addEventListener('keydown', function(e) {
            var focused = document.activeElement;
            var list = Array.prototype.slice.call(buttons);
            var idx = list.indexOf(focused);
            if (idx === -1) return;

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                var next = list[(idx + 1) % list.length];
                next.focus(); next.click();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                var prev = list[(idx - 1 + list.length) % list.length];
                prev.focus(); prev.click();
            } else if (e.key === 'Home') {
                e.preventDefault();
                list[0].focus(); list[0].click();
            } else if (e.key === 'End') {
                e.preventDefault();
                var last = list[list.length - 1];
                last.focus(); last.click();
            }
        });
    }

    /* ============================================
       REAL-TIME SEARCH
       ============================================ */
    function initSearch() {
        var searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        var debounceTimer;
        searchInput.addEventListener('input', function() {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                filterAndSort();
            }, 300);
        });
    }

    /* ============================================
       SORT FUNCTIONALITY
       ============================================ */
    function initSort() {
        var sortSelect = document.getElementById('sortSelect');
        if (!sortSelect) return;

        sortSelect.addEventListener('change', function() {
            state.currentSort = sortSelect.value;
            filterAndSort();
        });
    }

    /* ============================================
       FILTER AND SORT ARTICLES
       ============================================ */
    function filterAndSort() {
        var searchInput = document.getElementById('searchInput');
        var searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

        var activeFilter = document.querySelector('.tab-btn.active');
        var filterCategory = activeFilter ? activeFilter.getAttribute('data-filter') : 'all';

        // Filter articles
        var filtered = state.articles.filter(function(article) {
            var matchesCategory = filterCategory === 'all' || article.category.toLowerCase() === filterCategory;
            var matchesSearch = !searchQuery ||
                              article.title.includes(searchQuery) ||
                              article.excerpt.includes(searchQuery) ||
                              article.author.toLowerCase().includes(searchQuery) ||
                              article.category.toLowerCase().includes(searchQuery);

            return matchesCategory && matchesSearch;
        });

        // Sort articles
        filtered.sort(function(a, b) {
            switch(state.currentSort) {
                case 'newest':
                    return new Date(b.date) - new Date(a.date);
                case 'oldest':
                    return new Date(a.date) - new Date(b.date);
                case 'title-asc':
                    return a.title.localeCompare(b.title);
                case 'title-desc':
                    return b.title.localeCompare(a.title);
                default:
                    return 0;
            }
        });

        // Update DOM
        var visibleCount = 0;
        state.articles.forEach(function(article) {
            var isVisible = filtered.includes(article);
            if (isVisible) {
                article.element.classList.remove('hidden');
                article.element.classList.add('visible');
                article.element.style.order = filtered.indexOf(article);
                visibleCount++;
            } else {
                article.element.classList.add('hidden');
                article.element.classList.remove('visible');
            }
        });

        // Show/hide no results
        var noResults = document.getElementById('noResults');
        if (noResults) {
            noResults.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    }

    /* ============================================
       KEYBOARD NAV FOR ARTICLE LINKS (Enter/Space)
       ============================================ */
    function initKeyboardNavigation() {
        var articleLinks = document.querySelectorAll('.article-link');
        articleLinks.forEach(function(link) {
            link.setAttribute('tabindex', '0');
            link.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.location.href = link.href;
                }
            });
        });
    }

    /* ============================================
       MOUSE-TRACKING 3D ANIMATIONS
       ============================================ */
    function init3DMouseTracking() {
        var articleCards = document.querySelectorAll('.article-link');

        articleCards.forEach(function(card) {
            card.addEventListener('mousemove', function(e) {
                var rect = card.getBoundingClientRect();
                var x = e.clientX - rect.left;
                var y = e.clientY - rect.top;

                var centerX = rect.width / 2;
                var centerY = rect.height / 2;

                var percentX = (x - centerX) / centerX;
                var percentY = (y - centerY) / centerY;

                var rotateY = percentX * 10; // Max 10deg rotation
                var rotateX = -percentY * 10;

                // Apply 3D transform
                card.style.transform = 'translateY(-12px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale(1.02)';

                // Update gradient position
                var mouseX = (x / rect.width) * 100;
                var mouseY = (y / rect.height) * 100;
                var hoverIndicator = card.querySelector('.hover-indicator');
                if (hoverIndicator) {
                    hoverIndicator.style.setProperty('--mouse-x', mouseX + '%');
                    hoverIndicator.style.setProperty('--mouse-y', mouseY + '%');
                }
            });

            card.addEventListener('mouseleave', function() {
                // Reset transform
                card.style.transform = '';
            });
        });
    }

    /* ============================================
       SCROLL REVEAL ANIMATIONS
       ============================================ */
    function initScrollReveal() {
        var elements = document.querySelectorAll('[data-scroll-reveal]');

        if (!elements.length) return;

        if (!('IntersectionObserver' in window)) {
            elements.forEach(function(el) {
                el.classList.add('revealed');
            });
            return;
        }

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var el = entry.target;
                    var delay = el.getAttribute('data-delay') || 0;

                    setTimeout(function() {
                        el.classList.add('revealed');
                    }, parseInt(delay));

                    observer.unobserve(el);
                }
            });
        }, {
            rootMargin: '0px 0px -50px 0px',
            threshold: 0.1
        });

        elements.forEach(function(el) {
            observer.observe(el);
        });

        // Also reveal articles
        var articles = document.querySelectorAll('.article-item');
        var articleObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    articleObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '0px 0px -100px 0px',
            threshold: 0.1
        });

        articles.forEach(function(article) {
            articleObserver.observe(article);
        });
    }

    /* ============================================
       THEME TOGGLE (Dark / Light with persistence)
       ============================================ */
    function initThemeToggle() {
        try {
            var toggle = document.getElementById('themeToggle');
            if (!toggle) return;

            var scope = document.getElementById('blog-theme-scope');
            if (!scope) return;

            // Apply saved preference
            var saved = null;
            try {
                saved = localStorage.getItem('theme-preference');
            } catch (e) {}

            if (saved === 'dark' || saved === 'light') {
                scope.classList.remove('blog-dark', 'blog-light');
                scope.classList.add(saved === 'dark' ? 'blog-dark' : 'blog-light');
                updateToggleIcon(toggle, saved);
            } else {
                // No saved preference: reflect current scheme
                var prefersDark = false;
                try {
                    prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                } catch (e) {}
                scope.classList.add(prefersDark ? 'blog-dark' : 'blog-light');
                updateToggleIcon(toggle, prefersDark ? 'dark' : 'light');
            }

            // Click handler
            toggle.addEventListener('click', function() {
                var isDark = scope.classList.contains('blog-dark');
                var next = isDark ? 'light' : 'dark';
                scope.classList.remove('blog-dark', 'blog-light');
                scope.classList.add(next === 'dark' ? 'blog-dark' : 'blog-light');
                updateToggleIcon(toggle, next);
                try { localStorage.setItem('theme-preference', next); } catch (e) {}
            });
        } catch (err) {
            console.warn('Theme toggle init failed:', err);
        }
    }

    function updateToggleIcon(btn, mode) {
        var icon = btn.querySelector('i');
        if (!icon) return;
        // Reset
        icon.className = 'fa-solid';
        if (mode === 'dark') {
            icon.classList.add('fa-sun');
            btn.setAttribute('aria-pressed', 'true');
            btn.title = 'Switch to light mode';
        } else {
            icon.classList.add('fa-moon');
            btn.setAttribute('aria-pressed', 'false');
            btn.title = 'Switch to dark mode';
        }
    }

})();
