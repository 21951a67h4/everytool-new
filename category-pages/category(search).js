// Search functionality with advanced features and error handling
class ToolSearch {
    constructor() {
        this.searchInput = document.querySelector('.search-input');
        this.toolCards = document.querySelectorAll('.tool-card');
        this.searchTimeout = null;
        this.DEBOUNCE_DELAY = 300; // ms
        
        this.init();
    }

    init() {
        try {
            if (!this.searchInput || !this.toolCards.length) {
                throw new Error('Required DOM elements not found');
            }

            // Initialize search event listeners
            this.setupEventListeners();
            
            // Create no results message element
            this.createNoResultsElement();
            
        } catch (error) {
            console.error('Search initialization failed:', error);
            this.displayErrorMessage('Search functionality is currently unavailable');
        }
    }

    setupEventListeners() {
        // Main search input handler with debouncing
        this.searchInput.addEventListener('input', () => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.performSearch();
            }, this.DEBOUNCE_DELAY);
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSearch();
            }
        });
    }

    createNoResultsElement() {
        this.noResultsElement = document.createElement('div');
        this.noResultsElement.className = 'no-results-message';
        this.noResultsElement.style.display = 'none';
        this.noResultsElement.textContent = 'No tools found matching your search';
        this.searchInput.parentNode.appendChild(this.noResultsElement);
    }

    sanitizeInput(input) {
        return input.replace(/[<>]/g, '').trim();
    }

    performSearch() {
        try {
            const searchTerm = this.sanitizeInput(this.searchInput.value.toLowerCase());
            let matchFound = false;
            
            // Track search analytics
            this.trackSearchAnalytics(searchTerm);

            this.toolCards.forEach(card => {
                try {
                    const toolName = card.querySelector('.tool-name')?.textContent?.toLowerCase() || '';
                    const toolDescription = card.querySelector('.tool-description')?.textContent?.toLowerCase() || '';
                    
                    const matchesSearch = toolName.includes(searchTerm) || 
                                        toolDescription.includes(searchTerm);
                    
                    card.style.display = matchesSearch ? 'flex' : 'none';
                    
                    if (matchesSearch) {
                        matchFound = true;
                        this.highlightMatches(card, searchTerm);
                    } else {
                        this.removeHighlights(card);
                    }
                } catch (cardError) {
                    console.warn('Error processing card:', cardError);
                    card.style.display = 'none';
                }
            });

            this.noResultsElement.style.display = matchFound ? 'none' : 'block';
            
        } catch (error) {
            console.error('Search operation failed:', error);
            this.displayErrorMessage('An error occurred while searching');
        }
    }

    highlightMatches(card, searchTerm) {
        const elements = [
            card.querySelector('.tool-name'),
            card.querySelector('.tool-description')
        ];

        elements.forEach(element => {
            if (!element) return;
            
            const text = element.textContent;
            const highlightedText = text.replace(
                new RegExp(searchTerm, 'gi'),
                match => `<mark class="search-highlight">${match}</mark>`
            );
            element.innerHTML = highlightedText;
        });
    }

    removeHighlights(card) {
        const elements = [
            card.querySelector('.tool-name'),
            card.querySelector('.tool-description')
        ];

        elements.forEach(element => {
            if (!element) return;
            
            const text = element.textContent;
            element.innerHTML = text;
        });
    }

    clearSearch() {
        this.searchInput.value = '';
        this.performSearch();
        this.searchInput.focus();
    }

    displayErrorMessage(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'search-error';
        errorElement.textContent = message;
        this.searchInput.parentNode.insertBefore(errorElement, this.searchInput.nextSibling);
        
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }

    trackSearchAnalytics(searchTerm) {
        // Only track if search term is meaningful
        if (searchTerm.length > 2) {
            try {
                // Simple localStorage-based analytics
                const searches = JSON.parse(localStorage.getItem('searchAnalytics') || '[]');
                searches.push({
                    term: searchTerm,
                    timestamp: new Date().toISOString()
                });
                localStorage.setItem('searchAnalytics', JSON.stringify(searches.slice(-100)));
            } catch (error) {
                console.warn('Analytics tracking failed:', error);
            }
        }
    }
}

// Initialize search functionality
document.addEventListener('DOMContentLoaded', () => {
    try {
        new ToolSearch();
    } catch (error) {
        console.error('Failed to initialize search:', error);
    }
});

// Add necessary styles
const searchStyles = document.createElement('style');
searchStyles.textContent = `
    .search-highlight {
        color: #ffffff;
        background-color: #4361EE;
        padding: 0 2px;
        border-radius: 2px;
    }
    .search-error {
        color: #dc3545;
        margin-top: 8px;
        padding: 8px;
        border-radius: 4px;
        background-color: #f8d7da;
    }
    .no-results-message {
        text-align: center;
        padding: 20px;
        color: #666;
        font-style: italic;
    }
`;
document.head.appendChild(searchStyles);
