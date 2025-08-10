var fuse;
var searchData = [];
var isSearchInitialized = false;

// Compatible debounce function for all browsers
function debounce(func, wait) {
    var timeout;
    return function executedFunction() {
        var context = this;
        var args = Array.prototype.slice.call(arguments);
        var later = function() {
            clearTimeout(timeout);
            func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Simple error handler for better browser compatibility
function ErrorHandler() {
    this.errors = [];
    this.logError = function(error, context) {
        context = context || {};
        var errorId = Date.now();
        var errorInfo = {
            id: errorId,
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString()
        };
        this.errors.push(errorInfo);
        console.error('[Header Script] Error ' + errorId + ':', error, context);
        return errorId;
    };
}
var errorHandler = new ErrorHandler();

// --- END: Global State & Utilities ---


// --- START: Search Data Handling ---

/**
 * Fetches the search index from `/search-index.json` and initializes 
 * the Fuse.js search instance.
 */
function initUniversalSearch() {
    return new Promise(function(resolve, reject) {
        try {
            // ====== START: THIS IS THE CORRECTED CODE ======
            // Construct the absolute path to the search index file.
            // This is robust and works from any page on the site.
            var searchIndexPath = window.location.origin + '/search-index.json';
            
            // Check if fetch is supported, fallback to XMLHttpRequest
            if (window.fetch) {
                fetch(searchIndexPath)
                    .then(function(response) {
                        if (!response.ok) {
                            throw new Error('Failed to fetch search-index.json: ' + response.statusText);
                        }
                        return response.json();
                    })
                    .then(function(allPages) {
                        setupSearchEngine(allPages);
                        resolve();
                    })
                    .catch(function(error) {
                        errorHandler.logError(error, { context: 'initUniversalSearch - fetch' });
                        reject(error);
                    });
            } else {
                // Fallback for older browsers
                var xhr = new XMLHttpRequest();
                xhr.open('GET', searchIndexPath);
                xhr.onload = function() {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            var allPages = JSON.parse(xhr.responseText);
                            setupSearchEngine(allPages);
                            resolve();
                        } catch (parseError) {
                            errorHandler.logError(parseError, { context: 'initUniversalSearch - parse' });
                            reject(parseError);
                        }
                    } else {
                        var error = new Error('Network response was not ok');
                        errorHandler.logError(error, { context: 'initUniversalSearch - xhr' });
                        reject(error);
                    }
                };
                xhr.onerror = function() {
                    var error = new Error('Network error');
                    errorHandler.logError(error, { context: 'initUniversalSearch - network' });
                    reject(error);
                };
                xhr.send();
            }
            // ====== END: THIS IS THE CORRECTED CODE ======
        } catch (error) {
            errorHandler.logError(error, { context: 'initUniversalSearch - general' });
            reject(error);
        }
    });
}

function setupSearchEngine(allPages) {
    searchData = allPages;
    
    var options = {
        keys: [
            { name: 'title', weight: 0.7 },
            { name: 'content', weight: 0.3 }
        ],
        includeScore: true,
        threshold: 0.4,
        minMatchCharLength: 2
    };

    if (typeof Fuse === 'undefined') {
        throw new Error('Fuse.js is not loaded. Please ensure the CDN script tag is in your HTML.');
    }

    fuse = new Fuse(searchData, options);
    isSearchInitialized = true;
    console.log('Universal search initialized successfully.');
}

/**
 * Performs a search against the initialized search index.
 * @param {string} query The user's search query.
 * @returns {Array} An array of search results.
 */
function performSearch(query) {
    if (!fuse) {
        console.warn('Search is not initialized yet.');
        return [];
    }
    return fuse.search(query);
}

// --- END: Search Data Handling ---


// --- START: Header UI Initialization ---

/**
 * Initializes all interactive parts of the header.
 * This function is called once the header HTML is in the DOM.
 */
function initializeHeader() {

    // --- 1. Basic Header Interactivity (Mobile Menu, Scroll, Active Link) ---
    try {
        var headerElement = document.querySelector('.header.glassy-header');
        if (!headerElement) throw new Error("Header element '.header.glassy-header' not found.");

        var mobileMenuButton = headerElement.querySelector('.header__mobile-menu');
        var navList = headerElement.querySelector('.header__nav-list');
        
        if (!mobileMenuButton || !navList) throw new Error("Mobile menu button or nav list not found.");

        var isMenuOpen = false;

        function toggleMenu(shouldOpen) {
            isMenuOpen = typeof shouldOpen === 'boolean' ? shouldOpen : !isMenuOpen;
            if (navList.classList.toggle) {
                navList.classList.toggle('active', isMenuOpen);
                mobileMenuButton.classList.toggle('open', isMenuOpen);
                document.body.classList.toggle('menu-open', isMenuOpen);
            } else {
                // Fallback for older browsers
                if (isMenuOpen) {
                    navList.className += ' active';
                    mobileMenuButton.className += ' open';
                    document.body.className += ' menu-open';
                } else {
                    navList.className = navList.className.replace(' active', '');
                    mobileMenuButton.className = mobileMenuButton.className.replace(' open', '');
                    document.body.className = document.body.className.replace(' menu-open', '');
                }
            }
            mobileMenuButton.setAttribute('aria-expanded', String(isMenuOpen));
        }

        mobileMenuButton.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMenu();
        });

        document.addEventListener('click', function(e) {
            if (isMenuOpen && !navList.contains(e.target) && !mobileMenuButton.contains(e.target)) {
                toggleMenu(false);
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && isMenuOpen) {
                toggleMenu(false);
            }
        });

        window.addEventListener('resize', debounce(function() {
            if (window.innerWidth > 768 && isMenuOpen) {
                toggleMenu(false);
            }
        }, 250));

        window.addEventListener('scroll', debounce(function() {
            if (headerElement.classList.toggle) {
                headerElement.classList.toggle('scrolled', window.scrollY > 50);
            } else {
                // Fallback for older browsers
                if (window.scrollY > 50) {
                    headerElement.className += ' scrolled';
                } else {
                    headerElement.className = headerElement.className.replace(' scrolled', '');
                }
            }
        }, 10));

        var navLinks = navList.querySelectorAll('.header__nav-link');
        var currentPath = window.location.pathname;
        var bestMatchLink = null;
        var longestMatchLength = -1;

        // Use regular for loop for better browser compatibility
        for (var i = 0; i < navLinks.length; i++) {
            var link = navLinks[i];
            link.removeAttribute('aria-current');
            var linkPath = new URL(link.href, window.location.origin).pathname;
            var normalizedCurrentPath = currentPath === '/' ? '/' : currentPath.replace(/\/$/, "");
            var normalizedLinkPath = linkPath === '/' ? '/' : linkPath.replace(/\/$/, "");

            if (normalizedCurrentPath.indexOf(normalizedLinkPath) === 0 && normalizedLinkPath.length > longestMatchLength) {
                longestMatchLength = normalizedLinkPath.length;
                bestMatchLink = link;
            }
        }

        if (bestMatchLink) {
            bestMatchLink.setAttribute('aria-current', 'page');
            bestMatchLink.classList.add('active');
        }
    } catch (error) {
        errorHandler.logError(error, { context: 'Header Interactivity Setup' });
    }

    // --- 2. Search Popup Functionality ---
    try {
        var searchTrigger = document.querySelector('.header__search-btn');
        var popup = document.getElementById('searchPopup');
        var closeBtn = document.getElementById('searchPopupClose');
        var input = document.getElementById('searchPopupInput');
        var clearBtn = document.getElementById('searchPopupClearBtn');
        var resultsList = document.getElementById('searchPopupResultsList');
        var feedback = document.getElementById('searchPopupFeedback');

        if (!searchTrigger || !popup || !closeBtn || !input || !clearBtn || !resultsList || !feedback) {
            throw new Error("One or more search popup elements are missing from the DOM.");
        }

        function openPopup() {
            if (popup.classList) {
                popup.classList.add('is-open');
                document.body.classList.add('search-popup-open');
            } else {
                // Fallback for older browsers
                popup.className += ' is-open';
                document.body.className += ' search-popup-open';
            }
            popup.setAttribute('aria-hidden', 'false');
            input.focus();

            if (isSearchInitialized) return;

            feedback.textContent = 'Initializing search...';
            initUniversalSearch().then(function() {
                feedback.textContent = 'Ready to search.';
            }).catch(function(error) {
                feedback.textContent = 'Error: Could not load search.';
            });
        }

        function closePopup() {
            if (popup.classList) {
                popup.classList.remove('is-open');
                document.body.classList.remove('search-popup-open');
            } else {
                // Fallback for older browsers
                popup.className = popup.className.replace(' is-open', '');
                document.body.className = document.body.className.replace(' search-popup-open', '');
            }
            popup.setAttribute('aria-hidden', 'true');
            input.value = '';
            resultsList.innerHTML = '';
            feedback.textContent = '';
        }

        function renderResults(results) {
            resultsList.innerHTML = '';
            if (results.length === 0) {
                feedback.textContent = 'No results found.';
                return;
            }

            feedback.textContent = '';
            var fragment = document.createDocumentFragment();
            var maxResults = Math.min(results.length, 10);
            
            for (var i = 0; i < maxResults; i++) {
                var result = results[i];
                var li = document.createElement('li');
                li.className = 'search-popup__result-item';
                var a = document.createElement('a');
                a.href = result.item.url;
                a.textContent = result.item.title;
                
                // Use closure to preserve the href value
                (function(href) {
                    a.addEventListener('click', function(e) {
                        e.preventDefault();
                        window.location.href = href;
                        closePopup();
                    });
                })(result.item.url);
                
                li.appendChild(a);
                fragment.appendChild(li);
            }
            resultsList.appendChild(fragment);
        }

        function handleSearch(query) {
            if (!isSearchInitialized) {
                feedback.textContent = 'Search is not ready yet.';
                return;
            }
            if (query.length >= 2) {
                var results = performSearch(query);
                renderResults(results);
            } else {
                resultsList.innerHTML = '';
                feedback.textContent = query.length > 0 ? 'Keep typing...' : 'Ready to search.';
            }
        }
        
        var debouncedSearch = debounce(handleSearch, 300);

        searchTrigger.addEventListener('click', openPopup);
        closeBtn.addEventListener('click', closePopup);
        
        input.addEventListener('input', function(e) {
            var query = e.target.value;
            if (clearBtn.classList) {
                clearBtn.classList.toggle('visible', query.length > 0);
            } else {
                // Fallback for older browsers
                if (query.length > 0) {
                    clearBtn.className += ' visible';
                } else {
                    clearBtn.className = clearBtn.className.replace(' visible', '');
                }
            }
            debouncedSearch(query.replace(/^\s+|\s+$/g, '')); // trim fallback
        });

        clearBtn.addEventListener('click', function() {
            input.value = '';
            if (input.dispatchEvent) {
                input.dispatchEvent(new Event('input'));
            } else {
                // Fallback for older browsers
                var evt = document.createEvent('Event');
                evt.initEvent('input', true, true);
                input.dispatchEvent(evt);
            }
            input.focus();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' || e.keyCode === 27) {
                var isOpen = popup.classList ? popup.classList.contains('is-open') : popup.className.indexOf('is-open') !== -1;
                if (isOpen) {
                    closePopup();
                }
            }
        });
        
        popup.addEventListener('click', function(e) {
            if (e.target === popup) closePopup();
        });

        // THE CRUCIAL ALT+S SHORTCUT!
        window.addEventListener('keydown', function(e) {
            if (e.altKey && (e.key === 's' || e.key === 'S' || e.keyCode === 83)) {
                e.preventDefault();
                var activeEl = document.activeElement;
                var isPopupOpen = popup.classList ? popup.classList.contains('is-open') : popup.className.indexOf('is-open') !== -1;
                
                if (isPopupOpen || (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA'))) {
                    return;
                }
                openPopup();
            }
        });
    } catch (error) {
        errorHandler.logError(error, { context: 'Search Popup Setup' });
    }
}

// --- END: Header UI Initialization ---