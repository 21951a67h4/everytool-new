// FAQ Accordion Functionality with Error Handling and Performance Optimizations
class FAQManager {
    static #instance = null;
    #errorHandler = null;
    #observers = new Set();
    #faqState = new Map();

    constructor() {
        if (FAQManager.#instance) {
            return FAQManager.#instance;
        }
        FAQManager.#instance = this;
        this.#initializeErrorHandler();
        this.#initializeFAQ();
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
                console.error(`[FAQManager] Error ${errorId}:`, error);
                return errorId;
            },
            getError: (errorId) => this.#errorHandler.errors.get(errorId),
            clearErrors: () => this.#errorHandler.errors.clear()
        };
    }

    #initializeFAQ() {
        try {
            document.addEventListener('DOMContentLoaded', () => {
                this.#setupFAQItems('.faq-item');
                this.#setupFAQItems('.tools-faq-item');
                this.#setupIntersectionObserver();
            });
        } catch (error) {
            this.#errorHandler.logError(error, { context: 'initializeFAQ' });
        }
    }

    #setupFAQItems(selector) {
        try {
            const faqItems = document.querySelectorAll(selector);
            const questionSelector = selector === '.faq-item' ? '.faq-question' : '.tools-faq-question';

            faqItems.forEach((item, index) => {
                const question = item.querySelector(questionSelector);
                if (!question) {
                    throw new Error(`Question element not found for ${selector} at index ${index}`);
                }

                // Initialize state
                this.#faqState.set(item, {
                    isActive: false,
                    isAnimating: false
                });

                // Setup click handler with debounce
                question.addEventListener('click', this.#debounce(() => {
                    this.#handleFAQClick(item, faqItems);
                }, 150));

                // Setup keyboard navigation
                question.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        question.click();
                    }
                });

                // Setup accessibility attributes
                question.setAttribute('tabindex', '0');
                question.setAttribute('role', 'button');
                question.setAttribute('aria-expanded', 'false');
                question.setAttribute('aria-controls', `faq-answer-${index}`);
                
                const answer = item.querySelector(selector === '.faq-item' ? '.faq-answer' : '.tools-faq-answer');
                if (answer) {
                    answer.setAttribute('id', `faq-answer-${index}`);
                    answer.setAttribute('aria-hidden', 'true');
                }
            });
        } catch (error) {
            this.#errorHandler.logError(error, { context: 'setupFAQItems' });
        }
    }

    #setupIntersectionObserver() {
        try {
            const options = {
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
            }, options);

            document.querySelectorAll('.faq-item, .tools-faq-item').forEach(item => {
                observer.observe(item);
            });
        } catch (error) {
            this.#errorHandler.logError(error, { context: 'setupIntersectionObserver' });
        }
    }

    #handleFAQClick(clickedItem, allItems) {
        try {
            const state = this.#faqState.get(clickedItem);
            if (state.isAnimating) return;

            state.isAnimating = true;
            const willOpen = !state.isActive;

            // Close all other items
            allItems.forEach(item => {
                if (item !== clickedItem) {
                    this.#closeFAQItem(item);
                }
            });

            // Toggle clicked item
            if (willOpen) {
                this.#openFAQItem(clickedItem);
            } else {
                this.#closeFAQItem(clickedItem);
            }

            // Reset animation state
            setTimeout(() => {
                state.isAnimating = false;
            }, 300);

            // Notify observers
            this.#notifyObservers({
                type: 'faqToggle',
                item: clickedItem,
                isOpen: willOpen
            });
        } catch (error) {
            this.#errorHandler.logError(error, { context: 'handleFAQClick' });
        }
    }

    #openFAQItem(item) {
        try {
            const state = this.#faqState.get(item);
            state.isActive = true;
            item.classList.add('active');

            const question = item.querySelector('.faq-question, .tools-faq-question');
            const answer = item.querySelector('.faq-answer, .tools-faq-answer');

            if (question && answer) {
                question.setAttribute('aria-expanded', 'true');
                answer.setAttribute('aria-hidden', 'false');
            }
        } catch (error) {
            this.#errorHandler.logError(error, { context: 'openFAQItem' });
        }
    }

    #closeFAQItem(item) {
        try {
            const state = this.#faqState.get(item);
            state.isActive = false;
            item.classList.remove('active');

            const question = item.querySelector('.faq-question, .tools-faq-question');
            const answer = item.querySelector('.faq-answer, .tools-faq-answer');

            if (question && answer) {
                question.setAttribute('aria-expanded', 'false');
                answer.setAttribute('aria-hidden', 'true');
            }
        } catch (error) {
            this.#errorHandler.logError(error, { context: 'closeFAQItem' });
        }
    }

    #debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    #notifyObservers(data) {
        this.#observers.forEach(observer => {
            try {
                observer(data);
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

    getFAQState(item) {
        return this.#faqState.get(item);
    }

    getAllFAQStates() {
        return Array.from(this.#faqState.entries());
    }
}

// Initialize the FAQ manager
const faqManager = new FAQManager();

// Export the FAQ manager instance
window.faqManager = faqManager; 

