// Back button behavior
document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('back-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const themeSwitch = themeToggle?.closest('.theme-switch');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (document.referrer && document.referrer.indexOf(location.host) !== -1) {
                history.back();
            } else {
                window.location.href = '../index.html';
            }
        });
    }

    // Dynamic year
    const yearSpan = document.getElementById('copyright-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear().toString() + ' © ';
    }

    // Theme adoption from hub (reads stored preference)
    const root = document.documentElement;
    let saved = null;
    try {
        saved = localStorage.getItem('et-theme');
    } catch (e) {
        // localStorage may be blocked; fall back to default
    }
    if (saved === 'dark') {
        root.setAttribute('data-theme', 'dark');
    }

    if (themeToggle && themeSwitch) {
        const isDark = root.getAttribute('data-theme') === 'dark';
        themeToggle.checked = isDark;
        themeSwitch.setAttribute('aria-checked', String(isDark));
        const thumbIcon = themeSwitch.querySelector('.switch-thumb i');
        if (thumbIcon) {
            thumbIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }

        themeToggle.addEventListener('change', () => {
            const checked = themeToggle.checked;
            themeSwitch.setAttribute('aria-checked', String(checked));
            if (checked) {
                root.setAttribute('data-theme', 'dark');
                try { localStorage.setItem('et-theme', 'dark'); } catch (e) {}
                if (thumbIcon) thumbIcon.className = 'fas fa-sun';
            } else {
                root.removeAttribute('data-theme');
                try { localStorage.setItem('et-theme', 'light'); } catch (e) {}
                if (thumbIcon) thumbIcon.className = 'fas fa-moon';
            }
        });
    }
});



