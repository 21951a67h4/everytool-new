# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EveryTool.tech** is a comprehensive web platform providing 50+ free online tools across multiple categories (calculators, converters, generators, developer tools, SEO tools, etc.). The project is built entirely with vanilla HTML, CSS, and JavaScript—no frameworks. It emphasizes performance, privacy, accessibility, and SEO.

**Main Tech Stack:**
- HTML, CSS, JavaScript (TypeScript-inspired UI components)
- Vanilla JavaScript - no frameworks except essential libraries (Fuse.js, Font Awesome)
- React (for future CMS and dashboard projects)
- Supabase (for backend data when needed)

**Entry Points:** `/index.html`, `/tools/`, `/cms/`, `/assets/`, `/blog/`, `/game/`

**Launch Target:** May 23, 2025, 3:50 PM

---

## Canonical UI Rule

**CRITICAL - Read this first before any implementation:**

Modern, TypeScript-inspired card-first UI. **NO heavy gradients**. Simple color tokens. Smooth, fluid interactions. Cross-browser and device-optimized. Accessibility and performance checks mandatory for every new page or component.

---

## Critical Design & Technical Principles

**These principles MUST be followed for every page, component, and feature:**

### Design and UI Standards

**Visual Philosophy:**
- Modern, minimal UI inspired by TypeScript documentation and component aesthetics
- Card surfaces with clear hierarchy
- **NO heavy gradients** - use flat or subtly shaded colors only
- Simple, restrained color palettes — prioritize legibility and contrast
- Ample whitespace and clear typography hierarchy

**Design Elements:**
- **Card-First Layout** - Every UI block should be a card component (title, meta, body, actions)
- Subtle shadows and hover effects for depth (not color gradients)
- Smooth animations and micro-interactions
- Highly interactive elements (hover, focus, keyboard navigable)
- Consistent color palette using CSS custom properties (design tokens)

### Official Color System (Design Tokens)

**ALWAYS use these exact color tokens:**

```css
:root {
    /* Background & Surfaces */
    --bg: #FFFFFF;
    --surface: #F8F9FB;
    --card: #FFFFFF;

    /* Text */
    --text-primary: #0F1724;
    --text-muted: #6B7280;

    /* Accent */
    --accent: #0EA5E9;

    /* Status Colors (tokenized) */
    --success: #10B981;
    --warning: #F59E0B;
    --danger: #EF4444;
}
```

**Rules:**
- Use only 2–3 accent shades maximum
- NO custom gradients or heavy color overlays
- Prioritize contrast and legibility

### Motion & Animation Standards

**Easing & Timing:**
- Primary easing: `cubic-bezier(0.22, 1, 0.36, 1)` for smooth, fluid motion
- Alternative: `cubic-bezier(0.4, 0, 0.2, 1)` for standard transitions
- Transition duration: **160ms to 320ms** for micro-interactions
- Use subtle elevation and shadow changes for depth

**Animation Principles:**
- Smooth, fluid motion for all interactions
- Hover effects: `transform: translateY()` with shadow changes
- Avoid jarring or heavy animations
- Respect `prefers-reduced-motion` media query

### Technology Stack Requirements

**ONLY HTML, CSS, and JavaScript** - No frameworks, limited libraries:
- ✅ Fuse.js (search functionality only)
- ✅ Font Awesome (icons)
- ✅ Google Fonts (Inter family)
- ❌ No jQuery
- ❌ No frontend frameworks
- ❌ No build tools (direct browser-ready code)

**JavaScript Requirements:**
- Pure vanilla JavaScript
- ES5-compatible with progressive enhancement
- Wrap code in IIFEs to avoid global namespace pollution
- Use feature detection before modern APIs
- Provide fallbacks for older browsers

### Universal Browser Compatibility

**CRITICAL: All code must work across ALL browsers**

**Target Browsers:**
- Evergreen browsers (Chrome, Firefox, Safari, Edge) - latest versions
- Last 2 major versions of Safari and Edge
- Mobile browsers: Chrome Mobile, Safari iOS, Samsung Internet
- Graceful degradation for older browsers (IE11 where possible)

