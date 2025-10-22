/**
 * ToolsHub Application Script
 * 
 * This script orchestrates the entire functionality of the ToolsHub page,
 * including component loading, dynamic filtering, animations, and voice search.
 */

// ---------- HERO COUNTER: authoritative total ----------
(function setAuthoritativeToolTotal() {
  try {
    // Build master list from original DOM (this captures all tool cards before any trimming)
    const allToolNodes = Array.from(document.querySelectorAll('.tool-card'));
    window.__EVERYTOOL_ALL_TOOL_NODES = allToolNodes; // store master list globally (read-only)
    window.__EVERYTOOL_TOTAL_TOOLS = allToolNodes.length || 0;

    // Immediately set hero counter to the true full total (so initial value is authoritative)
    const heroEl = document.getElementById('tools-count');
    if (heroEl) heroEl.textContent = window.__EVERYTOOL_TOTAL_TOOLS;
    
    console.log(`✅ Authoritative tool total set: ${window.__EVERYTOOL_TOTAL_TOOLS}`);
  } catch (err) {
    console.warn('Error initializing master tool count', err);
  }
})();

/**
 * Loads HTML components like header and footer into specified placeholder elements.
 */
class ComponentLoader {
    async load(componentPath, placeholderId) {
        try {
            const response = await fetch(componentPath);
            if (!response.ok) throw new Error(`Failed to load ${componentPath}: ${response.statusText}`);
            const content = await response.text();
            const placeholder = document.getElementById(placeholderId);
            if (placeholder) {
                placeholder.innerHTML = content;
                console.log(`Successfully loaded ${componentPath} into #${placeholderId}`);
            } else {
                console.error(`Placeholder element #${placeholderId} not found.`);
            }
        } catch (error) {
            console.error(`Error loading component from ${componentPath}:`, error);
            throw error; // Re-throw to be caught by the main app
        }
    }
}

/**
 * Caches all necessary DOM elements for quick access.
 */
class DOMElementManager {
    constructor() {
        this.searchInput = document.getElementById('search-input');
        this.clearSearchBtn = document.getElementById('clear-search');
        this.voiceSearchBtn = document.getElementById('voice-search-btn');
        this.filterButtonsContainer = document.querySelector('.filter-buttons');
        this.filterButtons = document.querySelectorAll('.filter-button');
        this.toolsGrid = document.getElementById('tools-grid');
        this.errorOverlay = document.getElementById('error-overlay');
        this.errorMessage = document.getElementById('error-message');
        this.retryButton = document.getElementById('retry-button');

        console.log('DOM elements cached.');
    }
}

/**
 * Manages all filtering logic including search, category, and voice input.
 */
class ToolsFilterManager {
    constructor(domElements, paginationLoader) {
        this.dom = domElements;
        this.paginationLoader = paginationLoader;
        this.activeCategory = 'all';
        this.debounceTimeout = null;
        this.originalButtonTexts = new Map(); // To store original button text
        this.isAscending = true; // A–Z sort order
    }

