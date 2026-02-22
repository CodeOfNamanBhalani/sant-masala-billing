/**
 * Sant Masala - Main Application JS
 */

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
    }
}

// Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    const main = document.querySelector('.admin-main');
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        sidebar.classList.toggle('mobile-open');
        
        // Create or toggle overlay
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            overlay.onclick = closeSidebar;
            document.body.appendChild(overlay);
        }
        
        if (sidebar.classList.contains('mobile-open')) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    } else {
        sidebar.classList.toggle('collapsed');
    }
}

function closeSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar) {
        sidebar.classList.remove('mobile-open');
    }
    if (overlay) {
        overlay.classList.remove('active');
    }
    document.body.style.overflow = '';
}

// Toast Notifications
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} fade-in`;
    toast.innerHTML = `
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Modal Management
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Format Currency
function formatCurrency(amount, symbol = '₹') {
    return `${symbol}${parseFloat(amount).toFixed(2)}`;
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Loading Overlay
function showLoading() {
    let overlay = document.querySelector('.loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Confirm Dialog
function confirmAction(message) {
    return new Promise((resolve) => {
        if (confirm(message)) {
            resolve(true);
        } else {
            resolve(false);
        }
    });
}

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

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updatePageTranslations();
    
    // Language button handlers
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setLanguage(btn.dataset.lang);
        });
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape to close modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
});

// Cart item update logic
function updateCartItemInput(productId, unit, pricePerKg) {
    const input = document.querySelector(`.cart-input[data-product-id="${productId}"]`);
    const priceSpan = document.querySelector(`.cart-item-price[data-product-id="${productId}"]`);
    if (!input || !priceSpan) return;
    input.addEventListener('input', function() {
        let value = parseFloat(this.value) || 0;
        let price = 0;
        if (unit === 'kg' && pricePerKg) {
            price = pricePerKg * value;
        } else if (unit === 'g' && pricePerKg) {
            price = pricePerKg * (value / 1000);
        } else {
            // piece logic (unchanged)
            price = pricePerKg * value;
        }
        priceSpan.textContent = formatCurrency(price);
        // Optionally update cart total here
    });
}

// Cart item input event logic
function bindCartInputs() {
    document.querySelectorAll('.cart-input').forEach(input => {
        input.addEventListener('input', function() {
            const productId = this.dataset.productId;
            const unit = this.dataset.unit;
            const pricePerKg = parseFloat(this.dataset.pricePerKg) || 0;
            let value = parseFloat(this.value) || 0;
            let price = 0;
            if (unit === 'kg') {
                price = pricePerKg * value;
            } else if (unit === 'g') {
                price = pricePerKg * (value / 1000);
            } else {
                price = pricePerKg * value;
            }
            const priceSpan = document.querySelector(`.cart-item-price[data-product-id="${productId}"]`);
            if (priceSpan) priceSpan.textContent = formatCurrency(price);
            // Optionally update cart total here
        });
    });
}

// Call this after cart is rendered
bindCartInputs();
