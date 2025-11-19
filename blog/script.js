/* ============================================
   MODERN BLOG HUB - JAVASCRIPT (FIXED)
   ============================================ */

   (function() {
    'use strict';
    
    // ============================================
    // GLOBAL STATE & CONSTANTS
    // ============================================
    
    const state = {
        currentFilter: 'all',
        currentSearch: '',
        blogCards: [],
        loadedCount: 0,
        blogsPerLoad: 3,
        isFiltering: false,
        isLoading: false,
        intersectionObserver: null,
        filtersObserver: null,
        memoryCache: new Map()
    };
    
    const config = {
        debounceDelay: 300,
        animationDelay: 150,
        maxVisibleCards: 20,
        categories: ['Finance', 'Design', 'Productivity', 'Technology', 'Development', 'Marketing'],
        categoryIcons: {
            'Finance': 'fa-calculator',
            'Design': 'fa-palette',
            'Productivity': 'fa-rocket',
            'Technology': 'fa-microchip',
            'Development': 'fa-code',
            'Marketing': 'fa-bullhorn'
        }
    };
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    /**
     * Debounce function to limit the rate of function calls
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Throttle function to limit function execution rate
     */
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Cache management for performance
     */
    function getCachedData(key, factory) {
        if (state.memoryCache.has(key)) {
            return state.memoryCache.get(key);
        }
        const data = factory();
        state.memoryCache.set(key, data);
        return data;
    }
    
    /**
     * Safe DOM query with error handling
     */
    function $(selector, parent = document) {
        try {
            return parent.querySelector(selector);
        } catch (error) {
            console.warn(`Invalid selector: ${selector}`, error);
            return null;
        }
    }
    
    /**
     * Safe DOM query all with error handling
     */
    function $$(selector, parent = document) {
        try {
            return Array.from(parent.querySelectorAll(selector));
        } catch (error) {
            console.warn(`Invalid selector: ${selector}`, error);
            return [];
        }
    }
    
    /**
     * Format date consistently
     */
    function formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }
    
    /**
     * Normalize category name for consistent filtering
     */
    function normalizeCategory(category) {
        if (!category) return '';
        return category.toLowerCase().trim();
    }
    
    /**
     * Announce filter changes for screen readers
     */
    function announceChange(message) {
        const announcer = $('#filterAnnouncer');
        if (announcer) {
            announcer.textContent = message;
        }
    }
    
    // ============================================
    // DOM CONTENT LOADED INITIALIZATION
    // ============================================
    
    document.addEventListener('DOMContentLoaded', function() {
        try {
            initializeBlogCards();
            initScrollAnimations();
            initSmoothScrolling();
            initLoadMore();
            initBlogSearchAndFilter();
            initLazyLoading();
            initPerformanceOptimizations();
            initBlogCarousel();
            initCategoryIcons();
            initCategoryCarousel();
            initMobileOptimizations();
            initAccessibility();
            
            // Final initialization after load
            window.addEventListener('load', handlePageLoad);
            document.addEventListener('visibilitychange', handleVisibilityChange);
            
        } catch (error) {
            console.error('Initialization error:', error);
            showErrorMessage('Failed to initialize the blog. Please refresh the page.');
        }
    });
    
    // ============================================
    // INITIALIZATION FUNCTIONS
    // ============================================
    /**
     * Inject SVG icons into category cards from assets/SVG/icons
     */
    function initCategoryIcons() {
        const iconBasePath = '../assets/SVG/icons/';
        const nameToFile = {
            'financial tools': 'wallet.svg',
            'developer tools': 'terminal.svg',
            'education tools': 'graduation-cap.svg',
            'file conversion': 'file-conversion.svg',
            'health tools': 'heartlefttip.svg',
            'image & media': 'image.svg',
            'math tools': 'calculator.svg',
            'productivity tools': 'flash-on.svg',
            'seo tools': 'search-web.svg',
            'text tools': 'edit-20.svg',
            'utility & data': 'database.svg',
            'date & time': 'hourglass.svg'
        };
        const cards = $$('.category-card');
        cards.forEach(card => {
            const label = card.querySelector('.category-name')?.textContent?.trim().toLowerCase() || '';
            const file = nameToFile[label];
            const iconContainer = card.querySelector('.category-icon');
            if (iconContainer) {
                // Remove any previous img to avoid duplicates
                const oldImg = iconContainer.querySelector('img, svg');
                if (oldImg) oldImg.remove();
                if (file) {
                    const img = document.createElement('img');
                    img.src = iconBasePath + file;
                    img.alt = label + ' icon';
                    img.loading = 'eager';
                    iconContainer.appendChild(img);
                }
            }
        });
    }
    
    /**
     * Initialize blog cards reference and data attributes
     */
    function initializeBlogCards() {
        state.blogCards = $$('.blog-card');
        
        // Ensure all cards have required data attributes
        state.blogCards.forEach((card, index) => {
            ensureCardDataAttributes(card, index);
        });
        
        console.log(`Initialized ${state.blogCards.length} blog cards`);
    }
    
    /**
     * Ensure card has all required data attributes
     */
    function ensureCardDataAttributes(card, index) {
        const title = card.querySelector('.blog-card-title')?.textContent?.trim() || '';
        const excerpt = card.querySelector('.blog-card-excerpt')?.textContent?.trim() || '';
        const category = card.getAttribute('data-category') || '';
        const author = card.querySelector('.blog-card-author span')?.textContent?.trim() || '';
        const dateText = card.querySelector('.blog-card-date span')?.textContent?.trim() || '';
        
        card.setAttribute('data-title', title);
        card.setAttribute('data-excerpt', excerpt);
        card.setAttribute('data-author', author);
        card.setAttribute('data-date-text', dateText);
        
        // Set default aria attributes
        if (!card.getAttribute('role')) {
            card.setAttribute('role', 'article');
        }
        
        if (!card.getAttribute('aria-labelledby')) {
            const titleId = `blog-title-${index}`;
            const titleEl = card.querySelector('.blog-card-title');
            if (titleEl) {
                titleEl.id = titleId;
                card.setAttribute('aria-labelledby', titleId);
            }
        }
    }
    
    /**
     * Initialize smooth scrolling for navigation
     */
    function initSmoothScrolling() {
        const exploreBlogsBtn = $('.hero-btn.primary');
        const trendingBtn = $('.hero-btn-trending.primary');
        
        if (exploreBlogsBtn) {
            exploreBlogsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                scrollToSection('#blog-section');
            });
        }
        
        if (trendingBtn) {
            trendingBtn.addEventListener('click', function(e) {
                e.preventDefault();
                scrollToSection('#trending-section');
            });
        }
    }
    
    /**
     * Smooth scroll to section with accessibility
     */
    function scrollToSection(selector) {
        const section = $(selector);
        if (section) {
            section.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Focus management for accessibility
            setTimeout(() => {
                const firstFocusable = section.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])');
                if (firstFocusable) {
                    firstFocusable.focus();
                }
            }, 500);
        }
    }
    
    // ============================================
    // INTERSECTION OBSERVER - ANIMATE ON SCROLL
    // ============================================
    
    /**
     * Initialize scroll animations using Intersection Observer
     */
    function initScrollAnimations() {
        if (!('IntersectionObserver' in window)) {
            $$('[data-aos]').forEach(element => {
                element.classList.add('aos-animate');
            });
            return;
        }
        
        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -50px 0px',
            threshold: 0.1
        };
        
        state.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = entry.target.getAttribute('data-aos-delay') || 0;
                    setTimeout(() => {
                        entry.target.classList.add('aos-animate');
                    }, parseInt(delay));
                    state.intersectionObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Observe all elements with data-aos attribute
        const animatedElements = $$('[data-aos]');
        animatedElements.forEach(element => {
            state.intersectionObserver.observe(element);
        });
    }
    
    // ============================================
    // LOAD MORE FUNCTIONALITY
    // ============================================
    
    /**
     * Initialize load more functionality
     */
    function initLoadMore() {
        const loadMoreBtn = $('#loadMoreBtn');
        const blogGrid = $('#blogGrid');
        
        if (!loadMoreBtn || !blogGrid) return;
        
        // Additional blog cards data
        const additionalBlogs = getCachedData('additionalBlogs', () => [
            {
                id: 7,
                title: "Building Scalable APIs with Modern Architecture",
                excerpt: "Learn how to design and implement scalable RESTful APIs using the latest architectural patterns and best practices for high-performance applications.",
                author: "Alex Thompson",
                date: "2025-03-01",
                dateText: "March 1, 2025",
                category: "Development",
                image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                link: "articles/scalable-apis-guide.html"
            },
            {
                id: 8,
                title: "The Future of Remote Work Technology",
                excerpt: "Explore emerging technologies and tools that are shaping the future of remote work, from virtual collaboration to AI-powered productivity solutions.",
                author: "Maria Gonzalez",
                date: "2025-02-28",
                dateText: "February 28, 2025",
                category: "Technology",
                image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                link: "articles/remote-work-future.html"
            },
            {
                id: 9,
                title: "Mastering CSS Grid and Flexbox",
                excerpt: "A comprehensive guide to modern CSS layout techniques, including practical examples and real-world applications for responsive web design.",
                author: "James Wilson",
                date: "2025-02-25",
                dateText: "February 25, 2025",
                category: "Design",
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                link: "articles/css-grid-flexbox.html"
            },
            {
                id: 10,
                title: "JavaScript Performance Optimization Techniques",
                excerpt: "Discover proven strategies to optimize JavaScript performance, reduce bundle sizes, and create faster, more efficient web applications.",
                author: "Sarah Kim",
                date: "2025-02-22",
                dateText: "February 22, 2025",
                category: "Development",
                image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                link: "articles/js-performance-optimization.html"
            },
            {
                id: 11,
                title: "Cloud Computing Fundamentals for Beginners",
                excerpt: "Get started with cloud computing by understanding the core concepts, services, and platforms that power modern applications and businesses.",
                author: "Robert Chen",
                date: "2025-02-20",
                dateText: "February 20, 2025",
                category: "Technology",
                image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                link: "articles/cloud-computing-basics.html"
            },
            {
                id: 12,
                title: "Content Marketing Strategies That Convert",
                excerpt: "Learn how to create compelling content that engages your audience and drives conversions, with actionable strategies for digital marketers.",
                author: "Emma Davis",
                date: "2025-02-18",
                dateText: "February 18, 2025",
                category: "Marketing",
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
                link: "articles/content-marketing-strategies.html"
            }
        ]);
        
        loadMoreBtn.addEventListener('click', function() {
            if (state.isLoading) return;
            
            handleLoadMore(additionalBlogs, loadMoreBtn);
        });
        
        // Make function globally accessible for filter updates
    }
    
    /**
     * Handle load more blogs with animations and state management
     */
    function handleLoadMore(additionalBlogs, loadMoreBtn) {
        state.isLoading = true;
        
        // Show loading state
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i><span>Loading...</span>';
        
        const blogsToLoad = additionalBlogs.slice(state.loadedCount, state.loadedCount + state.blogsPerLoad);
        
        if (blogsToLoad.length === 0) {
            loadMoreBtn.style.display = 'none';
            announceChange('All articles have been loaded');
            return;
        }
        
        // Simulate loading delay for better UX
        setTimeout(() => {
            blogsToLoad.forEach((blog, index) => {
                const blogCard = createBlogCard(blog, (state.loadedCount + index + 1) * 100);
                blogCard.classList.add('fade-out');
                $('#blogGrid').appendChild(blogCard);
                
                // Animate in with delay
                setTimeout(() => {
                    blogCard.classList.remove('fade-out');
                    blogCard.classList.add('fade-in');
                }, index * config.animationDelay);
            });
            
            state.loadedCount += blogsToLoad.length;
            
            // Update references and re-filter
            updateBlogCardsReference();
            if (window.buildCategoryFilters) {
                window.buildCategoryFilters();
            }
            if (window.filterBlogCards) {
                window.filterBlogCards();
            }
            
            // Re-initialize scroll animations for new cards
            reinitializeScrollAnimations();
            
            // Update button state
            updateLoadMoreButton(loadMoreBtn, additionalBlogs.length);
            
            // Announce to screen readers
            announceChange(`Loaded ${blogsToLoad.length} more articles`);
            
            state.isLoading = false;
        }, 500);
    }
    
    /**
     * Update load more button state and text
     */
    function updateLoadMoreButton(loadMoreBtn, totalBlogs) {
        const remaining = totalBlogs - state.loadedCount;
        
        if (remaining <= 0) {
            loadMoreBtn.style.display = 'none';
            announceChange('All articles have been loaded');
        } else {
            loadMoreBtn.disabled = false;
            loadMoreBtn.innerHTML = `
                <i class="fas fa-plus" aria-hidden="true"></i>
                <span>Load More Articles</span>
                ${remaining <= state.blogsPerLoad ? 
                    `<span class="load-more-count">${remaining} left</span>` : 
                    ''
                }
            `;
        }
    }

    /**
     * Show error message to the user
     */
    function showErrorMessage(message) {
        console.error('User-facing Error:', message);
        const blogGrid = $('#blogGrid');
        if (blogGrid) {
            blogGrid.innerHTML = `<div class="error-message" role="alert" style="text-align: center; color: var(--secondary); padding: 2rem;">
                <i class="fas fa-exclamation-triangle" aria-hidden="true" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>${message}</p>
                <p>Please check the console for more details.</p>
            </div>`;
        }
    }
    
    /**
     * Create blog card DOM element with accessibility
     */
    function createBlogCard(blog, delay) {
        const article = document.createElement('article');
        const cardIndex = state.blogCards.length + state.loadedCount;
        
        article.className = 'blog-card';
        article.setAttribute('data-category', blog.category);
        article.setAttribute('data-title', blog.title);
        article.setAttribute('data-excerpt', blog.excerpt);
        article.setAttribute('data-author', blog.author);
        article.setAttribute('data-date', blog.date);
        article.setAttribute('data-date-text', blog.dateText);
        article.setAttribute('data-aos', 'fade-up');
        article.setAttribute('data-aos-delay', delay);
        article.setAttribute('role', 'article');
        
        article.innerHTML = `
            <div class="blog-card-image">
                <img src="${blog.image}" alt="${blog.title} - ${blog.category} article" loading="lazy">
            </div>
            <div class="blog-card-content">
                <div class="blog-card-category">${blog.category}</div>
                <h3 class="blog-card-title">${blog.title}</h3>
                <p class="blog-card-excerpt">${blog.excerpt}</p>
                <div class="blog-card-meta">
                    <div class="blog-card-author">
                        <i class="fas fa-user-circle" aria-hidden="true"></i>
                        <span>${blog.author}</span>
                    </div>
                    <div class="blog-card-date">
                        <i class="far fa-calendar" aria-hidden="true"></i>
                        <span>${blog.dateText}</span>
                    </div>
                </div>
            </div>
            <a href="${blog.link}" class="blog-card-link" aria-label="Read: ${blog.title}"></a>
        `;
        
        // Add event listeners
        addCardEventListeners(article);
        
        return article;
    }
    
    /**
     * Add event listeners to blog card
     */
    function addCardEventListeners(card) {
        // Enhanced hover effects
        card.addEventListener('mouseenter', function() {
            const img = card.querySelector('.blog-card-image img');
            if (img) {
                img.style.transform = 'scale(1.05)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const img = card.querySelector('.blog-card-image img');
            if (img) {
                img.style.transform = 'scale(1)';
            }
        });
        
        // Keyboard navigation
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const link = card.querySelector('.blog-card-link');
                if (link) {
                    link.click();
                }
            }
        });
        
        // Make card focusable
        card.setAttribute('tabindex', '0');
    }
    
    /**
     * Update blog cards reference
     */
    function updateBlogCardsReference() {
        state.blogCards = $$('.blog-card');
    }
    
    /**
     * Reinitialize scroll animations for dynamically added content
     */
    function reinitializeScrollAnimations() {
        if (state.intersectionObserver) {
            const newElements = $$('.blog-card:not([data-aos-initialized])');
            newElements.forEach(element => {
                element.setAttribute('data-aos-initialized', 'true');
                state.intersectionObserver.observe(element);
            });
        }
    }
    
    // ============================================
    // BLOG SEARCH & FILTER FUNCTIONALITY
    // ============================================
    
    /**
     * Initialize blog search and filter functionality
     */
    function initBlogSearchAndFilter() {
        const searchInput = $('#blogSearch');
        const searchClear = $('#searchClear');
        const filterContainer = $('.category-filter');
        
        if (!filterContainer) return;
        
        // Build filters dynamically based on present cards
        buildCategoryFilters();
        
        // Debounced search functionality
        if (searchInput) {
            const debouncedSearch = debounce(function(e) {
                state.currentSearch = e.target.value.toLowerCase().trim();
                updateSearchClearButton();
                filterBlogCards();
            }, config.debounceDelay);
            
            searchInput.addEventListener('input', debouncedSearch);
            
            // Clear search
            if (searchClear) {
                searchClear.addEventListener('click', function() {
                    searchInput.value = '';
                    state.currentSearch = '';
                    updateSearchClearButton();
                    filterBlogCards();
                    searchInput.focus();
                    announceChange('Search cleared');
                });
            }
        }
        
        // Filter functionality via event delegation
        filterContainer.addEventListener('click', function(e) {
            const button = e.target.closest('.filter-btn');
            if (!button) return;
            
            const allButtons = filterContainer.querySelectorAll('.filter-btn');
            allButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            });
            
            button.classList.add('active');
            button.setAttribute('aria-pressed', 'true');
            state.currentFilter = button.getAttribute('data-category');
            
            filterBlogCards();
            
            // Announce filter change
            const filterName = button.textContent.trim();
            announceChange(`Filtered by ${filterName}`);
        });
        
        // Make functions globally accessible
        window.filterBlogCards = filterBlogCards;
        window.buildCategoryFilters = buildCategoryFilters;
        
        // Initialize
        filterBlogCards();
    }
    
    /**
     * Update search clear button visibility
     */
    function updateSearchClearButton() {
        const searchClear = $('#searchClear');
        if (searchClear) {
            searchClear.style.display = state.currentSearch ? 'flex' : 'none';
        }
    }
    
    /**
     * Filter blog cards based on current search and filter
     */
    function filterBlogCards() {
        if (state.isFiltering) return;
        state.isFiltering = true;
        
        const startTime = performance.now();
        
        try {
            // Update blogCards reference to include dynamically added cards
            updateBlogCardsReference();
            
            let visibleCount = 0;
            const cardsToHide = [];
            const cardsToShow = [];
            
            // Batch DOM operations
            state.blogCards.forEach(card => {
                const matches = checkCardMatch(card);
                
                if (matches) {
                    cardsToShow.push(card);
                    visibleCount++;
                } else {
                    cardsToHide.push(card);
                }
            });
            
            // Apply changes in batches
            requestAnimationFrame(() => {
                cardsToShow.forEach((card, index) => {
                    showCard(card, index);
                });
                
                setTimeout(() => {
                    cardsToHide.forEach(card => {
                        hideCard(card);
                    });
                    
                    // Update layout
                    updateBlogGridLayout(visibleCount);
                    
                    // Show no results message if needed
                    showNoResultsMessage(visibleCount);
                    
                    const endTime = performance.now();
                    console.log(`Filter operation took ${(endTime - startTime).toFixed(2)}ms`);
                    
                    state.isFiltering = false;
                }, cardsToShow.length * 50);
            });
            
        } catch (error) {
            console.error('Filter error:', error);
            state.isFiltering = false;
        }
    }
    
    /**
     * Check if card matches current search and filter criteria
     */
    function checkCardMatch(card) {
        const cardCategory = normalizeCategory(card.getAttribute('data-category'));
        const cardTitle = (card.getAttribute('data-title') || '').toLowerCase();
        const cardExcerpt = (card.getAttribute('data-excerpt') || '').toLowerCase();
        const cardAuthor = (card.getAttribute('data-author') || '').toLowerCase();
        
        // Check filter
        const filterMatch = state.currentFilter === 'all' || cardCategory === normalizeCategory(state.currentFilter);
        
        // Check search
        const searchMatch = !state.currentSearch || 
            cardTitle.includes(state.currentSearch) || 
            cardExcerpt.includes(state.currentSearch) ||
            cardAuthor.includes(state.currentSearch);
        
        return filterMatch && searchMatch;
    }
    
    /**
     * Show card with animation
     */
    function showCard(card, index) {
        card.classList.remove('hidden', 'fade-out');
        card.style.display = 'block';
        
        // Animate in
        setTimeout(() => {
            card.classList.add('fade-in');
        }, index * config.animationDelay);
    }
    
    /**
     * Hide card with animation
     */
    function hideCard(card) {
        card.classList.remove('fade-in');
        card.classList.add('fade-out');
        
        setTimeout(() => {
            card.classList.add('hidden');
            card.style.display = 'none';
        }, 200);
    }
    
    /**
     * Update blog grid layout based on visible cards count
     */
    function updateBlogGridLayout(visibleCount) {
        const blogGrid = $('#blogGrid');
        if (!blogGrid) return;
        
        blogGrid.classList.remove('single', 'double', 'triple');
        
        if (visibleCount === 1) {
            blogGrid.classList.add('single');
        } else if (visibleCount === 2) {
            blogGrid.classList.add('double');
        } else if (visibleCount === 3) {
            blogGrid.classList.add('triple');
        }
    }
    
    /**
     * Show no results message if needed
     */
    function showNoResultsMessage(visibleCount) {
        const noResultsMsg = $('#noResultsMessage');
        const loadMoreBtn = $('#loadMoreBtn');
        
        if (visibleCount === 0) {
            if (noResultsMsg) {
                noResultsMsg.style.display = 'block';
            }
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }
            announceChange('No articles match your search criteria');
        } else {
            if (noResultsMsg) {
                noResultsMsg.style.display = 'none';
            }
            if (loadMoreBtn && state.loadedCount === 0) {
                // Only show load more if we haven't loaded additional content
                loadMoreBtn.style.display = 'block';
            }
        }
    }
    
    /**
     * Build category filter buttons based on current cards
     */
    function buildCategoryFilters() {
        const filterContainer = $('.category-filter');
        if (!filterContainer) return;
        
        try {
            // Get unique categories from current cards
            const categories = getCachedData('categories', () => {
                const cats = new Set();
                state.blogCards.forEach(card => {
                    const cat = card.getAttribute('data-category');
                    if (cat && config.categories.includes(cat)) {
                        cats.add(cat);
                    }
                });
                return Array.from(cats).sort();
            });
            
            // Preserve current filter if possible
            if (!state.currentFilter || state.currentFilter === 'all') {
                state.currentFilter = 'all';
            } else if (!categories.includes(state.currentFilter)) {
                state.currentFilter = 'all';
            }
            
            // Build buttons HTML
            let html = `
                <button class="filter-btn ${state.currentFilter === 'all' ? 'active' : ''}" 
                        data-category="all" 
                        aria-pressed="${state.currentFilter === 'all' ? 'true' : 'false'}">
                  <i class="fas fa-th-large" aria-hidden="true"></i>
                  All Articles
                </button>`;
            
            categories.forEach(cat => {
                const icon = config.categoryIcons[cat] || 'fa-tag';
                const active = state.currentFilter === cat ? 'active' : '';
                const pressed = state.currentFilter === cat ? 'true' : 'false';
                
                html += `
                <button class="filter-btn ${active}" 
                        data-category="${cat}"
                        aria-pressed="${pressed}">
                  <i class="fas ${icon}" aria-hidden="true"></i>
                  ${cat}
                </button>`;
            });
            
            filterContainer.innerHTML = html;
            
        } catch (error) {
            console.error('Build filters error:', error);
            // Fallback to loading state
            filterContainer.innerHTML = `
                <div class="loading-filters">
                    <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
                    <span>Error loading filters</span>
                </div>
            `;
        }
    }
    
    // ============================================
    // LAZY LOADING FOR IMAGES
    // ============================================
    
    /**
     * Initialize lazy loading for images
     */
    function initLazyLoading() {
        const images = $$('img[loading="lazy"]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.classList.add('loaded');
                        imageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px'
            });
            
            images.forEach(img => {
                img.classList.add('lazy');
                imageObserver.observe(img);
            });
        }
    }
    
    // ============================================
    // PERFORMANCE OPTIMIZATIONS
    // ============================================
    
    /**
     * Initialize performance optimizations
     */
    function initPerformanceOptimizations() {
        // Throttled scroll handler
        const throttledScroll = throttle(handleScroll, 16);
        window.addEventListener('scroll', throttledScroll);
        
        // Preload critical images
        preloadCriticalImages();
        
        // Memory management
        window.addEventListener('beforeunload', cleanup);
    }
    
    /**
     * Handle scroll events with performance optimization
     */
    function handleScroll() {
        const scrolled = window.pageYOffset;
        const heroSection = $('.hero-section');
        
        if (heroSection) {
            // Parallax effect for hero background
            const shapes = $$('.hero-circle', heroSection);
            shapes.forEach((shape, index) => {
                const speed = 0.5 + (index * 0.2);
                shape.style.transform = `translateY(${scrolled * speed}px)`;
            });
        }
    }
    
    /**
     * Preload critical images for better performance
     */
    function preloadCriticalImages() {
        const criticalImages = getCachedData('criticalImages', () => [
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        ]);
        
        criticalImages.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }
    
    // ============================================
    // TRENDING ARTICLES SECTION
    // ============================================
    
    /**
     * Initialize blog carousel
     */
    function initBlogCarousel() {
        const blogCarousel = $('#blogDetailsCarousel');
        if (!blogCarousel) return;
        
        const blogItems = $$('.blog-detail-item', blogCarousel);
        let blogDots = $$('.carousel-dot');
        const featureImageEl = $('#featureImage');
        let blogCurrentSlide = 0;
        let blogAutoScrollInterval = null;
        const BLOG_AUTOSCROLL_MS = 6000;
        
        // Prepare/normalize carousel dots
        const blogCarouselNav = $('.blog-carousel-nav');
        if (blogItems.length <= 1 && blogCarouselNav) {
            blogCarouselNav.style.display = 'none';
            return;
        }
        if (blogCarouselNav) {
            blogCarouselNav.innerHTML = '';
            for (let i = 0; i < blogItems.length; i++) {
                const btn = document.createElement('button');
                btn.className = `carousel-dot${i === 0 ? ' active' : ''}`;
                btn.setAttribute('data-slide', String(i));
                btn.setAttribute('aria-label', `Go to slide ${i + 1}`);
                blogCarouselNav.appendChild(btn);
            }
            blogDots = $$('.carousel-dot', blogCarouselNav);
        }
        
        function showBlogSlide(index) {
            blogItems.forEach((item, i) => {
                const isActive = i === index;
                item.classList.toggle('active', isActive);
                item.style.display = isActive ? 'block' : 'none';
            });
            
            blogDots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
                dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            });

            // Sync the feature image with the active article
            if (featureImageEl && blogItems[index]) {
                const newSrc = blogItems[index].getAttribute('data-image');
                if (newSrc && featureImageEl.getAttribute('src') !== newSrc) {
                    featureImageEl.setAttribute('src', newSrc);
                }
            }
        }
        
        function nextBlogSlide() {
            blogCurrentSlide = (blogCurrentSlide + 1) % blogItems.length;
            showBlogSlide(blogCurrentSlide);
        }
        
        function startAutoScroll() {
            if (blogAutoScrollInterval) {
                clearInterval(blogAutoScrollInterval);
            }
            blogAutoScrollInterval = setInterval(nextBlogSlide, BLOG_AUTOSCROLL_MS);
        }
        
        function stopAutoScroll() {
            if (blogAutoScrollInterval) {
                clearInterval(blogAutoScrollInterval);
                blogAutoScrollInterval = null;
            }
        }
        
        // Dot navigation
        blogDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                blogCurrentSlide = index;
                showBlogSlide(blogCurrentSlide);
                stopAutoScroll();
                startAutoScroll();
            });
        });
        
        // Mouse hover pause
        blogCarousel.addEventListener('mouseenter', stopAutoScroll);
        blogCarousel.addEventListener('mouseleave', startAutoScroll);
        
        // Ensure only the first item is visible on load
        showBlogSlide(0);
        
        // Initialize
        startAutoScroll();
    }

    // ============================================
    // CATEGORY CAROUSEL
    // ============================================
    
    /**
     * Initialize category carousel
     */
    function initCategoryCarousel() {
        const carousel = $('#categoryCardCarousel');
        if (!carousel) return;
        
        const prevBtn = $('#categoryPrevBtn');
        const nextBtn = $('#categoryNextBtn');
        const scrollAmount = 300; // Adjust as needed
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });
        }
    }

    // ============================================
    // ACCESSIBILITY & MOBILE OPTIMIZATIONS
    // ============================================
    
    /**
     * Initialize accessibility features
     */
    function initAccessibility() {
        // Focus outlines
        document.body.addEventListener('mousedown', () => {
            document.body.classList.add('using-mouse');
        });
        document.body.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.remove('using-mouse');
            }
        });
    }

    /**
     * Initialize mobile-specific optimizations
     */
    function initMobileOptimizations() {
        // Adjust grid layout on smaller screens
        const adjustLayout = () => {
            const blogGrid = $('#blogGrid');
            if (!blogGrid) return;
            
            if (window.innerWidth < 768) {
                blogGrid.classList.add('mobile-view');
            } else {
                blogGrid.classList.remove('mobile-view');
            }
        };
        
        window.addEventListener('resize', debounce(adjustLayout, 200));
        adjustLayout(); // Initial check
    }

    // ============================================
    // PAGE LOAD & VISIBILITY
    // ============================================
    
    /**
     * Handle final setup after page has fully loaded
     */
    function handlePageLoad() {
        const blogGrid = $('#blogGrid');
        if (blogGrid) {
            blogGrid.style.opacity = '1';
        }
    }

    /**
     * Handle page visibility changes
     */
    function handleVisibilityChange() {
        if (document.visibilityState === 'hidden') {
            // Optional: Pause animations or other background tasks
        } else {
            // Optional: Resume tasks
        }
    }

    // ============================================
    // CLEANUP
    // ============================================
    
    /**
     * Cleanup resources to prevent memory leaks
     */
    function cleanup() {
        if (state.intersectionObserver) {
            state.intersectionObserver.disconnect();
        }
        if (state.filtersObserver) {
            state.filtersObserver.disconnect();
        }
        state.memoryCache.clear();
    }

})();