**Cross-Browser Checklist:**
- Include polyfills in `universal-search-deploy.js` when needed
- Use feature detection (`if ('feature' in window)`)
- Provide fallbacks for modern APIs (fetch → XMLHttpRequest, etc.)
- Test vendor prefixes for CSS (`-webkit-`, `-moz-`, `-ms-`)
- Use `var` instead of `let`/`const` when broad compatibility needed
- Avoid arrow functions in critical paths
- Test backdrop-filter with `-webkit-backdrop-filter` fallback

### Device Optimization Requirements

**CRITICAL: All pages must work from 320px to 2560px**

**Responsive Breakpoints:**
- **Mobile**: ≤480px (320px - 480px) - PRIMARY FOCUS
- **Tablet**: 481px - 1024px (768px - 1023px)
- **Desktop**: ≥1025px (1024px - 1439px)
- **Large Desktop**: 1440px - 2560px+

**Mobile-First Approach:**
- Base styles for mobile, then media queries scale up
- Touch-friendly tap targets (minimum 44x44px)
- Viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- Readable font sizes (minimum 16px for body text on mobile)
- No horizontal scrolling at any breakpoint
- Test portrait and landscape orientations
- Responsive images with appropriate sizing
- CSS Grid and Flexbox for natural reflow

### Accessibility Standards

**Target: WCAG AA Compliance (mandatory)**

**Requirements:**
- Semantic HTML5 elements
- ARIA labels and roles where needed
- Keyboard navigation support for all interactive elements
- Screen reader friendly
- Focus management and visible focus states
- Color contrast ratios:
  - **4.5:1 minimum** for normal text
  - **3:1 minimum** for large text and UI components
- Skip links for main content
- Alt text for all images
- Form labels and error messages

### Performance Standards

**Mandatory Performance Targets:**
- **Lighthouse score: 90+**
- **Bundle budget per page: under 200KB gzipped**
- Fast load times on 3G networks
- Avoid blocking main thread for more than 100ms

**Optimization Requirements:**
- Lazy loading for below-the-fold content (Intersection Observer)
- Deferred script loading (`defer` or `async` attributes)
- Optimized images (WebP, AVIF) - compressed
- Preload critical fonts and styles
- Minimal JavaScript execution blocking
- Efficient CSS (no unused rules)
- Avoid layout shifts (specify image dimensions)

---

## Architecture & Code Structure

### Core Loading System

The site uses a **universal component loading system** via `app-loader.js`:

- **Header/Footer Loading**: `app-loader.js` loads `/header.html` and `/footer.html` into placeholders (`#header-placeholder`, `#footer-placeholder`) on every page
- After header loads, `header-search.js` is dynamically loaded to initialize the universal search
- This ensures consistent navigation and search functionality across all pages without duplication

### Universal Search System

Critical feature accessible from any page:

1. **Search Index**: `/search-index.json` contains all searchable pages
2. **Search Implementation**:
   - `header-search.js` - Main search logic using Fuse.js for fuzzy search
   - `universal-search-deploy.js` - Polyfills and deployment utilities
   - **Keyboard shortcut: Alt + S** opens global search from anywhere
3. **Voice Search**: Uses Web Speech API (webkitSpeechRecognition)

### Page Types & Templates

1. **Landing Page** (`index.html`)
   - Hero section with founder profile card
   - Category cards (11 main categories)
   - Blog carousel with demo posts
   - FAQ section, trust indicators, testimonials
   - Welcome popup (localStorage-based, first-time visitors)

2. **Tool Pages** (`tools/**/*.html`)
   - Organized by category folders
   - Each tool has standalone HTML with embedded functionality
   - Share common CSS from `tools/tool.css`

3. **Tools Hub** (`tools-hub/index.html`)
   - Central directory of all tools
   - Real-time filtering by category
   - Responsive grid layout

4. **Blog System** (`blog/`)
   - Blog hub at `blog/index.html`
   - Individual articles with structured data (schema.org)
   - Blog cards dynamically loaded

5. **Game Hub** (`game/`)
   - Browser-based games collection
   - Template available at `game/_template/`

6. **Category Pages** (`category-pages/`)
   - Individual category landing pages

### File Organization

**JavaScript:**
- `script.js` - Landing page functionality
- `view.js` - View utilities
- `back-to-top.js` - Back-to-top button
- `FAQ section/faq.js` - FAQ accordion
- `header-search.js` - Global search
- `app-loader.js` - Universal header/footer loader

