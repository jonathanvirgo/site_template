// Blog Pro Theme JS
(function () {
    'use strict';

    // Dark mode toggle
    const toggle = document.querySelector('.theme-toggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    function getTheme() {
        return localStorage.getItem('theme') || (prefersDark.matches ? 'dark' : 'light');
    }

    setTheme(getTheme());

    if (toggle) {
        toggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            setTheme(current === 'dark' ? 'light' : 'dark');
        });
    }

    console.log('📝 Blog Pro theme loaded');
})();