    init() {
        // Store the original text of each button before any modifications
        this.dom.filterButtons.forEach(btn => {
            this.originalButtonTexts.set(btn, btn.textContent.trim());
        });

        this.dom.searchInput.addEventListener('input', () => {
            this.dom.clearSearchBtn.classList.toggle('hidden', this.dom.searchInput.value === '');
            this.debounceFilter();
        });

        this.dom.clearSearchBtn.addEventListener('click', () => this.clearSearch());

        this.dom.filterButtonsContainer.addEventListener('click', (e) => this.handleCategoryFilter(e));

        this.dom.voiceSearchBtn.addEventListener('click', () => this.startVoiceRecognition());

        // Sort A–Z button
        const sortBtn = document.getElementById('sort-az-btn');
        if (sortBtn) {
            sortBtn.addEventListener('click', () => {
                this.isAscending = !this.isAscending; // toggle order
                const icon = sortBtn.querySelector('i');
                if (icon) {
                    icon.className = this.isAscending
                        ? 'fa-solid fa-arrow-down-a-z'
                        : 'fa-solid fa-arrow-up-a-z';
                }
                this.sortToolsByName(this.isAscending);
                this.filterTools();
            });
        }

        // Grid/List toggle
        const viewToggleBtn = document.getElementById('view-toggle-btn');
        if (viewToggleBtn && this.dom.toolsGrid) {
            viewToggleBtn.addEventListener('click', () => {
                const grid = this.dom.toolsGrid;
                const isList = grid.classList.contains('list-view');
                if (isList) {
                    grid.classList.remove('list-view');
                    grid.classList.add('grid-view');
                } else {
                    grid.classList.remove('grid-view');
                    grid.classList.add('list-view');
                }
                const icon = viewToggleBtn.querySelector('i');
                if (icon) {
                    const nowList = grid.classList.contains('list-view');
                    icon.className = nowList ? 'fa-solid fa-list' : 'fa-solid fa-table-cells-large';
                }
            });
        }
        
        // Handle initial page load state
        this.filterFromURL();
        console.log('ToolsFilterManager initialized.');
    }

    sortToolsByName(ascending = true) {
        // Update the sort order and trigger filtering
        this.isAscending = ascending;
        this.filterTools();
    }

    /**
     * Resets all buttons to their original text and removes the active class.
     */
    resetAllButtons() {
        this.dom.filterButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.textContent = this.originalButtonTexts.get(btn);
        });
    }

    /**
     * Sets a specific button as active, updates its text with the count, and filters the tools.
     * @param {HTMLElement} buttonToActivate The button element to make active.
     */
    setActiveCategory(buttonToActivate) {
        this.resetAllButtons();

        // Activate the new button
        buttonToActivate.classList.add('active');
        this.activeCategory = buttonToActivate.dataset.category;

        // Calculate count from pagination loader
        const category = this.activeCategory;
        const filteredList = this.paginationLoader.getFilteredList('', category, this.isAscending);
        const count = filteredList.length;
        
        const originalText = this.originalButtonTexts.get(buttonToActivate);
        buttonToActivate.textContent = `${originalText} (${count})`;

        // Perform the filtering (this will also update the hero count)
        this.filterTools();
    }

    debounceFilter() {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            this.filterTools();
        }, 300);
    }

    filterTools() {
        const searchTerm = this.dom.searchInput.value.toLowerCase().trim();
        
        // Get filtered list from pagination loader
        const filteredList = this.paginationLoader.getFilteredList(searchTerm, this.activeCategory, this.isAscending);
        
        // Reset pagination to show first batch of filtered results
        this.paginationLoader.resetToList(filteredList);
        
        // Update tools count: show filtered count only if there's an active filter/search
        // Otherwise, show the authoritative total (77)
        if (searchTerm || (this.activeCategory && this.activeCategory !== 'all')) {
            updateToolsCountDisplay(filteredList.length);
            console.log(`Filtered tools for: [Category: ${this.activeCategory}, Search: "${searchTerm}"] - ${filteredList.length} results`);
        } else {
            // No active filter - show authoritative total
            const authoritativeTotal = window.__EVERYTOOL_TOTAL_TOOLS || 0;
            updateToolsCountDisplay(authoritativeTotal);
            console.log(`No active filter - showing authoritative total: ${authoritativeTotal}`);
        }
    }

    handleCategoryFilter(e) {
        const button = e.target.closest('.filter-button');
        if (button) {
            this.setActiveCategory(button);
        }
    }
    
    filterFromURL() {
        const params = new URLSearchParams(window.location.search);
        const category = params.get('category');
        let targetButton = null;

        if (category) {
            targetButton = document.querySelector(`.filter-button[data-category="${category}"]`);
        }
        
        // If no valid category in URL, default to the 'all' button
        if (!targetButton) {
            targetButton = document.querySelector('.filter-button[data-category="all"]');
        }

        if (targetButton) {
            this.setActiveCategory(targetButton);
            console.log(`Set initial filter from URL or default: category=${this.activeCategory}`);
        }
    }

    clearSearch() {
        this.dom.searchInput.value = '';
        this.dom.clearSearchBtn.classList.add('hidden');
        this.filterTools();
    }

    startVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Sorry, your browser does not support voice recognition.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        this.dom.voiceSearchBtn.classList.add('recording'); // You can add a .recording class in CSS for feedback
        console.log('Voice recognition started...');

        recognition.onresult = (event) => {
            const speechResult = event.results[0][0].transcript;
            this.dom.searchInput.value = speechResult;
            this.dom.clearSearchBtn.classList.remove('hidden');
            this.filterTools();
            console.log(`Voice recognition result: "${speechResult}"`);
        };

        recognition.onspeechend = () => {
            recognition.stop();
            this.dom.voiceSearchBtn.classList.remove('recording');
            console.log('Voice recognition ended.');
        };

        recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            this.dom.voiceSearchBtn.classList.remove('recording');
        };

        recognition.start();
    }
}

