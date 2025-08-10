'use strict';

/**
 * Advanced Device View Manager
 * Handles responsive design, device detection, and viewport management
 */
class DeviceViewManager {
    static #instance = null;
    #observers = new Set();
    #deviceInfo = {
        type: null,
        orientation: null,
        pixelRatio: window.devicePixelRatio || 1,
        touch: false,
        retina: false,
        reducedMotion: false
    };
    #breakpoints = {
        mobile: 480,
        tablet: 768,
        desktop: 1024,
        large: 1440
    };
    #debounceTimer = null;
    #errorHandler = null;
    #performanceMetrics = new Map();

    constructor() {
        if (DeviceViewManager.#instance) {
            return DeviceViewManager.#instance;
        }
        DeviceViewManager.#instance = this;
        this.#initializeErrorHandler();
        this.#initializeDeviceInfo();
        this.#setupEventListeners();
        this.#setupPerformanceMonitoring();
    }

    #initializeErrorHandler() {
        this.#errorHandler = {
            errors: new Map(),
            logError: (error, context = {}) => {
                const errorId = Date.now();
                this.#errorHandler.errors.set(errorId, {
                    message: error.message,
                    stack: error.stack,
                    context,
                    timestamp: new Date().toISOString()
                });
                console.error(`[DeviceViewManager] Error ${errorId}:`, error);
                return errorId;
            },
            getError: (errorId) => this.#errorHandler.errors.get(errorId),
            clearErrors: () => this.#errorHandler.errors.clear()
        };
    }

    #initializeDeviceInfo() {
        try {
            this.#deviceInfo.touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            this.#deviceInfo.retina = this.#deviceInfo.pixelRatio > 1;
            this.#deviceInfo.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            this.#updateDeviceType();
            this.#updateOrientation();
            this.#updateCSSVariables();
        } catch (error) {
            this.#errorHandler.logError(error, { context: 'initializeDeviceInfo' });
        }
    }

    #setupEventListeners() {
        try {
            const debouncedResize = this.#debounce(() => {
                this.#updateDeviceType();
                this.#updateCSSVariables();
                this.#notifyObservers();
            }, 250);

            const debouncedOrientation = this.#debounce(() => {
                this.#updateOrientation();
                this.#updateCSSVariables();
                this.#notifyObservers();
            }, 250);

            window.addEventListener('resize', debouncedResize);
            window.addEventListener('orientationchange', debouncedOrientation);

            // Listen for reduced motion preference changes
            window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
                this.#deviceInfo.reducedMotion = e.matches;
                this.#updateCSSVariables();
                this.#notifyObservers();
            });
        } catch (error) {
            this.#errorHandler.logError(error, { context: 'setupEventListeners' });
        }
    }

    #setupPerformanceMonitoring() {
        try {
            if ('PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.#performanceMetrics.set(entry.name, {
                            value: entry.duration,
                            timestamp: Date.now()
                        });
                    }
                });

                observer.observe({ entryTypes: ['measure'] });
            }
        } catch (error) {
            this.#errorHandler.logError(error, { context: 'setupPerformanceMonitoring' });
        }
    }

    #updateDeviceType() {
        try {
            const width = window.innerWidth;
            let newType;

            if (width <= this.#breakpoints.mobile) {
                newType = 'mobile';
            } else if (width <= this.#breakpoints.tablet) {
                newType = 'tablet';
            } else if (width <= this.#breakpoints.desktop) {
                newType = 'desktop';
            } else {
                newType = 'large';
            }

            if (newType !== this.#deviceInfo.type) {
                this.#deviceInfo.type = newType;
                document.documentElement.setAttribute('data-device', newType);
                document.body.className = document.body.className
                    .replace(/mobile-view|tablet-view|desktop-view|large-view/g, '')
                    .trim();
                document.body.classList.add(`${newType}-view`);
                this.#logDeviceChange();
            }
        } catch (error) {
            this.#errorHandler.logError(error, { context: 'updateDeviceType' });
        }
    }

    #updateOrientation() {
        try {
            const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
            if (newOrientation !== this.#deviceInfo.orientation) {
                this.#deviceInfo.orientation = newOrientation;
                document.documentElement.setAttribute('data-orientation', newOrientation);
                this.#logOrientationChange();
            }
        } catch (error) {
            this.#errorHandler.logError(error, { context: 'updateOrientation' });
        }
    }

    #updateCSSVariables() {
        try {
            const root = document.documentElement;
            root.style.setProperty('--is-mobile', this.isDeviceType('mobile') ? 1 : 0);
            root.style.setProperty('--is-tablet', this.isDeviceType('tablet') ? 1 : 0);
            root.style.setProperty('--is-desktop', this.isDeviceType('desktop') ? 1 : 0);
            root.style.setProperty('--is-large', this.isDeviceType('large') ? 1 : 0);
            root.style.setProperty('--is-touch', this.#deviceInfo.touch ? 1 : 0);
            root.style.setProperty('--is-retina', this.#deviceInfo.retina ? 1 : 0);
            root.style.setProperty('--pixel-ratio', this.#deviceInfo.pixelRatio);
            root.style.setProperty('--reduced-motion', this.#deviceInfo.reducedMotion ? 1 : 0);
        } catch (error) {
            this.#errorHandler.logError(error, { context: 'updateCSSVariables' });
        }
    }

    #logDeviceChange() {
        if ('performance' in window) {
            performance.mark('deviceChange');
            performance.measure('Device Change', 'deviceChange');
        }
    }

    #logOrientationChange() {
        if ('performance' in window) {
            performance.mark('orientationChange');
            performance.measure('Orientation Change', 'orientationChange');
        }
    }

    #debounce(func, wait) {
        return (...args) => {
            clearTimeout(this.#debounceTimer);
            this.#debounceTimer = setTimeout(() => func.apply(this, args), wait);
        };
    }

    #notifyObservers() {
        this.#observers.forEach(observer => {
            try {
                observer({
                    type: this.#deviceInfo.type,
                    orientation: this.#deviceInfo.orientation,
                    isTouch: this.#deviceInfo.touch,
                    isRetina: this.#deviceInfo.retina,
                    pixelRatio: this.#deviceInfo.pixelRatio,
                    reducedMotion: this.#deviceInfo.reducedMotion
                });
            } catch (error) {
                this.#errorHandler.logError(error, { context: 'notifyObservers' });
            }
        });
    }

    // Public methods
    subscribe(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Observer must be a function');
        }
        this.#observers.add(callback);
        return () => this.#observers.delete(callback);
    }

    getDeviceInfo() {
        return { ...this.#deviceInfo };
    }

    isDeviceType(type) {
        return this.#deviceInfo.type === type;
    }

    isOrientation(orientation) {
        return this.#deviceInfo.orientation === orientation;
    }

    getCurrentBreakpoint() {
        return this.#deviceInfo.type;
    }

    getBreakpoints() {
        return { ...this.#breakpoints };
    }

    updateBreakpoints(newBreakpoints) {
        try {
            this.#breakpoints = { ...this.#breakpoints, ...newBreakpoints };
            this.#updateDeviceType();
            this.#notifyObservers();
        } catch (error) {
            this.#errorHandler.logError(error, { context: 'updateBreakpoints' });
        }
    }

    getPerformanceMetrics() {
        return Array.from(this.#performanceMetrics.entries());
    }

    clearPerformanceMetrics() {
        this.#performanceMetrics.clear();
    }
}

// Initialize the view manager
const viewManager = new DeviceViewManager();

// Add CSS variables for device-specific styles
const style = document.createElement('style');
style.textContent = `
    :root {
        /* Device-specific variables */
        --is-mobile: ${viewManager.isDeviceType('mobile') ? 1 : 0};
        --is-tablet: ${viewManager.isDeviceType('tablet') ? 1 : 0};
        --is-desktop: ${viewManager.isDeviceType('desktop') ? 1 : 0};
        --is-large: ${viewManager.isDeviceType('large') ? 1 : 0};
        --is-touch: ${viewManager.getDeviceInfo().touch ? 1 : 0};
        --is-retina: ${viewManager.getDeviceInfo().retina ? 1 : 0};
        --pixel-ratio: ${viewManager.getDeviceInfo().pixelRatio};
        --reduced-motion: ${viewManager.getDeviceInfo().reducedMotion ? 1 : 0};
    }

    /* Device-specific styles */
    [data-device="mobile"] {
        --content-width: 100%;
        --content-padding: 1rem;
    }

    [data-device="tablet"] {
        --content-width: 720px;
        --content-padding: 2rem;
    }

    [data-device="desktop"] {
        --content-width: 960px;
        --content-padding: 2rem;
    }

    [data-device="large"] {
        --content-width: 1200px;
        --content-padding: 2rem;
    }

    /* Orientation-specific styles */
    [data-orientation="portrait"] {
        --orientation-multiplier: 1;
    }

    [data-orientation="landscape"] {
        --orientation-multiplier: 1.2;
    }

    /* Reduced motion styles */
    @media (prefers-reduced-motion: reduce) {
        * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
        }
    }

    /* Mobile View Styles */
    .mobile-view .header__nav-list {
        position: fixed;
        top: 0;
        right: -100%;
        width: min(280px, 80vw);
        height: 100vh;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        flex-direction: column;
        padding: calc(var(--header-height) + 2rem) 2rem 2rem;
        transition: right var(--transition-duration) var(--transition-timing);
        box-shadow: -4px 0 24px rgba(67, 97, 238, 0.12);
        overflow-y: auto;
    }

    .mobile-view .header__nav-list.active {
        right: 0;
    }

    .mobile-view .mobile-table {
        display: block;
        width: 100%;
        overflow-x: auto;
    }

    /* Tablet View Styles */
    .tablet-view .header__container {
        padding: 0 1.5rem;
    }

    /* Desktop View Styles */
    .desktop-view .header__container {
        padding: 0 2rem;
    }

    /* Menu Animation Styles */
    .header__nav-list {
        transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
    }

    .header__nav-list.active {
        transform: translateX(0);
        opacity: 1;
    }

    .header__submenu {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease-in-out;
    }

    .header__submenu.active {
        max-height: 500px;
    }

    /* Menu Button Animation */
    .header__mobile-menu {
        transition: transform 0.3s ease-in-out;
    }

    .header__mobile-menu.open {
        transform: rotate(90deg);
    }

    /* Menu Item Hover Effects */
    .header__nav-item {
        position: relative;
        transition: color 0.3s ease-in-out;
    }

    .header__nav-item::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 0;
        height: 2px;
        background-color: var(--primary);
        transition: width 0.3s ease-in-out;
    }

    .header__nav-item:hover::after {
        width: 100%;
    }

    /* Submenu Styles */
    .header__submenu {
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    /* Mobile Menu Styles */
    @media (max-width: 768px) {
        .header__nav-list {
            position: fixed;
            top: 0;
            right: -100%;
            width: min(280px, 80vw);
            height: 100vh;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            flex-direction: column;
            padding: calc(var(--header-height) + 2rem) 2rem 2rem;
            box-shadow: -4px 0 24px rgba(67, 97, 238, 0.12);
            overflow-y: auto;
        }

        .header__nav-list.active {
            right: 0;
        }

        .header__submenu {
            position: static;
            width: 100%;
            box-shadow: none;
            background: transparent;
        }
    }
`;
document.head.appendChild(style);

// Export the view manager instance
window.viewManager = viewManager;

// Example usage of view manager
document.addEventListener('DOMContentLoaded', () => {
    // Example observer
    viewManager.subscribe((deviceInfo) => {
        console.log('Device changed:', deviceInfo);
        // Add any view-specific logic here
    });
});

/**
 * Advanced Menu Manager
 * Handles menu state, animations, and interactions
 */
class MenuManager {
    static #instance = null;
    #menuState = {
        isOpen: false,
        isAnimating: false,
        currentSubmenu: null
    };
    #elements = {
        menuButton: null,
        menuContainer: null,
        menuItems: null,
        submenus: null
    };
    #errorHandler = null;
    #initializationAttempts = 0;
    #maxInitializationAttempts = 10;
    #initializationInterval = 100;

    constructor() {
        if (MenuManager.#instance) {
            return MenuManager.#instance;
        }
        MenuManager.#instance = this;
        this.#initializeErrorHandler();
        this.#initializeElements();
    }

    #initializeErrorHandler() {
        this.#errorHandler = {
            errors: new Map(),
            logError: (error, context = {}) => {
                const errorId = Date.now();
                this.#errorHandler.errors.set(errorId, {
                    message: error.message,
                    stack: error.stack,
                    context,
                    timestamp: new Date().toISOString()
                });
                console.error(`[MenuManager] Error ${errorId}:`, error);
                return errorId;
            }
        };
    }

    #initializeElements() {
        try {
            this.#elements.menuButton = document.querySelector('.header__mobile-menu');
            this.#elements.menuContainer = document.querySelector('.header__nav-list');
            this.#elements.menuItems = document.querySelectorAll('.header__nav-item');
            this.#elements.submenus = document.querySelectorAll('.header__submenu');

            if (!this.#elements.menuButton || !this.#elements.menuContainer) {
                if (this.#initializationAttempts < this.#maxInitializationAttempts) {
                    this.#initializationAttempts++;
                    setTimeout(() => this.#initializeElements(), this.#initializationInterval);
                    return;
                }
                throw new Error('Required menu elements not found after multiple attempts');
            }

            this.#setupEventListeners();
        } catch (error) {
            this.#errorHandler.logError(error, { context: 'initializeElements' });
        }
    }

    #setupEventListeners() {
        try {
            // Menu button click handler
            this.#elements.menuButton?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMenu();
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (this.#menuState.isOpen && !e.target.closest('.header__nav')) {
                    this.closeMenu();
                }
            });

            // Handle submenu interactions
            this.#elements.menuItems.forEach(item => {
                const submenu = item.querySelector('.header__submenu');
                if (submenu) {
                    const link = item.querySelector('a');
                    if (link) {
                        link.addEventListener('click', (e) => {
                            if (window.innerWidth <= 768) {
                                e.preventDefault();
                                this.toggleSubmenu(item, submenu);
                            }
                        });
                    }
                }
            });

            // Handle keyboard navigation
            this.#elements.menuContainer?.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeMenu();
                }
            });

            // Handle window resize
            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    if (window.innerWidth > 768 && this.#menuState.isOpen) {
                        this.closeMenu();
                    }
                }, 250);
            });

            // Handle orientation change
            window.addEventListener('orientationchange', () => {
                if (this.#menuState.isOpen) {
                    this.closeMenu();
                }
            });
        } catch (error) {
            this.#errorHandler.logError(error, { context: 'setupEventListeners' });
        }
    }

    toggleMenu() {
        if (this.#menuState.isAnimating) return;

        this.#menuState.isAnimating = true;
        const willOpen = !this.#menuState.isOpen;

        if (willOpen) {
            this.openMenu();
        } else {
            this.closeMenu();
        }

        // Reset animation state after transition
        setTimeout(() => {
            this.#menuState.isAnimating = false;
        }, 300);
    }

    openMenu() {
        try {
            this.#menuState.isOpen = true;
            this.#elements.menuButton?.setAttribute('aria-expanded', 'true');
            this.#elements.menuButton?.classList.add('open');
            this.#elements.menuContainer?.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Focus first menu item
            const firstMenuItem = this.#elements.menuContainer?.querySelector('a');
            firstMenuItem?.focus();

            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('menuOpened'));
        } catch (error) {
            this.#errorHandler.logError(error, { context: 'openMenu' });
        }
    }

    closeMenu() {
        try {
            this.#menuState.isOpen = false;
            this.#menuState.currentSubmenu = null;
            this.#elements.menuButton?.setAttribute('aria-expanded', 'false');
            this.#elements.menuButton?.classList.remove('open');
            this.#elements.menuContainer?.classList.remove('active');
            document.body.style.overflow = '';

            // Close all submenus
            this.#elements.submenus.forEach(submenu => {
                submenu.classList.remove('active');
            });

            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('menuClosed'));
        } catch (error) {
            this.#errorHandler.logError(error, { context: 'closeMenu' });
        }
    }

    toggleSubmenu(parentItem, submenu) {
        try {
            const isOpen = submenu.classList.contains('active');
            
            // Close other submenus
            this.#elements.submenus.forEach(otherSubmenu => {
                if (otherSubmenu !== submenu) {
                    otherSubmenu.classList.remove('active');
                    const parent = otherSubmenu.closest('.header__nav-item');
                    if (parent) {
                        parent.classList.remove('submenu-open');
                    }
                }
            });

            if (isOpen) {
                submenu.classList.remove('active');
                parentItem.classList.remove('submenu-open');
                this.#menuState.currentSubmenu = null;
            } else {
                submenu.classList.add('active');
                parentItem.classList.add('submenu-open');
                this.#menuState.currentSubmenu = submenu;

                // Focus first submenu item
                const firstSubmenuItem = submenu.querySelector('a');
                firstSubmenuItem?.focus();
            }

            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('submenuToggled', {
                detail: { isOpen: !isOpen, submenu }
            }));
        } catch (error) {
            this.#errorHandler.logError(error, { context: 'toggleSubmenu' });
        }
    }

    isMenuOpen() {
        return this.#menuState.isOpen;
    }

    getCurrentSubmenu() {
        return this.#menuState.currentSubmenu;
    }

    // Public method to reinitialize elements if needed
    reinitialize() {
        this.#initializationAttempts = 0;
        this.#initializeElements();
    }
}

