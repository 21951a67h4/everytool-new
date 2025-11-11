function animateNumbers() {
    const numbers = document.querySelectorAll('.trust__number');
    const animatedNumbers = new Set();

    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animatedNumbers.has(entry.target)) {
                const number = entry.target;
                animatedNumbers.add(number);

                const target = parseFloat(number.dataset.target);
                const suffix = number.dataset.suffix || '';
                const duration = 2000;
                const steps = 60;
                const stepDuration = duration / steps;

                let current = 0;
                const increment = target / steps;
                const isDecimal = target % 1 !== 0;
                const decimals = isDecimal ? 1 : 0;

                const updateNumber = () => {
                    current += increment;
                    if (current <= target) {
                        number.textContent = current.toLocaleString('en-US', {
                            minimumFractionDigits: decimals,
                            maximumFractionDigits: decimals
                        }) + suffix;

                        number.classList.add('animate');

                        requestAnimationFrame(() => {
                            setTimeout(updateNumber, stepDuration);
                        });
                    } else {
                        number.textContent = target.toLocaleString('en-US', {
                            minimumFractionDigits: decimals,
                            maximumFractionDigits: decimals
                        }) + suffix;

                        setTimeout(() => {
                            number.classList.remove('animate');
                        }, 300);
                    }
                };

                updateNumber();
                observer.unobserve(number);
            }
        });
    }, options);

    numbers.forEach(number => {
        observer.observe(number);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Always run trust section animation
    animateNumbers();

    // Header interactivity handled in header-search.js after header loads

    // Intersection Observer for animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements if they exist
    const categoryCards = document.querySelectorAll('.category-card');
    if (categoryCards.length > 0) {
        categoryCards.forEach(card => observer.observe(card));
    }

    const popularToolCards = document.querySelectorAll('.popular-tool-card');
    if (popularToolCards.length > 0) {
        popularToolCards.forEach(card => observer.observe(card));
    }

    const testimonialCards = document.querySelectorAll('.testimonial-card');
    if (testimonialCards.length > 0) {
        testimonialCards.forEach(card => observer.observe(card));
    }

    // Search functionality
    const searchForm = document.querySelector('.hero__search');
    if (searchForm) {
        const searchInput = searchForm.querySelector('input[type="text"]');
        const searchButton = searchForm.querySelector('button[type="submit"]');
        const clearButton = searchForm.querySelector('.clear-button');
        const searchResults = searchForm.querySelector('.search-results');
        const searchResultsContent = searchForm.querySelector('.search-results-content');
        const searchError = searchForm.querySelector('.search-error');
        const popularTags = document.querySelectorAll('.hero__popular-tag');

        let searchTimeout;
        let isSearching = false;

        // Show/hide clear button based on input
        searchInput.addEventListener('input', () => {
            clearButton.classList.toggle('visible', searchInput.value.length > 0);
            ErrorHandler.clearError('search');
        });

        // Clear search
        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            clearButton.classList.remove('visible');
            searchInput.focus();
            hideResults();
            ErrorHandler.clearError('search');
        });

        // Handle search submission
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await performSearch();
        });

        // Handle popular tag clicks
        popularTags.forEach(tag => {
            tag.addEventListener('click', () => {
                searchInput.value = tag.textContent;
                clearButton.classList.add('visible');
                performSearch();
            });
        });

        // Debounced search on input
        const debouncedSearch = debounce(async () => {
            if (searchInput.value.length >= 2) {
                await performSearch();
            } else {
                hideResults();
            }
        }, 300);

        searchInput.addEventListener('input', debouncedSearch);

        // Close results when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchForm.contains(e.target)) {
                hideResults();
            }
        });

        // Handle keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideResults();
            }
        });

        // Tools index loaded from single source of truth (search-index.json)
        let toolsIndex = [];
        (async function preloadSearchIndex(){
            try {
                const res = await fetch('/search-index.json', { cache: 'no-store' });
                if (res && res.ok) {
                    const data = await res.json();
                    // Normalize into minimal shape used below
                    toolsIndex = Array.isArray(data) ? data.map(p => ({
                        title: p.title || '',
                        description: (p.content || '').slice(0, 180),
                        icon: 'tools',
                        url: p.url || p.href || '#'
                    })) : [];
                }
            } catch (e) {
                // Silent fallback; search will just show no results
                console.warn('Failed to load search-index.json, using empty index');
                toolsIndex = [];
            }
        })();

        // Error Handler
        const ErrorHandler = {
            showError: function(type, message) {
                const errorElement = document.querySelector(`.${type}-error`);
                if (errorElement) {
                    errorElement.textContent = message;
                    errorElement.style.display = 'block';
                }
            },
            clearError: function(type) {
                const errorElement = document.querySelector(`.${type}-error`);
                if (errorElement) {
                    errorElement.textContent = '';
                    errorElement.style.display = 'none';
                }
            }
        };

        // Debounce function
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

        // Update performSearch to redirect if found, else show error
        async function performSearch() {
            if (isSearching) return;
            
            const searchTerm = searchInput.value.trim().toLowerCase();
            if (searchTerm.length < 2) {
                hideResults();
                return;
            }

            showLoading();
            isSearching = true;

            try {
                // Filter tools based on search term
                const results = toolsIndex.filter(tool => 
                    tool.title.toLowerCase().includes(searchTerm) || 
                    tool.description.toLowerCase().includes(searchTerm)
                );

                if (results.length === 0) {
                    searchResultsContent.innerHTML = `
                        <div class="search-dropdown-item no-results">
                            <i class="fas fa-search"></i>
                            <div class="search-dropdown-item-content">
                                <div class="search-dropdown-item-title">No results found</div>
                                <div class="search-dropdown-item-description">Try different keywords or browse categories</div>
                            </div>
                        </div>
                    `;
                } else {
                    displayResults(results);
                }

                searchResults.style.display = 'block';
            } catch (error) {
                ErrorHandler.showError('search', 'An error occurred while searching. Please try again.');
                hideResults();
            } finally {
                hideLoading();
                isSearching = false;
            }
        }

        function displayResults(results) {
            searchResultsContent.innerHTML = ''; // Clear existing content

            if (results.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                
                const icon = document.createElement('i');
                icon.className = 'fas fa-search';
                icon.style.fontSize = '2rem';
                icon.style.color = '#cbd5e1';
                icon.style.marginBottom = '1rem';
                
                const message = document.createElement('p');
                message.textContent = 'No tools found matching your search.';
                
                const suggestion = document.createElement('p');
                suggestion.textContent = 'Try different keywords or browse our categories below.';
                suggestion.style.fontSize = '0.9rem';
                suggestion.style.color = '#94a3b8';
                suggestion.style.marginTop = '0.5rem';
                
                noResults.appendChild(icon);
                noResults.appendChild(message);
                noResults.appendChild(suggestion);
                searchResultsContent.appendChild(noResults);
            } else {
                results.forEach(result => {
                    const resultItem = document.createElement('div');
                    resultItem.className = 'search-result-item';
                    
                    const title = document.createElement('h3');
                    const icon = document.createElement('i');
                    icon.className = `fas fa-${result.icon || 'tools'}`;
                    icon.style.marginRight = '0.5rem';
                    icon.style.color = '#3b7bbc';
                    
                    title.appendChild(icon);
                    title.appendChild(document.createTextNode(result.title));
                    
                    const description = document.createElement('p');
                    description.textContent = result.description;
                    
                    resultItem.appendChild(title);
                    resultItem.appendChild(description);
                    searchResultsContent.appendChild(resultItem);
                });
            }

            // Announce results for screen readers
            const resultCount = results.length;
            const message = resultCount === 0 
                ? 'No results found' 
                : `Found ${resultCount} result${resultCount === 1 ? '' : 's'}`;
            
            // Create and update aria-live region
            let announcer = document.getElementById('search-announcer');
            if (!announcer) {
                announcer = document.createElement('div');
                announcer.id = 'search-announcer';
                announcer.setAttribute('aria-live', 'polite');
                announcer.className = 'sr-only';
                document.body.appendChild(announcer);
            }
            announcer.textContent = message;
        }

        function showLoading() {
            searchButton.classList.add('loading');
            searchButton.disabled = true;
            searchButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Searching...</span>';
        }

        function hideLoading() {
            searchButton.classList.remove('loading');
            searchButton.disabled = false;
            searchButton.innerHTML = '<i class="fas fa-search"></i><span>Search</span>';
        }

        function hideResults() {
            searchResults.classList.remove('visible');
            searchResults.hidden = true;
            searchInput.setAttribute('aria-expanded', 'false');
        }

        // Voice search functionality
        const micButton = searchForm.querySelector('.hero__search-mic');
        const micTooltip = micButton.querySelector('.hero__search-mic-tooltip');
        let recognition = null;

        // Initialize speech recognition
        function initSpeechRecognition() {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                micButton.style.display = 'none';
                return;
            }

            recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                micButton.classList.add('listening');
                micTooltip.textContent = 'Listening...';
                micTooltip.style.background = '#dc2626';
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                searchInput.value = transcript;
                clearButton.classList.add('visible');
                performSearch();
            };

            recognition.onerror = (event) => {
                handleSpeechError(event.error);
            };

            recognition.onend = () => {
                micButton.classList.remove('listening');
                micTooltip.textContent = 'Click to search by voice';
                micTooltip.style.background = '#333';
            };
        }

        function handleSpeechError(error) {
            let errorMessage = 'Sorry, there was an error with voice recognition.';
            
            switch (error) {
                case 'not-allowed':
                case 'permission-denied':
                    errorMessage = 'Please allow microphone access to use voice search.';
                    break;
                case 'no-speech':
                    errorMessage = 'No speech was detected. Please try again.';
                    break;
                case 'audio-capture':
                    errorMessage = 'No microphone was found. Please check your device.';
                    break;
                case 'network':
                    errorMessage = 'Network error occurred. Please check your connection.';
                    break;
            }

            ErrorHandler.addError('speech', errorMessage);
            micButton.classList.remove('listening');
            micTooltip.textContent = 'Click to search by voice';
            micTooltip.style.background = '#333';
        }

        micButton.addEventListener('click', () => {
            if (!recognition) {
                initSpeechRecognition();
            }

            if (micButton.classList.contains('listening')) {
                recognition.stop();
            } else {
                try {
                    recognition.start();
                } catch (error) {
                    handleSpeechError(error);
                }
            }
        });

        // Initialize speech recognition on page load
        initSpeechRecognition();
    }
});

