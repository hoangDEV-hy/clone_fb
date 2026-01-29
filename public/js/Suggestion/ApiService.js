const apiService = {
    baseURL: 'http://localhost:3000',

    async fetchWithAuth(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                }
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async getSuggestions(limit = 10, type = 'all') {
        const params = new URLSearchParams({ limit, type });
        return this.fetchWithAuth(`${this.baseURL}/mutualfriend?${params}`);
    },

    async getMutualFriends(targetUserId, limit = 50, type = 'all') {
        const params = new URLSearchParams({ targetUserId, limit, type });
        return this.fetchWithAuth(`${this.baseURL}/mutualfriend/friends?${params}`);
    },

    async sendFriendRequest(targetUserId) {
        return this.fetchWithAuth(`${this.baseURL}/page_manager/friends`, {
            method: 'POST',
            body: JSON.stringify({
                id_userB: targetUserId,
                notification_value: {
                    receiver_id: targetUserId,
                    content: "gửi lời mời kết bạn đến" + targetUserId,
                    type: "static"
                }
            })
        });
    }
};

// Expose to window for module access
window.apiService = apiService;