/**
 * Manages scroll-based animations using IntersectionObserver.
 */
class AnimationManager {
    constructor(domElements) {
        this.dom = domElements;
        this.observer = null;
    }

    init() {
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported. Animations will be disabled.');
            return;
        }

        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        this.observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        console.log('AnimationManager initialized with IntersectionObserver.');
    }

    // Method to observe newly added tool cards
    observeNewCards(cards) {
        if (this.observer) {
            cards.forEach(card => this.observer.observe(card));
        }
    }
}

/**
 * Placeholder for header-specific logic like scroll behavior.
 */
class HeaderManager {
    init() {
        // Example: Add a 'scrolled' class to the header on scroll
        // This requires the header HTML to be loaded first.
        window.addEventListener('scroll', () => {
            const header = document.querySelector('header'); // Assuming header tag inside loaded component
            if(header) {
                if (window.scrollY > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            }
        });
        console.log('HeaderManager initialized.');
    }
}

/**
 * Manages pagination and incremental loading of tool cards.
 */
class PaginationLoader {
    constructor(domElements, animationManager = null) {
        this.dom = domElements;
        this.animationManager = animationManager;
        this.allToolNodes = [];
        this.currentList = [];
        this.currentIndex = 0;
        this.initialBatch = 30;
        this.batchSize = 30;
        this.loadMoreBtn = document.getElementById('load-more-btn');
        this.loadMoreContainer = document.getElementById('load-more-container');
        this.ariaUpdates = document.getElementById('aria-updates');
        this.isLoading = false;
    }

    init() {
        // Check for rollback flag
        if (window.FORCE_FULL_RENDER) {
            console.log('FORCE_FULL_RENDER flag detected, skipping pagination');
            return;
        }
        
        this.initMasterList();
        this.renderInitial();
        this.setupLoadMoreButton();
        console.log('PaginationLoader initialized.');
    }

    initMasterList() {
        // Use the authoritative master list if available, otherwise capture from DOM
        if (window.__EVERYTOOL_ALL_TOOL_NODES && window.__EVERYTOOL_ALL_TOOL_NODES.length > 0) {
            this.allToolNodes = [...window.__EVERYTOOL_ALL_TOOL_NODES];
            console.log(`Master list initialized from authoritative source: ${this.allToolNodes.length} tools`);
        } else {
            // Fallback: capture all tool cards in their original order
            this.allToolNodes = Array.from(document.querySelectorAll('.tool-card'));
            console.log(`Master list initialized from DOM fallback: ${this.allToolNodes.length} tools`);
        }
        
        // Validate that we have tool cards
        if (this.allToolNodes.length === 0) {
            console.warn('No tool cards found in the DOM');
            return;
        }
        
        this.currentList = [...this.allToolNodes];
        console.log(`Master list initialized with ${this.allToolNodes.length} tools`);
    }