// ===== CASCADE BLOG SECTION (CSS-DRIVEN ANIMATIONS) =====
// The new Cascade blog section features floating particles, decorative corners,
// and magnetic hover effects - all powered by pure CSS animations! ✨

// Legacy scroller functionality (for other scrollers on the page)
const scroller = document.querySelector('.scroller-track');
if (scroller) {
    let isDown = false;
    let startX;
    let scrollLeft;

    scroller.addEventListener('mousedown', (e) => {
        isDown = true;
        scroller.classList.add('active');
        startX = e.pageX - scroller.offsetLeft;
        scrollLeft = scroller.scrollLeft;
    });

    scroller.addEventListener('mouseleave', () => {
        isDown = false;
        scroller.classList.remove('active');
    });

    scroller.addEventListener('mouseup', () => {
        isDown = false;
        scroller.classList.remove('active');
    });

    scroller.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - scroller.offsetLeft;
        const walk = (x - startX) * 2; // speed
        scroller.scrollLeft = scrollLeft - walk;
    });

    // Touch support
    scroller.addEventListener('touchstart', (e) => {
        isDown = true;
        startX = e.touches[0].pageX - scroller.offsetLeft;
        scrollLeft = scroller.scrollLeft;
    });

    scroller.addEventListener('touchend', () => {
        isDown = false;
    });

    scroller.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        const x = e.touches[0].pageX - scroller.offsetLeft;
        const walk = (x - startX) * 2;
        scroller.scrollLeft = scrollLeft - walk;
    });
}

// Header/footer loading moved to app-loader.js

