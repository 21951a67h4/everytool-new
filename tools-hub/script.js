/**
 * ToolsHub Application Script
 * 
 * This script orchestrates the entire functionality of the ToolsHub page,
 * including component loading, dynamic filtering, animations, and voice search.
 */

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
        this.toolCards = document.querySelectorAll('.tool-card');
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
    constructor(domElements) {
        this.dom = domElements;
        this.activeCategory = 'all';
        this.debounceTimeout = null;
        this.originalButtonTexts = new Map(); // To store original button text
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
        
        // Handle initial page load state
        this.filterFromURL();
        console.log('ToolsFilterManager initialized.');
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

        // Calculate and append the count to the newly active button
        const category = this.activeCategory;
        const count = (category === 'all')
            ? this.dom.toolCards.length
            : document.querySelectorAll(`.tool-card[data-category="${category}"]`).length;
        
        const originalText = this.originalButtonTexts.get(buttonToActivate);
        buttonToActivate.textContent = `${originalText} (${count})`;

        // Perform the filtering
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
        
        this.dom.toolCards.forEach(card => {
            const name = card.querySelector('.tool-name').textContent.toLowerCase();
            const description = card.querySelector('.tool-description').textContent.toLowerCase();
            const category = card.dataset.category;

            const matchesSearch = name.includes(searchTerm) || description.includes(searchTerm);
            const matchesCategory = this.activeCategory === 'all' || this.activeCategory === category;

            if (matchesSearch && matchesCategory) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
        console.log(`Filtered tools for: [Category: ${this.activeCategory}, Search: "${searchTerm}"]`);
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
            this.dom.toolCards.forEach(card => card.classList.add('visible'));
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

        this.dom.toolCards.forEach(card => this.observer.observe(card));
        console.log('AnimationManager initialized with IntersectionObserver.');
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
 * Main application class to orchestrate all modules.
 */
class ToolsHubApp {
    constructor() {
        this.componentLoader = new ComponentLoader();
        this.dom = null;
        this.filterManager = null;
        this.animationManager = null;
        this.headerManager = null;
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
            this.filterManager = new ToolsFilterManager(this.dom);
            this.animationManager = new AnimationManager(this.dom);
            this.headerManager = new HeaderManager();
            
            // Start the managers
            this.filterManager.init();
            this.animationManager.init();
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