**CSS:**
- `styles.css` - Main landing page styles
- `tools/tool.css` - Shared tool page styles
- `blog/styles.css` - Blog-specific styles
- `FAQ section/faq.css` - FAQ component styles
- `back-to-top.css` - Back-to-top button styles
- Most pages include inline `<style>` blocks for page-specific styling

---

## Common Development Commands

### Local Development

```bash
# Serve locally (use any static server)
# Example with Python:
python -m http.server 8000

# Example with Node.js http-server:
npx http-server -p 8000
```

### Git Workflow

```bash
# View status
git status

# Stage changes
git add .

# Commit changes
git commit -m "Description"

# Push to remote
git push origin main
```

### Browser Testing with Chrome DevTools MCP

**Overview:**
The project leverages Chrome DevTools MCP (Model Context Protocol) for automated browser testing, debugging, and quality assurance. This enables programmatic interaction with the browser during development, making testing more efficient and consistent.

**MCP Capabilities:**
- **Navigation**: Open URLs and navigate between pages
- **Element Interaction**: Click, type, and interact with page elements
- **JavaScript Execution**: Run JavaScript in the browser context for testing
- **Visual Verification**: Take screenshots at different viewport sizes
- **Responsive Testing**: Test layouts at 320px, 480px, 768px, 1024px, 1440px, 2560px
- **Console Monitoring**: Track console errors, warnings, and logs
- **Accessibility Checks**: Automated accessibility evaluation
- **Performance Profiling**: Lighthouse audits and performance metrics
- **Network Analysis**: Monitor requests, responses, and loading times

**Common MCP Testing Workflow:**

```
1. Launch browser with MCP connection
2. Navigate to page under test (e.g., http://localhost:8000)
3. Test responsive layouts:
   - Set viewport to 320px (mobile)
   - Verify layout, touch targets, readability
   - Set viewport to 768px (tablet)
   - Verify layout transitions
   - Set viewport to 1440px (desktop)
   - Verify full layout
4. Test interactive features:
   - Alt + S shortcut (global search)
   - Header/footer loading
   - Navigation links
   - Form submissions
5. Check console for errors/warnings
6. Run Lighthouse audit (target: 90+ score)
7. Take screenshots for documentation
8. Verify accessibility (color contrast, ARIA labels, keyboard nav)
```

**Available MCP Commands:**

**Page Management:**
- `navigate_page` - Navigate to a specific URL
- `navigate_page_history` - Navigate through browser history (back/forward)
- `new_page` - Open a new browser tab/page
- `close_page` - Close current page
- `list_pages` - List all open pages
- `select_page` - Switch to a specific page

**Element Interaction:**
- `click` - Click on page elements
- `hover` - Hover over elements
- `fill` - Fill input fields
- `fill_form` - Fill multiple form fields
- `upload_file` - Upload files through file inputs
- `drag` - Drag elements

**Viewport & Device Emulation:**
- `resize_page` - Change viewport size (e.g., 320px, 768px, 1440px)
- `emulate_cpu` - Simulate slower CPU for performance testing
- `emulate_network` - Simulate network conditions (3G, 4G, offline)

**JavaScript & Testing:**
- `evaluate_script` - Execute JavaScript in browser context
- `wait_for` - Wait for elements or conditions

**Monitoring & Debugging:**
- `get_console_message` - Get specific console message
- `list_console_messages` - List all console messages (errors, warnings, logs)
- `get_network_request` - Get specific network request details
- `list_network_requests` - List all network requests
- `handle_dialog` - Handle browser dialogs (alert, confirm, prompt)

**Performance & Analysis:**
- `performance_start_trace` - Start performance recording
- `performance_stop_trace` - Stop performance recording
- `performance_analyze_insight` - Analyze performance metrics
- `take_screenshot` - Capture page screenshot at current viewport
- `take_snapshot` - Take DOM snapshot

**Example MCP Testing Scenarios:**

