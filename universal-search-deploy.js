// =====================================================================
// UNIVERSAL SEARCH DEPLOYMENT SCRIPT FOR ALL PAGES
// =====================================================================
// This script ensures that EVERY page in your website has working search functionality
// Including the Alt+S shortcut and the search button in the header

(function() {
    'use strict';
    
    // Browser compatibility check and polyfills
    function setupPolyfills() {
        // Promise polyfill for older browsers
        if (typeof Promise === 'undefined') {
            window.Promise = function(executor) {
                var self = this;
                self.state = 'pending';
                self.value = undefined;
                self.handlers = [];
                
                function resolve(result) {
                    if (self.state === 'pending') {
                        self.state = 'fulfilled';
                        self.value = result;
                        if (self.handlers) {
                            self.handlers.forEach(handle);
                            self.handlers = null;
                        }
                    }
                }
                
                function reject(error) {
                    if (self.state === 'pending') {
                        self.state = 'rejected';
                        self.value = error;
                        if (self.handlers) {
                            self.handlers.forEach(handle);
                            self.handlers = null;
                        }
                    }
                }
                
                function handle(handler) {
                    if (self.state === 'pending') {
                        self.handlers.push(handler);
                    } else {
                        if (self.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
                            handler.onFulfilled(self.value);
                        }
                        if (self.state === 'rejected' && typeof handler.onRejected === 'function') {
                            handler.onRejected(self.value);
                        }
                    }
                }
                
                this.then = function(onFulfilled, onRejected) {
                    return new Promise(function(resolve, reject) {
                        handle({
                            onFulfilled: function(result) {
                                try {
                                    resolve(onFulfilled ? onFulfilled(result) : result);
                                } catch (ex) {
                                    reject(ex);
                                }
                            },
                            onRejected: function(error) {
                                try {
                                    resolve(onRejected ? onRejected(error) : error);
                                } catch (ex) {
                                    reject(ex);
                                }
                            }
                        });
                    });
                };
                
                executor(resolve, reject);
            };
        }
        
        // forEach polyfill
        if (!Array.prototype.forEach) {
            Array.prototype.forEach = function(callback, thisArg) {
                var T, k;
                if (this == null) {
                    throw new TypeError('Array.prototype.forEach called on null or undefined');
                }
                var O = Object(this);
                var len = parseInt(O.length) || 0;
                if (typeof callback !== "function") {
                    throw new TypeError(callback + ' is not a function');
                }
                if (arguments.length > 1) {
                    T = thisArg;
                }
                k = 0;
                while (k < len) {
                    var kValue;
                    if (k in O) {
                        kValue = O[k];
                        callback.call(T, kValue, k, O);
                    }
                    k++;
                }
            };
        }
    }
    
    // Detect if CSP blocks eval/new Function (unsafe-eval)
    function isUnsafeEvalAllowed() {
        try {
            // new Function is commonly blocked by CSP when unsafe-eval is disallowed
            var fn = new Function('return true;');
            return !!fn();
        } catch (e) {
            return false;
        }
    }

    // Function to load scripts dynamically
    function loadScript(src) {
        return new Promise(function(resolve, reject) {
            // Check if script is already loaded
            var existingScript = document.querySelector('script[src="' + src + '"]');
            if (existingScript) {
                resolve(existingScript);
                return;
            }
            
            var script = document.createElement('script');
            script.src = src;
            script.onload = function() { resolve(script); };
            script.onerror = function() { reject(new Error('Script load error for ' + src)); };
            document.body.appendChild(script);
        });
    }
    
    // Function to ensure header is loaded with search functionality
    function ensureSearchFunctionality() {
        var headerPlaceholder = document.getElementById('header-placeholder');
        
        // If no header placeholder, create one
        if (!headerPlaceholder) {
            console.log('Creating header placeholder...');
            headerPlaceholder = document.createElement('div');
            headerPlaceholder.id = 'header-placeholder';
            headerPlaceholder.style.minHeight = '130px';
            headerPlaceholder.style.position = 'relative';
            headerPlaceholder.style.zIndex = '2000';
            
            // Insert at the beginning of body
            if (document.body.firstChild) {
                document.body.insertBefore(headerPlaceholder, document.body.firstChild);
            } else {
                document.body.appendChild(headerPlaceholder);
            }
        }
        
        // Check if header is already loaded
        if (headerPlaceholder.innerHTML.trim()) {
            console.log('Header already loaded, checking for search functionality...');
            ensureHeaderScriptsLoaded();
            return;
        }
        
        console.log('Loading header with search functionality...');
        
        // Load header HTML
        fetch('/header.html')
            .then(function(response) {
                if (!response.ok) throw new Error('Network response for header.html was not ok.');
                return response.text();
            })
            .then(function(html) {
                headerPlaceholder.innerHTML = html;
                console.log('Header HTML loaded successfully');
                return ensureHeaderScriptsLoaded();
            })
            .catch(function(error) {
                console.error('Error loading header:', error);
                // Try alternative paths
                return fetch('./header.html')
                    .then(function(response) {
                        if (!response.ok) throw new Error('Alternative header path failed');
                        return response.text();
                    })
                    .then(function(html) {
                        headerPlaceholder.innerHTML = html;
                        return ensureHeaderScriptsLoaded();
                    })
                    .catch(function(altError) {
                        console.error('All header loading attempts failed:', altError);
                    });
            });
    }
    
    // Function to ensure all required scripts are loaded
    function ensureHeaderScriptsLoaded() {
        console.log('Ensuring header scripts are loaded...');
        
        var evalAllowed = isUnsafeEvalAllowed();
        var promise = Promise.resolve();
        if (evalAllowed) {
            promise = promise.then(function () {
                return loadScript('https://cdn.jsdelivr.net/npm/fuse.js@6.6.2')
                    .then(function() {
                        console.log('Fuse.js loaded successfully');
                    })
                    .catch(function (err) {
                        console.warn('Failed to load Fuse.js, will use fallback search.', err);
                    });
            });
        } else {
            console.warn('CSP blocks unsafe-eval; skipping Fuse.js and using fallback search.');
        }

        return promise
            .then(function() {
                return loadScript('/header-search.js');
            })
            .then(function() {
                console.log('header-search.js loaded successfully');
                // Wait a moment for scripts to initialize
                return new Promise(function(resolve) {
                    setTimeout(resolve, 100);
                });
            })
            .then(function() {
                if (typeof initializeHeader === 'function') {
                    console.log('Initializing header functionality...');
                    initializeHeader();
                    console.log('Search functionality initialized successfully!');
                } else {
                    console.error('initializeHeader function not found after loading scripts');
                    // Try to load from alternative path
                    return loadScript('./header-search.js')
                        .then(function() {
                            if (typeof initializeHeader === 'function') {
                                initializeHeader();
                                console.log('Search functionality initialized from alternative path!');
                            }
                        });
                }
            })
            .catch(function(error) {
                console.error('Error loading header scripts:', error);
            });
    }
    
    // Function to add emergency Alt+S listener if header scripts fail
    function addEmergencySearchListener() {
        var emergencyListener = function(e) {
            if (e.altKey && (e.key === 's' || e.key === 'S' || e.keyCode === 83)) {
                e.preventDefault();
                var popup = document.getElementById('searchPopup');
                if (popup) {
                    if (popup.classList) {
                        popup.classList.add('is-open');
                        document.body.classList.add('search-popup-open');
                    } else {
                        popup.className += ' is-open';
                        document.body.className += ' search-popup-open';
                    }
                    popup.setAttribute('aria-hidden', 'false');
                    var input = document.getElementById('searchPopupInput');
                    if (input) input.focus();
                } else {
                    console.log('Alt+S pressed but search popup not found. Attempting to reload header...');
                    ensureSearchFunctionality();
                }
            }
        };
        
        // Remove existing listener to avoid duplicates
        window.removeEventListener('keydown', emergencyListener);
        window.addEventListener('keydown', emergencyListener);
        console.log('Emergency Alt+S listener activated');
    }
    
    // Main initialization function
    function initializeUniversalSearch() {
        console.log('Initializing universal search functionality...');
        
        setupPolyfills();
        
        // Add emergency listener immediately
        addEmergencySearchListener();
        
        // Ensure search functionality is loaded
        ensureSearchFunctionality();
        
        // Add footer if footer placeholder exists but is empty
        var footerPlaceholder = document.getElementById('footer-placeholder');
        if (footerPlaceholder && !footerPlaceholder.innerHTML.trim()) {
            fetch('/footer.html')
                .then(function(response) {
                    return response.ok ? response.text() : Promise.reject('Failed to load footer');
                })
                .then(function(html) {
                    footerPlaceholder.innerHTML = html;
                })
                .catch(function(error) {
                    console.error('Error loading footer:', error);
                });
        }
        
        console.log('Universal search initialization complete!');
    }
    
    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeUniversalSearch);
    } else {
        // DOM is already loaded
        initializeUniversalSearch();
    }
    
})();

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeUniversalSearch: initializeUniversalSearch };
}