    renderInitial() {
        // Clear the grid and render first batch
        this.dom.toolsGrid.innerHTML = '';
        this.currentIndex = 0;
        
        // Check if we have tools to render
        if (this.currentList.length === 0) {
            console.warn('No tools to render');
            this.hideLoadMoreButton();
            return;
        }
        
        const fragment = document.createDocumentFragment();
        const initialTools = this.currentList.slice(0, this.initialBatch);
        
        initialTools.forEach(tool => {
            // Add animation classes for newly rendered tools
            tool.classList.add('animate-fade-up');
            fragment.appendChild(tool);
        });
        
        this.dom.toolsGrid.appendChild(fragment);
        this.currentIndex = initialTools.length;
        
        // Observe new cards for animations
        if (this.animationManager) {
            this.animationManager.observeNewCards(initialTools);
        }
        
        // Update button visibility
        this.updateLoadMoreButton();
        
        // Announce to screen readers
        this.announceUpdate(`Showing 1–${this.currentIndex} of ${this.currentList.length} tools`);
        
        console.log(`Rendered initial batch: ${initialTools.length} tools`);
    }

    loadMore() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.loadMoreBtn.disabled = true;
        this.loadMoreBtn.setAttribute('aria-busy', 'true');
        
        const remainingTools = this.currentList.slice(this.currentIndex);
        const nextBatch = remainingTools.slice(0, this.batchSize);
        
        if (nextBatch.length === 0) {
            this.hideLoadMoreButton();
            this.isLoading = false;
            return;
        }
        
        const fragment = document.createDocumentFragment();
        nextBatch.forEach(tool => {
            // Add animation classes for newly loaded tools
            tool.classList.add('animate-fade-up');
            fragment.appendChild(tool);
        });
        
        this.dom.toolsGrid.appendChild(fragment);
        this.currentIndex += nextBatch.length;
        
        // Observe new cards for animations
        if (this.animationManager) {
            this.animationManager.observeNewCards(nextBatch);
        }
        
        // Update button state
        this.loadMoreBtn.disabled = false;
        this.loadMoreBtn.removeAttribute('aria-busy');
        this.isLoading = false;
        
        // Update button visibility
        this.updateLoadMoreButton();
        
        // Announce to screen readers
        this.announceUpdate(`${nextBatch.length} more tools loaded`);
        
        console.log(`Loaded ${nextBatch.length} more tools. Total visible: ${this.currentIndex}`);
    }

    resetToList(listArray) {
        // Clear current display and render first batch of new list
        this.currentList = [...listArray];
        this.renderInitial();
        console.log(`Reset to new list with ${listArray.length} tools`);
    }

    getFilteredList(searchTerm, activeCategory, sortOrder) {
        let filtered = [...this.allToolNodes];
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(tool => {
                try {
                    const nameElement = tool.querySelector('.tool-name');
                    const descElement = tool.querySelector('.tool-description');
                    
                    if (!nameElement || !descElement) {
                        console.warn('Tool card missing required elements:', tool);
                        return false;
                    }
                    
                    const name = nameElement.textContent.toLowerCase();
                    const description = descElement.textContent.toLowerCase();
                    return name.includes(searchTerm) || description.includes(searchTerm);
                } catch (error) {
                    console.warn('Error processing tool card:', error, tool);
                    return false;
                }
            });
        }
        
        // Apply category filter
        if (activeCategory && activeCategory !== 'all') {
            filtered = filtered.filter(tool => tool.dataset.category === activeCategory);
        }
        
        // Apply sorting
        if (sortOrder !== undefined) {
            filtered.sort((a, b) => {
                try {
                    const nameA = a.querySelector('.tool-name')?.textContent.toLowerCase() || '';
                    const nameB = b.querySelector('.tool-name')?.textContent.toLowerCase() || '';
                    if (nameA < nameB) return sortOrder ? -1 : 1;
                    if (nameA > nameB) return sortOrder ? 1 : -1;
                    return 0;
                } catch (error) {
                    console.warn('Error sorting tool cards:', error);
                    return 0;
                }
            });
        }
        
