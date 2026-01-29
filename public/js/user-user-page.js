// User User (Friend Management) Page Logic
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', async (e) => {
        // Toggle more actions
        if (e.target.classList.contains('toggle-more-btn')) {
            e.preventDefault();
            e.stopPropagation();

            const card = e.target.closest('.friend-card');
            if (!card) return;

            const more = card.querySelector('.more-actions');
            if (!more) return;

            if (more.classList.contains('visible')) {
                more.classList.remove('visible');
                more.classList.add('hidden');
            } else {
                more.classList.remove('hidden');
                more.classList.add('visible');
            }
        }

        // Accept friend request
        if (e.target.classList.contains('accept-friend-btn')) {
            e.preventDefault();
            e.stopPropagation();

            const card = e.target.closest('.friend-card');
            if (!card) return;

            const userId = card.dataset.userId;
            if (!userId) return;

            if (!confirm('Bạn có chắc muốn chấp nhận lời mời kết bạn?')) return;

            if (e.target.dataset.processing === 'true') return;
            e.target.dataset.processing = 'true';
            e.target.disabled = true;
            const originalText = e.target.textContent;
            e.target.textContent = 'Đang xử lý...';

            try {
                const response = await fetch('/page_manager/friends/accept', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_userB: userId,
                        notification_value: {
                            id: null,
                            selectedIdChatRoom: null,
                            selectedSenderId: null,
                            receiver_id: userId,
                            content: `chấp nhận lời mời kết bạn`,
                            type: 'static'
                        }
                    })
                });

                if (response.ok) {
                    alert('Chấp nhận lời mời thành công!');
                    window.location.reload();
                } else {
                    const error = await response.json();
                    alert(error.message || 'Chấp nhận thất bại');
                    e.target.dataset.processing = 'false';
                    e.target.disabled = false;
                    e.target.textContent = originalText;
                }
            } catch (err) {
                console.error('Error accepting friend:', err);
                alert('Lỗi kết nối server');
                e.target.dataset.processing = 'false';
                e.target.disabled = false;
                e.target.textContent = originalText;
            }
        }

        // Remove friend
        if (e.target.classList.contains('remove-friend-btn')) {
            e.preventDefault();
            e.stopPropagation();

            const card = e.target.closest('.friend-card');
            if (!card) return;

            const userId = card.dataset.userId;
            if (!userId) return;

            const currentPath = window.location.pathname;

            if (!confirm('Bạn có chắc muốn xoá bạn bè này?')) return;

            if (e.target.dataset.processing === 'true') return;
            e.target.dataset.processing = 'true';
            e.target.disabled = true;
            const originalText = e.target.textContent;
            e.target.textContent = 'Đang xử lý...';

            try {
                let response;

                if (currentPath.includes('/joined')) {
                    response = await fetch('/page_manager/friends/joined', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id_userB: userId })
                    });
                } else if (currentPath.includes('/waited')) {
                    response = await fetch('/page_manager/friends/waited', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id_userB: userId,
                            notification_value: {
                                id: null,
                                selectedIdChatRoom: null,
                                selectedSenderId: null,
                                receiver_id: userId,
                                content: `huỷ lời mời kết bạn`,
                                type: 'static'
                            }
                        })
                    });
                }

                if (response && response.ok) {
                    card.remove();
                    alert('Xoá thành công!');
                } else {
                    const error = await response.json();
                    alert(error.message || 'Xoá thất bại');
                    e.target.dataset.processing = 'false';
                    e.target.disabled = false;
                    e.target.textContent = originalText;
                }
            } catch (err) {
                console.error('Error removing friend:', err);
                alert('Lỗi kết nối server');
                e.target.dataset.processing = 'false';
                e.target.disabled = false;
                e.target.textContent = originalText;
            }
        }
    });
});
