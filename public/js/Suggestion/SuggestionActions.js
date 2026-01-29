const suggestionActions = {
    async addFriend(userId) {
        try {
            const result = await window.apiService.sendFriendRequest(userId);

            if (result.success) {
                window.toastService.success('Đã gửi lời mời kết bạn');
                window.uiService.updateAddFriendButton(userId);
            } else {
                window.toastService.error('Không thể gửi lời mời kết bạn');
            }
        } catch (error) {
            console.error('Error adding friend:', error);
            window.toastService.error('Đã có lỗi xảy ra');
        }
    },

    removeSuggestion(userId) {
        window.uiService.removeSuggestionCard(userId, () => {
            window.scrollService.updateButtons();
        });
    }
};

// Expose to window for module access
window.suggestionActions = suggestionActions;