```javascript
// Test responsive layout
1. navigate_page("http://localhost:8000")
2. resize_page(320, 568) // iPhone SE
3. take_screenshot() // Document mobile view
4. resize_page(1440, 900) // Desktop
5. take_screenshot() // Document desktop view

// Test search functionality
1. navigate_page("http://localhost:8000")
2. evaluate_script('document.dispatchEvent(new KeyboardEvent("keydown", {key: "s", altKey: true}))')
3. wait_for('.search-modal')
4. fill('#search-input', 'calculator')
5. list_console_messages() // Check for errors

// Test performance on slow network
1. navigate_page("http://localhost:8000")
2. emulate_network("Slow 3G")
3. performance_start_trace()
4. navigate_page("http://localhost:8000/tools/")
5. performance_stop_trace()
6. performance_analyze_insight() // Get Lighthouse-style insights

// Test form submission
1. navigate_page("http://localhost:8000/contact.html")
2. fill_form({
     name: "Test User",
     email: "test@example.com",
     message: "Test message"
   })
3. click('button[type="submit"]')
4. wait_for('.success-message')
5. get_console_message() // Verify no errors
```

**Benefits of MCP Testing:**
- Automated regression testing
- Consistent testing across different viewport sizes
- Quick verification of cross-browser compatibility
- Documentation with automated screenshots
- Early detection of performance issues
- Accessibility validation

**Manual browser testing also required:**
- Test across browsers: Chrome, Firefox, Safari, Edge
- Test search functionality (Alt + S shortcut, voice search)
- Test header/footer loading on different pages
- Validate HTML at https://validator.w3.org/
- Test SEO metadata with browser extensions
- Verify accessibility with screen readers and keyboard navigation
- Test on real mobile devices (iOS Safari, Android Chrome)

---

## Implementation Guidelines

### Creating or Editing ANY Page/Section

**Before implementing any feature, page, or component, you MUST ensure:**

#### 1. Design Standards Checklist

- ✅ Use **card-first layout** (every UI block is a card)
- ✅ Apply **design tokens** from the official color system
- ✅ **NO heavy gradients** - use flat or subtly shaded colors only
- ✅ Smooth transitions (160ms-320ms) with proper easing
- ✅ Hover effects with `transform: translateY()` and shadow changes
- ✅ Ample whitespace and clear typography hierarchy
- ✅ Subtle elevation and shadows for depth

#### 2. Cross-Browser Testing Checklist

- ✅ Test in Chrome, Firefox, Safari, and Edge
- ✅ Verify vendor prefixes included (especially `-webkit-` for Safari)
- ✅ Check that polyfills are available for modern APIs
- ✅ Use feature detection before using new APIs
- ✅ Provide graceful fallbacks
- ✅ Test on mobile browsers (Safari iOS, Chrome Mobile)

#### 3. Responsive Design Verification

- ✅ Test at 320px, 480px, 768px, 1024px, 1440px, 2560px widths
- ✅ Ensure mobile-first approach (base styles for mobile, scale up)
- ✅ Verify touch targets are at least 44x44px on mobile
- ✅ Check text is readable without zooming (16px minimum on mobile)
- ✅ Ensure no horizontal scrolling at any breakpoint
- ✅ Test both portrait and landscape orientations
- ✅ Verify card layouts reflow naturally on all screen sizes

#### 4. Accessibility Verification

- ✅ Use semantic HTML5 elements
- ✅ Add ARIA labels where needed
- ✅ Ensure keyboard navigation works
- ✅ Test with screen reader
- ✅ Verify color contrast ratios (4.5:1 for text, 3:1 for UI)
- ✅ Add focus states for all interactive elements
- ✅ Include alt text for images

#### 5. Performance Checks

- ✅ Use `defer` or `async` for script tags
- ✅ Implement lazy loading for images and below-fold content
- ✅ Compress images before adding (WebP/AVIF preferred)
- ✅ Avoid layout shifts (specify image dimensions)
- ✅ Check bundle size (target: under 200KB gzipped)
- ✅ Test on 3G network throttling
- ✅ Verify Lighthouse score (target: 90+)
- ✅ Use Chrome DevTools MCP for automated performance testing and screenshots

### Adding New Tools

1. Create tool HTML file in appropriate category folder under `tools/`
2. Include header/footer placeholders:
   ```html
   <div id="header-placeholder"></div>
   <!-- tool content with card-based layout -->
   <div id="footer-placeholder"></div>
   <script src="/app-loader.js" defer></script>
   ```
