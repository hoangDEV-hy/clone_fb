const suggestionActions = {
    async addFriend(userId) {
        try {
            const result = await apiService.sendFriendRequest(userId);

            if (result.success) {
                toastService.success('Đã gửi lời mời kết bạn');
                uiService.updateAddFriendButton(userId);
            } else {
                toastService.error('Không thể gửi lời mời kết bạn');
            }
        } catch (error) {
            console.error('Error adding friend:', error);
            toastService.error('Đã có lỗi xảy ra');
        }
    },

    removeSuggestion(userId) {
        uiService.removeSuggestionCard(userId, () => {
            scrollService.updateButtons();
        });
    }
};