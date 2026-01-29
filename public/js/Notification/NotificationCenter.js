const NotificationCenter = {
    notifications: [], // Lưu trữ notifications trong object

    // Hàm tải danh sách thông báo
    async loadNotifications(selectedUserId, page) {
        try {
            const response = await fetch('http://localhost:3000/notification/notificationcenter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    selectedUserID: selectedUserId,
                    page: page
                })
            });

            const data = await response.json();

            if (data.success) {
                this.notifications = data.result.list;
                this.displayNotifications(this.notifications);
                this.updateUnreadBadge(data.result.unreadCount);
            }
        } catch (error) {
            console.error('Lỗi khi tải thông báo:', error);
            const container = document.getElementById('notificationList');
            if (container) {
                container.innerHTML = '<li>Không thể tải thông báo</li>';
            }
        }
    },

    // Hàm hiển thị danh sách thông báo
    displayNotifications(list) {
        const container = document.getElementById('notificationList');

        if (!container) return;

        if (!list || list.length === 0) {
            container.innerHTML = '<div class="notification-empty">Không có thông báo mới</div>';
            return;
        }

        container.innerHTML = list.map(notif => `
            <div class="notification-card" data-id="${notif.id}">
                <div class="notification-content">
                    <div class="notification-text">${notif.content}</div>
                    <div class="notification-time">${this.formatTime(notif.createdAt)}</div>
                </div>
                <button class="notification-delete-btn" onclick="NotificationCenter.deleteNotification(${notif.id})" aria-label="Xóa thông báo">×</button>
            </div>
        `).join('');
    },

    // Hàm xóa thông báo
    async deleteNotification(id) {
        try {
            const response = await fetch('http://localhost:3000/notification/notification', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ notificationId: id })
            });

            const data = await response.json();

            if (data.success) {
                // Xóa khỏi mảng notifications
                this.notifications = this.notifications.filter(n => n.id !== id);
                this.displayNotifications(this.notifications);
                this.updateUnreadBadge(this.notifications.length);
            }
        } catch (error) {
            console.error('Lỗi khi xóa thông báo:', error);
        }
    },

    // Hàm cập nhật số lượng thông báo chưa đọc
    updateUnreadBadge(count) {
        const badge = document.getElementById('unreadBadge');
        if (!badge) return;

        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
            badge.style.color = 'red';
        } else {
            badge.style.display = 'none';
        }
    },

    // Hàm format thời gian
    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Vừa xong';
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        return `${days} ngày trước`;
    },

    // Khởi tạo
    init(selectedUserId, page) {
        this.loadNotifications(selectedUserId, page);

        // // Tự động reload mỗi 30 giây
        // setInterval(() => {
        //     this.loadNotifications();
        // }, 30000);
    }
};

export default NotificationCenter;