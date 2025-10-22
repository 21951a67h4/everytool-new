/** Blog Hub - Interaction Logic (no crawlers, no infinite scroll) */
(function () {
  class DOMRefs {
    constructor() {
      this.searchInput = document.getElementById('search-input');
      this.clearSearchBtn = document.getElementById('clear-search');
      // removed: view toggle and sort
      this.filterButtonsContainer = document.querySelector('.filter-buttons');
      this.filterButtons = document.querySelectorAll('.filter-button');
      this.grid = document.getElementById('blogs-grid');
      this.cards = Array.from(document.querySelectorAll('.blog-card'));
      this.emptyState = document.getElementById('empty-state');
      this.postsCount = document.getElementById('posts-count');
      this.categoriesCount = document.getElementById('blog-categories-count');
      this.aria = document.getElementById('aria-updates');
    }
  }

  class BlogFilter {
    constructor(dom) {
      this.dom = dom;
      this.category = 'all';
      this.search = '';
      this.isAscending = true; // retained for potential future use
    }

    buildCategoryFilters() {
      if (!this.dom.filterButtonsContainer) return;
      // Collect unique, case-insensitive category names from cards
      const labelsBySlug = new Map();
      this.dom.cards.forEach(card => {
        const raw = (card.dataset.category || '').trim();
        if (!raw) return;
        const slug = raw.toLowerCase();
        if (!labelsBySlug.has(slug)) {
          // Preserve original label casing for display from first occurrence
          labelsBySlug.set(slug, raw);
        }
      });

      // Build buttons: All + sorted categories by label
      const allBtn = '<button class="filter-button active" data-category="all">All</button>';
      const cats = Array.from(labelsBySlug.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([slug, label]) => `<button class="filter-button" data-category="${slug}">${label}</button>`)
        .join('');
      this.dom.filterButtonsContainer.innerHTML = allBtn + cats;

      // Refresh refs after DOM update
      this.dom.filterButtons = this.dom.filterButtonsContainer.querySelectorAll('.filter-button');
    }

    attach() {
      this.dom.searchInput?.addEventListener('input', () => {
        this.search = (this.dom.searchInput.value || '').toLowerCase().trim();
        this.dom.clearSearchBtn?.classList.toggle('hidden', this.search === '');
        this.apply();
      });

      this.dom.clearSearchBtn?.addEventListener('click', () => {
        if (!this.dom.searchInput) return;
        this.dom.searchInput.value = '';
        this.search = '';
        this.dom.clearSearchBtn.classList.add('hidden');
        this.apply();
      });

      this.dom.filterButtons.forEach(btn =>
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget;
          if (!target?.dataset?.category) return;
          this.dom.filterButtons.forEach(b => b.classList.remove('active'));
          target.classList.add('active');
          this.category = (target.dataset.category || 'all').toLowerCase();
          this.apply();
        })
      );

      // removed: view toggle and sort button handlers

      // Keyboard: / to focus search, Esc to clear
      document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== this.dom.searchInput) {
          e.preventDefault();
          this.dom.searchInput?.focus();
        }
        if (e.key === 'Escape' && this.search) {
          this.dom.clearSearchBtn?.click();
        }
      });
    }

    updateStats() {
      const total = this.dom.cards.length;
      const categories = new Set(
        this.dom.cards.map(c => (c.dataset.category || '').toLowerCase()).filter(Boolean)
      );
      if (this.dom.postsCount) this.dom.postsCount.textContent = String(total);
      if (this.dom.categoriesCount) this.dom.categoriesCount.textContent = String(categories.size);
    }

    sortCards() {
      // Sort DOM nodes by title text and re-append
      const sorted = [...this.dom.cards].sort((a, b) => {
        const ta = a.querySelector('.card-title')?.textContent?.toLowerCase() || '';
        const tb = b.querySelector('.card-title')?.textContent?.toLowerCase() || '';
        if (ta < tb) return this.isAscending ? -1 : 1;
        if (ta > tb) return this.isAscending ? 1 : -1;
        return 0;
      });
      if (!this.dom.grid) return;
      this.dom.grid.innerHTML = '';
      const frag = document.createDocumentFragment();
      sorted.forEach(n => frag.appendChild(n));
      this.dom.grid.appendChild(frag);
      this.dom.cards = sorted;
    }

    apply(skipSort = false) {
      if (!skipSort) {
        // Keep existing order unless A–Z changed
      }

      let visible = 0;
      const search = this.search;
      const category = (this.category || 'all').toLowerCase();

      this.dom.cards.forEach(card => {
        const cardCat = (card.dataset.category || '').toLowerCase();
        const catOk = category === 'all' || cardCat === category;
        const text = (
          (card.querySelector('.card-title')?.textContent || '') + ' ' +
          (card.querySelector('.excerpt')?.textContent || '')
        ).toLowerCase();
        const searchOk = !search || text.includes(search);
        const show = catOk && searchOk;
        card.style.display = show ? 'flex' : 'none';
        card.classList.toggle('visible', show);
        if (show) visible++;
      });

      if (this.dom.emptyState && this.dom.grid) {
        if (visible === 0) {
          this.dom.emptyState.classList.remove('hidden');
          this.dom.grid.style.display = 'none';
        } else {
          this.dom.emptyState.classList.add('hidden');
          this.dom.grid.style.display = this.dom.grid.classList.contains('list-view') ? 'block' : 'grid';
        }
      }

      if (this.dom.aria) this.dom.aria.textContent = `${visible} posts shown`;
    }
  }

  // Simple appear animation
  function observeFadeUp() {
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          o.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.animate-fade-up').forEach(el => obs.observe(el));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const dom = new DOMRefs();
    const filters = new BlogFilter(dom);
    // Build category filters dynamically from posts
    filters.buildCategoryFilters();
    // After building, re-attach listeners against the fresh buttons
    filters.attach();
    filters.updateStats();
    filters.apply();
    observeFadeUp();
    console.log('📰 Blog Hub initialized');
  });
})();