        return filtered;
    }

    setupLoadMoreButton() {
        if (this.loadMoreBtn) {
            this.loadMoreBtn.addEventListener('click', () => this.loadMore());
        }
    }

    updateLoadMoreButton() {
        if (!this.loadMoreContainer) return;
        
        const hasMore = this.currentIndex < this.currentList.length;
        if (hasMore) {
            this.loadMoreContainer.style.display = 'block';
        } else {
            this.hideLoadMoreButton();
        }
    }

    hideLoadMoreButton() {
        if (this.loadMoreContainer) {
            this.loadMoreContainer.style.display = 'none';
        }
    }

    announceUpdate(message) {
        if (this.ariaUpdates) {
            this.ariaUpdates.textContent = message;
        }
    }

    // Method to get current visible count for stats
    getVisibleCount() {
        return this.currentIndex;
    }

    // Method to get total available count
    getTotalCount() {
        return this.currentList.length;
    }
}

/**
 * Global function to update the hero tools count display
 */
function updateToolsCountDisplay(count) {
    const countEl = document.getElementById('tools-count');
    if (countEl) {
        countEl.textContent = count;
    }
}

/**
 * Global function to update the hero categories count display
 */
function updateCategoriesCountDisplay(count) {
    const countEl = document.getElementById('categories-count');
    if (countEl) {
        countEl.textContent = count;
    }
}

/**
 * Main application class to orchestrate all modules.
 */
class ToolsHubApp {
    constructor() {
        this.componentLoader = new ComponentLoader();
        this.dom = null;
        this.filterManager = null;
        this.animationManager = null;
        this.headerManager = null;
        this.paginationLoader = null;
    }

    async init() {
        try {
            // Load components first
            await Promise.all([
                this.componentLoader.load('../header.html', 'header-placeholder'),
                this.componentLoader.load('../footer.html', 'footer-placeholder')
            ]);
            
            // Initialize managers that depend on the DOM
            this.dom = new DOMElementManager();
            this.animationManager = new AnimationManager(this.dom);
            this.paginationLoader = new PaginationLoader(this.dom, this.animationManager);
            this.filterManager = new ToolsFilterManager(this.dom, this.paginationLoader);
            this.headerManager = new HeaderManager();
            
            // Set initial tools count to authoritative total (no DOM counting)
            const totalTools = window.__EVERYTOOL_TOTAL_TOOLS || 0;
            updateToolsCountDisplay(totalTools);
            
            // Set initial categories count
            const totalCategories = document.querySelectorAll('.filter-button[data-category]:not([data-category="all"])').length;
            updateCategoriesCountDisplay(totalCategories);
            
            // Last-resort microtask to ensure count stays correct after all initialization
            Promise.resolve().then(() => {
                const authoritativeTotal = window.__EVERYTOOL_TOTAL_TOOLS || 0;
                updateToolsCountDisplay(authoritativeTotal);
                console.log(`Last-resort count verification: ${authoritativeTotal}`);
            });
            
            // Start the managers
            this.animationManager.init();
            this.paginationLoader.init();
            this.filterManager.init();
            this.headerManager.init();
            
            // Set up retry logic
            this.dom.retryButton.addEventListener('click', () => {
                this.dom.errorOverlay.classList.add('hidden');
                this.init();
            });

            console.log('ToolsHub App successfully initialized.');
        } catch (error) {
            console.error('Application initialization failed:', error);
            this.showError(error.message);
        }
    }

    showError(message) {
        if(this.dom && this.dom.errorOverlay) {
            this.dom.errorMessage.textContent = `An error occurred: ${message}. Please check your connection or try again.`;
            this.dom.errorOverlay.classList.remove('hidden');
        } else {
            // Fallback if DOM manager failed
            const overlay = document.getElementById('error-overlay');
            const msg = document.getElementById('error-message');
            if(overlay) {
                if(msg) msg.textContent = message;
                overlay.classList.remove('hidden');
            }
        }
    }
}

// --- Application Entry Point ---
document.addEventListener('DOMContentLoaded', () => {
    const app = new ToolsHubApp();
    app.init();
});