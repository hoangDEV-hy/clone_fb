const uiService = {
    renderSuggestionCard(user) {
        const firstLetter = user.name.charAt(0).toUpperCase();
        const avatarHtml = user.avatar
            ? `<img src="${user.avatar}" alt="${user.name}">`
            : `<div class="card-avatar-placeholder">${firstLetter}</div>`;

        return `
            <div class="suggestion-card" data-user-id="${user.id}">
                <div class="card-avatar">
                    ${avatarHtml}
                </div>
                <div class="card-info">
                    <div class="card-name">${user.name}</div>
                    <div class="mutual-friends">Đang tải...</div>
                    <div class="card-actions">
                        <button class="btn btn-primary" onclick="window.suggestionActions.addFriend('${user.id}')">
                            Thêm bạn bè
                        </button>
                        <button class="btn btn-secondary" onclick="window.suggestionActions.removeSuggestion('${user.id}')">
                            Gỡ
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    renderMutualFriendItem(friend) {
        const firstLetter = friend.name.charAt(0).toUpperCase();
        const avatarSrc = friend.avatar || '';

        return `
            <div class="mutual-friend-item">
                <img src="${avatarSrc}" 
                     alt="${friend.name}" 
                     class="mutual-friend-avatar"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                <div class="card-avatar-placeholder" style="display:none; width:60px; height:60px; border-radius:50%; font-size:24px;">
                    ${firstLetter}
                </div>
                <div class="mutual-friend-info">
                    <h4>${friend.name}</h4>
                </div>
            </div>
        `;
    },

    updateMutualFriendsText(userId, count, onClickCallback) {
        const card = document.querySelector(`[data-user-id="${userId}"]`);
        if (!card) return;

        const mutualElement = card.querySelector('.mutual-friends');
        if (count > 0) {
            mutualElement.textContent = `${count} bạn chung`;
            mutualElement.style.cursor = 'pointer';
            mutualElement.onclick = () => onClickCallback(userId);
        } else {
            mutualElement.textContent = 'Chưa có bạn chung';
        }
    },

    updateAddFriendButton(userId) {
        const card = document.querySelector(`[data-user-id="${userId}"]`);
        if (!card) return;

        const btn = card.querySelector('.btn-primary');
        if (btn) {
            btn.textContent = 'Đã gửi lời mời';
            btn.disabled = true;
            btn.style.opacity = '0.6';
        }
    },

    removeSuggestionCard(userId, onComplete) {
        const card = document.querySelector(`[data-user-id="${userId}"]`);
        if (!card) return;

        card.style.transition = 'opacity 0.3s, transform 0.3s';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.8)';

        setTimeout(() => {
            card.remove();
            if (onComplete) onComplete();
        }, 300);
    },

    showError(container, message) {
        container.innerHTML = `<div class="error">${message}</div>`;
    }
};

// Expose to window for module access
window.uiService = uiService;