/**
 * GAMES HUB - INTERACTIVE JAVASCRIPT
 * Modern, clean implementation with smooth animations
 */

class GamesHub {
    constructor() {
        this.currentCategory = 'all';
        this.currentView = 'grid';
        this.searchTerm = '';
        this.games = [];
        
        this.init();
    }

    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.collectGames();
        this.updateCounts();
        this.animateOnScroll();
    }

    cacheElements() {
        // Search elements
        this.searchInput = document.getElementById('search-input');
        this.clearSearchBtn = document.getElementById('clear-search');
        
        // Category elements
        this.categoryButtons = document.querySelectorAll('.sidebar__category');
        this.categoryTitle = document.getElementById('category-title');
        
        // View toggle elements
        this.viewToggles = document.querySelectorAll('.view-toggle');
        this.gamesGrid = document.getElementById('games-grid');
        
        // Game cards
        this.gameCards = document.querySelectorAll('.game-card');
        
        // Empty state
        this.emptyState = document.getElementById('empty-state');
        
        // Count elements
        this.totalGamesElement = document.getElementById('total-games');
        this.heroCategoriesCountElement = document.getElementById('categories-count');
        this.countElements = {
            all: document.getElementById('count-all'),
            puzzle: document.getElementById('count-puzzle'),
            strategy: document.getElementById('count-strategy'),
            arcade: document.getElementById('count-arcade')
        };
    }

    attachEventListeners() {
        // Search functionality
        this.searchInput?.addEventListener('input', (e) => this.handleSearch(e));
        this.clearSearchBtn?.addEventListener('click', () => this.clearSearch());

        // Category filtering
        this.categoryButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleCategoryChange(e));
        });

        // View toggle
        this.viewToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => this.handleViewChange(e));
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboardNav(e));
    }

    collectGames() {
        this.games = Array.from(this.gameCards).map(card => ({
            element: card,
            category: card.dataset.category,
            title: card.querySelector('.game-card__title')?.textContent.toLowerCase() || '',
            description: card.querySelector('.game-card__description')?.textContent.toLowerCase() || ''
        }));
    }

    updateCounts() {
        const counts = {
            all: this.games.length,
            puzzle: 0,
            strategy: 0,
            arcade: 0
        };

        // Count visible categories based on presence in DOM
        const categorySet = new Set();

        this.games.forEach(game => {
            if (counts[game.category] !== undefined) {
                counts[game.category]++;
            }
            categorySet.add(game.category);
        });

        // Update sidebar count badges
        Object.keys(counts).forEach(category => {
            if (this.countElements[category]) {
                this.countElements[category].textContent = counts[category];
            }
        });

        // Update hero stats
        if (this.totalGamesElement) {
            this.totalGamesElement.textContent = counts.all;
        }
        if (this.heroCategoriesCountElement) {
            this.heroCategoriesCountElement.textContent = categorySet.size;
        }
    }

    handleSearch(e) {
        this.searchTerm = e.target.value.toLowerCase().trim();
        
        // Show/hide clear button
        if (this.clearSearchBtn) {
            this.clearSearchBtn.classList.toggle('hidden', !this.searchTerm);
        }

        this.filterGames();
    }

    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
            this.searchTerm = '';
        }
        if (this.clearSearchBtn) {
            this.clearSearchBtn.classList.add('hidden');
        }
        this.filterGames();
    }

    handleCategoryChange(e) {
        const button = e.currentTarget;
        const category = button.dataset.category;

        // Update active state
        this.categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Update current category
        this.currentCategory = category;

        // Update title
        const categoryName = category === 'all' ? 'All Games' : 
            category.charAt(0).toUpperCase() + category.slice(1) + ' Games';
        if (this.categoryTitle) {
            this.categoryTitle.textContent = categoryName;
        }

        this.filterGames();
    }

    handleViewChange(e) {
        const button = e.currentTarget;
        const view = button.dataset.view;

        // Update active state
        this.viewToggles.forEach(toggle => toggle.classList.remove('active'));
        button.classList.add('active');

        // Update view
        this.currentView = view;
        
        if (this.gamesGrid) {
            if (view === 'list') {
                this.gamesGrid.classList.add('list-view');
            } else {
                this.gamesGrid.classList.remove('list-view');
            }
        }
    }

    filterGames() {
        let visibleCount = 0;

        this.games.forEach(game => {
            const matchesCategory = this.currentCategory === 'all' || 
                                   game.category === this.currentCategory;
            
            const matchesSearch = !this.searchTerm || 
                                 game.title.includes(this.searchTerm) || 
                                 game.description.includes(this.searchTerm);

            const isVisible = matchesCategory && matchesSearch;

            if (isVisible) {
                game.element.style.display = 'flex';
                visibleCount++;
                
                // Add animation
                setTimeout(() => {
                    game.element.style.opacity = '1';
                    game.element.style.transform = 'translateY(0)';
                }, 50);
            } else {
                game.element.style.display = 'none';
                game.element.style.opacity = '0';
                game.element.style.transform = 'translateY(20px)';
            }
        });

        // Show/hide empty state
        if (this.emptyState && this.gamesGrid) {
            if (visibleCount === 0) {
                this.emptyState.classList.remove('hidden');
                this.gamesGrid.style.display = 'none';
            } else {
                this.emptyState.classList.add('hidden');
                this.gamesGrid.style.display = 'grid';
            }
        }

        console.log(`Filtered: ${visibleCount} games visible`);
    }

    handleKeyboardNav(e) {
        // Escape key clears search
        if (e.key === 'Escape' && this.searchTerm) {
            this.clearSearch();
        }

        // Slash key focuses search
        if (e.key === '/' && document.activeElement !== this.searchInput) {
            e.preventDefault();
            this.searchInput?.focus();
        }
    }

    animateOnScroll() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            }
        );

        this.gameCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(card);
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const gamesHub = new GamesHub();
    console.log('🎮 Games Hub initialized successfully!');
});

// Smooth scroll for hero CTA
document.addEventListener('DOMContentLoaded', () => {
    const heroCTA = document.querySelector('.hero__cta');
    if (heroCTA) {
        heroCTA.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector('#games-section');
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
});

// Add parallax effect to hero particles
document.addEventListener('DOMContentLoaded', () => {
    const particles = document.querySelector('.hero__particles');
    if (particles) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            particles.style.transform = `translateY(${scrolled * 0.5}px)`;
        });
    }
});

// Add glow effect to game cards on hover
document.addEventListener('DOMContentLoaded', () => {
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.game-card__icon');
            if (icon) {
                icon.style.filter = 'drop-shadow(0 0 20px currentColor)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.game-card__icon');
            if (icon) {
                icon.style.filter = 'none';
            }
        });
    });
});