// Initialize the menu manager
const menuManager = new MenuManager();

// Add menu-specific styles
const menuStyles = document.createElement('style');
menuStyles.textContent = `
    /* Menu Animation Styles */
    .header__nav-list {
        transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
    }

    .header__nav-list.active {
        transform: translateX(0);
        opacity: 1;
    }

    .header__submenu {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease-in-out;
    }

    .header__submenu.active {
        max-height: 500px;
    }

    /* Menu Button Animation */
    .header__mobile-menu {
        transition: transform 0.3s ease-in-out;
    }

    .header__mobile-menu.open {
        transform: rotate(90deg);
    }

    /* Menu Item Hover Effects */
    .header__nav-item {
        position: relative;
        transition: color 0.3s ease-in-out;
    }

    .header__nav-item::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 0;
        height: 2px;
        background-color: var(--primary);
        transition: width 0.3s ease-in-out;
    }

    .header__nav-item:hover::after {
        width: 100%;
    }

    /* Submenu Styles */
    .header__submenu {
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    /* Mobile Menu Styles */
    @media (max-width: 768px) {
        .header__nav-list {
            position: fixed;
            top: 0;
            right: -100%;
            width: min(280px, 80vw);
            height: 100vh;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            flex-direction: column;
            padding: calc(var(--header-height) + 2rem) 2rem 2rem;
            box-shadow: -4px 0 24px rgba(67, 97, 238, 0.12);
            overflow-y: auto;
        }

        .header__nav-list.active {
            right: 0;
        }

        .header__submenu {
            position: static;
            width: 100%;
            box-shadow: none;
            background: transparent;
        }
    }
`;
document.head.appendChild(menuStyles);

// Export the menu manager instance
window.menuManager = menuManager; 