3. Use design tokens for colors
4. Ensure mobile-first responsive design
5. Add tool metadata to `/search-index.json`
6. Update category page with link to new tool
7. Update `/sitemap.xml` if applicable
8. Test across all browsers and devices

### Adding New Blog Posts

1. Create article HTML in `blog/` directory
2. Include structured data (BlogPosting schema)
3. Use card-based layout for content sections
4. Add blog card data to `blog/script.js`
5. Update blog carousel on landing page if needed
6. Test responsive layout and accessibility

### Modifying Header/Footer

- Edit `/header.html` or `/footer.html`
- Changes automatically propagate to all pages via `app-loader.js`
- Test on multiple page types after changes
- Verify search functionality still works

### Search Index Updates

When adding/removing pages:
1. Update `/search-index.json` with page metadata:
   ```json
   {
     "title": "Tool Name",
     "content": "Description and keywords",
     "url": "/tools/category/tool-name.html"
   }
   ```
2. Test search functionality after updates

---

## Code Style & Patterns

### CSS Conventions

**Always follow these conventions:**

- Use CSS custom properties (design tokens) defined in `:root`
- Follow BEM-like naming: `.component__element--modifier`
- Mobile-first responsive design (base styles for mobile, media queries scale up)
- Use CSS Grid for layouts, Flexbox for components
- Avoid `!important` unless absolutely necessary
- Use `rem` units for sizing (based on 16px root)
- Implement 4px base grid for spacing

**Example: Card Component with Design Tokens**
```css
/* Mobile-first, card-based design with design tokens */
.tool-card {
    background: var(--card);
    border: 1px solid var(--surface);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(15, 23, 36, 0.08);
    transition: all 240ms cubic-bezier(0.22, 1, 0.36, 1);

    /* Ensure touch-friendly size */
    min-height: 44px;
}

.tool-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(15, 23, 36, 0.12);
}

.tool-card__title {
    color: var(--text-primary);
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.tool-card__description {
    color: var(--text-muted);
    font-size: 0.875rem;
    line-height: 1.5;
}

/* Tablet and up */
@media (min-width: 768px) {
    .tool-card {
        padding: 2rem;
    }
}
```

**Example: Responsive Grid Layout**
```css
/* Mobile-first grid */
.tools-grid {
    display: grid;
    grid-template-columns: 1fr; /* Single column on mobile */
    gap: 1rem;
    padding: 1rem;
}

/* Tablet: 2 columns */
@media (min-width: 768px) {
    .tools-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
        padding: 2rem;
    }
}

/* Desktop: 3 columns */
@media (min-width: 1024px) {
    .tools-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
    }
}
```

**Example: Subtle Elevation (NO gradients)**
```css
.elevated-card {
    background: var(--card);
    border-radius: 12px;
    /* Use subtle shadow for depth, NOT gradients */
    box-shadow: 0 1px 3px rgba(15, 23, 36, 0.08),
                0 4px 6px rgba(15, 23, 36, 0.04);
    transition: box-shadow 240ms cubic-bezier(0.22, 1, 0.36, 1);
}

.elevated-card:hover {
    box-shadow: 0 4px 8px rgba(15, 23, 36, 0.12),
                0 8px 16px rgba(15, 23, 36, 0.08);
}
```

### JavaScript Patterns

**Always follow these patterns:**

- Use vanilla JavaScript (no jQuery or frameworks)
- Wrap code in IIFEs to avoid global namespace pollution
- Use feature detection for progressive enhancement
- Provide fallbacks for older browsers
- Handle errors gracefully with try-catch
- Use `var` for broad compatibility, `let`/`const` for modern-only features
- Avoid arrow functions in critical paths for older browsers

**Example: Cross-Browser JavaScript with Fallbacks**
```javascript
// IIFE to avoid global namespace pollution
(function() {
    'use strict';

    // Feature detection for fetch
    function loadData() {
        if (window.fetch) {
            // Modern browsers
            fetch('/api/data.json')
                .then(function(response) {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(function(data) { handleData(data); })
                .catch(function(error) {
                    console.error('Error:', error);
                    showErrorMessage('Failed to load data');
                });
        } else {
            // Fallback for older browsers
            var xhr = new XMLHttpRequest();
            xhr.open('GET', '/api/data.json');
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        handleData(data);
                    } catch (e) {
                        console.error('Parse error:', e);
                        showErrorMessage('Failed to parse data');
                    }
                } else {
                    showErrorMessage('Failed to load data');
                }
            };
            xhr.onerror = function() {
                showErrorMessage('Network error');
            };
            xhr.send();
        }
    }

    function handleData(data) {
        // Process data
    }

    function showErrorMessage(message) {
        // Display user-friendly error
    }

    // Use DOMContentLoaded for better compatibility
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadData);
    } else {
        loadData();
    }
})();
```

