/**
 * Secret Admin Access Handler
 * Click the ITI logo 7 times to access admin panel
 */

(function () {
    'use strict';

    const ADMIN_URL = 'admin/index.html';
    const LOGO_CLICK_COUNT = 7;
    const CLICK_TIMEOUT = 3000;

    let logoClickCount = 0;
    let logoClickTimeout = null;

    /**
     * Navigate to admin page with animation
     */
    function goToAdmin() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        overlay.innerHTML = `
            <div style="text-align: center; color: white;">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16" style="margin-bottom: 16px; animation: pulse 1s infinite;">
                    <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm.256 7a4.474 4.474 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10c.26 0 .507.009.74.025.226-.341.496-.65.804-.918C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4s1 1 1 1h5.256Zm3.63-4.54c.18-.613 1.048-.613 1.229 0l.043.148a.64.64 0 0 0 .921.382l.136-.074c.561-.306 1.175.308.87.869l-.075.136a.64.64 0 0 0 .382.92l.149.045c.612.18.612 1.048 0 1.229l-.15.043a.64.64 0 0 0-.38.921l.074.136c.305.561-.309 1.175-.87.87l-.136-.075a.64.64 0 0 0-.92.382l-.045.149c-.18.612-1.048.612-1.229 0l-.043-.15a.64.64 0 0 0-.921-.38l-.136.074c-.561.305-1.175-.309-.87-.87l.075-.136a.64.64 0 0 0-.382-.92l-.148-.045c-.613-.18-.613-1.048 0-1.229l.148-.043a.64.64 0 0 0 .382-.921l-.074-.136c-.306-.561.308-1.175.869-.87l.136.075a.64.64 0 0 0 .92-.382l.045-.148ZM14 12.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z"/>
                </svg>
                <p style="font-size: 1.25rem; font-weight: 600; margin: 0;">Accessing Admin Panel...</p>
            </div>
            <style>
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }
            </style>
        `;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.style.opacity = '1');

        setTimeout(() => {
            const currentPath = window.location.pathname;
            let adminPath = ADMIN_URL;

            if (currentPath.includes('/submit/') ||
                currentPath.includes('/edit/') ||
                currentPath.includes('/about/')) {
                adminPath = '../' + ADMIN_URL;
            }

            window.location.href = adminPath;
        }, 500);
    }

    /**
     * Initialize logo click handler
     */
    function init() {
        const logo = document.querySelector('.navbar-brand img');
        if (!logo) return;

        // Add shake animation style
        const style = document.createElement('style');
        style.textContent = `
            @keyframes logoShake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-3px); }
                75% { transform: translateX(3px); }
            }
        `;
        document.head.appendChild(style);

        logo.addEventListener('click', (e) => {
            logoClickCount++;

            if (logoClickTimeout) clearTimeout(logoClickTimeout);

            // Visual feedback after 3 clicks
            if (logoClickCount > 3) {
                logo.style.animation = 'none';
                logo.offsetHeight;
                logo.style.animation = 'logoShake 0.3s ease';
            }

            // Activate on 7 clicks
            if (logoClickCount >= LOGO_CLICK_COUNT) {
                e.preventDefault();
                e.stopPropagation();
                logoClickCount = 0;
                goToAdmin();
                return;
            }

            // Reset after timeout
            logoClickTimeout = setTimeout(() => {
                logoClickCount = 0;
            }, CLICK_TIMEOUT);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
