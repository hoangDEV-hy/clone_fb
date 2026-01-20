// navbar.js - Quản lý logic của navbar với Socket.io
const NavbarController = {
    menus: null,
    menuButtons: null,
    socket: null,
    userId: null,

    async init(socketInstance, notificationModule) {
        this.menus = document.querySelectorAll('.menu');
        this.menuButtons = document.querySelectorAll('.menu-btn');
        this.socket = socketInstance;
        this.notification = notificationModule;

        if (!this.menus.length || !this.menuButtons.length) {
            console.warn('Navbar elements not found');
            return;
        }

        // Lấy userId từ API
        await this.fetchUserId();

        // Setup event listeners
        this.setupEventListeners();

        // Setup socket listeners
        this.setupSocketListeners();

        // Initialize notifications
        this.initializeNotifications();
    },

    async fetchUserId() {
        try {
            const response = await fetch('/userId', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch userId');
            }

            const data = await response.json();
            this.userId = data.getedUsedId;
            console.log('Fetched userId:', this.userId);

            return this.userId;
        } catch (error) {
            console.error('Error fetching userId:', error);

            // Fallback: lấy từ input hidden
            const userInput = document.querySelector('.my_profile input[type="hidden"]');
            if (userInput) {
                this.userId = userInput.value;
                console.log('Using fallback userId:', this.userId);
            }

            return this.userId;
        }
    },

    setupEventListeners() {
        // Menu button clicks
        this.menuButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleMenuClick(btn);
            });
        });

        // Prevent menu close when clicking inside
        this.menus.forEach(menu => {
            menu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });

        // Close all menus when clicking outside
        document.addEventListener('click', () => {
            this.closeAllMenus();
        });
    },

    setupSocketListeners() {
        if (!this.socket) {
            console.warn('Socket instance not provided');
            return;
        }

        // Real-time badge increment
        this.socket.on('badge_increment', (badge_increment) => {
            console.log('badge_increment run:', badge_increment);
            const badge = document.getElementById('unreadBadge');
            if (!badge) return;

            const current = parseInt(badge.textContent || '0', 10);
            const newCount = current + badge_increment;

            this.updateUnreadBadge(newCount);

            // Also update NotificationCenter if available
            if (window.NotificationCenter && typeof window.NotificationCenter.updateUnreadBadge === 'function') {
                window.NotificationCenter.updateUnreadBadge(newCount);
            }
        });

        // Create notification
        this.socket.on('create_notification', (data, callback) => {
            if (!data) {
                console.log('không tồn tại data.content');
                if (callback && typeof callback === 'function') {
                    callback({ received: false });
                }
                return;
            }

            if (!this.notification) {
                console.warn('Notification module not provided');
                return;
            }

            // Handle different notification types
            if (data.type === "invited_joinChat") {
                this.notification.generate_notification(
                    data,
                    "Thông báo",
                    "invited_joinChat",
                    this.socket
                );
            } else if (data.type === "follow") {
                this.notification.generate_notification(
                    data,
                    "Thông báo",
                    "follow",
                    this.socket
                );
            }

            // Send callback confirmation
            if (callback && typeof callback === 'function') {
                callback({ received: true });
            }
        });
    },

    initializeNotifications() {
        if (!this.notification) {
            console.warn('Notification module not provided');
            return;
        }

        // Define notification templates
        this.notification.define();
    },

    handleMenuClick(btn) {
        const className = btn.dataset.menu;
        if (!className) return;

        const menu = document.querySelector(`.${className}`);
        if (!menu) return;

        const isOpen = menu.classList.contains('active');

        // Close all menus first
        this.closeAllMenus();

        // Toggle current menu
        if (!isOpen) {
            menu.classList.add('active');

            // Load notifications if opening notification menu
            if (className === 'thongBao') {
                this.loadNotifications();
            }
        }
    },

    closeAllMenus() {
        this.menus.forEach(menu => menu.classList.remove('active'));
    },

    loadNotifications() {
        if (!this.userId) {
            console.warn('User ID not available');
            return;
        }

        // Use NotificationCenter if available
        if (window.NotificationCenter && typeof window.NotificationCenter.loadNotifications === 'function') {
            window.NotificationCenter.loadNotifications(this.userId, 1);
        } else {
            console.warn('NotificationCenter not available');
        }
    },

    updateUnreadBadge(count) {
        const badge = document.getElementById('unreadBadge');
        if (!badge) return;

        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    },

    getUserId() {
        return this.userId;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavbarController;
}

// Make available globally
window.NavbarController = NavbarController;