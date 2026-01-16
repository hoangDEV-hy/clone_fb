const suggestionsController = {
    suggestions: [],
    mutualFriendsCache: {},
    currentUserId: null,
    container: null,

    async init(userId) {
        this.currentUserId = userId;
        this.container = document.getElementById('suggestionsScroll');

        if (!this.container) {
            console.error('Suggestions container not found');
            return;
        }

        await this.loadSuggestions();
    },

    async loadSuggestions() {
        try {
            const result = await apiService.getSuggestions(10, 'all');

            if (result.success) {
                this.suggestions = result.data.users;
                this.renderSuggestions();

                // Preload mutual friends count
                this.suggestions.forEach(user => {
                    this.loadMutualFriendsCount(user.id);
                });

                scrollService.updateButtons();
            } else {
                uiService.showError(this.container, 'Không thể tải gợi ý kết bạn');
            }
        } catch (error) {
            console.error('Error loading suggestions:', error);
            uiService.showError(this.container, 'Đã có lỗi xảy ra');
        }
    },

    renderSuggestions() {
        this.container.innerHTML = this.suggestions
            .map(user => uiService.renderSuggestionCard(user))
            .join('');
    },

    async loadMutualFriendsCount(targetUserId) {
        try {
            const result = await apiService.getMutualFriends(targetUserId, 3, 'all');

            if (result.success) {
                this.mutualFriendsCache[targetUserId] = result.data;
                uiService.updateMutualFriendsText(
                    targetUserId,
                    result.data.total,
                    (userId) => this.showMutualFriends(userId)
                );
            }
        } catch (error) {
            console.error('Error loading mutual friends count:', error);
        }
    },

    async showMutualFriends(targetUserId) {
        const user = this.suggestions.find(u => u.id === targetUserId);
        if (!user) return;

        modalService.setTitle(`Bạn chung với ${user.name}`);
        modalService.showLoading();
        modalService.show();

        try {
            const result = await apiService.getMutualFriends(targetUserId, 50, 'all');

            if (result.success && result.data.users.length > 0) {
                const html = result.data.users
                    .map(friend => uiService.renderMutualFriendItem(friend))
                    .join('');
                modalService.setContent(html);
            } else {
                modalService.setContent('<div class="loading">Không có bạn chung</div>');
            }
        } catch (error) {
            console.error('Error loading mutual friends:', error);
            modalService.setContent('<div class="error">Không thể tải danh sách bạn chung</div>');
        }
    }
};