**Example: Intersection Observer with Fallback**
```javascript
(function() {
    'use strict';

    function lazyLoadImages() {
        var images = document.querySelectorAll('img[data-src]');

        if ('IntersectionObserver' in window) {
            // Modern browsers
            var imageObserver = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        var img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(function(img) {
                imageObserver.observe(img);
            });
        } else {
            // Fallback: load all images immediately
            images.forEach(function(img) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', lazyLoadImages);
    } else {
        lazyLoadImages();
    }
})();
```

---

## Critical Files (Do Not Delete)

- `/app-loader.js` - Universal component loader
- `/header.html` - Site-wide header
- `/footer.html` - Site-wide footer
- `/header-search.js` - Global search functionality
- `/universal-search-deploy.js` - Polyfills and utilities
- `/search-index.json` - Search data source
- `/sitemap.xml` - SEO sitemap
- `/index.html` - Landing page

---

## SEO & Metadata Standards

**Every page must include:**
- Proper `<title>` tag (50-60 characters)
- Meta description (150-160 characters)
- Canonical URL
- Open Graph tags (og:title, og:description, og:image, og:type, og:url)
- Twitter Card tags
- Structured data (schema.org) - Organization, CollectionPage, or BlogPosting
- Favicon
- Viewport meta tag

**Example:**
```html
<title>Tool Name | EveryTool.tech</title>
<meta name="description" content="Brief description of the tool">
<link rel="canonical" href="https://everytool.tech/tools/category/tool-name.html">
<meta property="og:title" content="Tool Name | EveryTool.tech">
<meta property="og:description" content="Brief description of the tool">
<meta property="og:image" content="https://everytool.tech/assets/tool-preview.png">
<meta property="og:url" content="https://everytool.tech/tools/category/tool-name.html">
```

---

## TODO Checklist & Open Questions

- [ ] Confirm Accessibility target (WCAG AA confirmed, or AAA?)
- [ ] Decide on Dark Mode policy (default off, optional toggle?)
- [ ] Define spacing scale (base 4px grid - implement consistently?)
- [ ] Define typography scale and fallback font stacks
- [ ] Configure responsive image strategy (srcset, lazy loading - standardize)
- [ ] Define analytics and privacy policy (consent-first approach)
- [ ] Add Storybook visual regression setup (future enhancement)
- [ ] Add CI checks: ESLint, type-check, performance budget (future)
- [ ] Finalize SEO metadata standards (in progress)

---

## Component Documentation Requirements

For any new reusable component, include:

1. **README** - Component description, usage examples, props/options
2. **Accessibility Notes** - ARIA requirements, keyboard navigation, screen reader considerations
3. **Browser Compatibility Notes** - Any specific browser requirements or fallbacks
4. **Performance Considerations** - Bundle impact, optimization tips

---

## Change Log

**2025-10-30** - Initial CLAUDE.md creation with comprehensive design, accessibility, and performance standards
- Added TypeScript-inspired UI guidelines
- Added official design token system
- Added NO heavy gradients rule
- Added card-first layout principle
- Added specific performance budgets (200KB gzipped, Lighthouse 90+)
- Added WCAG AA compliance requirements
- Added motion and animation standards
- Added cross-browser compatibility requirements
- Added mobile-first responsive design guidelines (320px - 2560px)
- Added Chrome DevTools MCP for automated browser testing and debugging
- this are the cummands u can use using chrome devtools mcp click close_page drag emulate cpu emulate network
evaluate _ script fill fill _ form get_console_message
get _ network _ request handle_dialog hover list_console_messages
list _ network _ requests list _ pages navigate _ page
navigate_page_history new_page performance _ analyze _ insight
performance _ start trace performance_stop_trace resize_page
select _ page take_screenshot take _ snapshot upload _ file wait _ for