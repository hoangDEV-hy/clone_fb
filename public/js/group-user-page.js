// Group User Management Page Logic
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('create-group-modal');
    const createGroupBtn = document.getElementById('create-group-btn');
    const cancelCreateBtn = document.getElementById('cancel-create-btn');
    const createGroupForm = document.getElementById('create-group-form');

    // Mở modal tạo nhóm
    if (createGroupBtn) {
        createGroupBtn.addEventListener('click', () => {
            if (modal) modal.classList.add('active');
        });
    }

    // Đóng modal
    if (cancelCreateBtn) {
        cancelCreateBtn.addEventListener('click', () => {
            if (modal) modal.classList.remove('active');
            if (createGroupForm) createGroupForm.reset();
        });
    }

    // Đóng modal khi click bên ngoài
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                if (createGroupForm) createGroupForm.reset();
            }
        });
    }

    // Xử lý tạo nhóm
    if (createGroupForm) {
        createGroupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('group-name');
            const hashtagInput = document.getElementById('group-hashtag');

            if (!nameInput) return;

            const name = nameInput.value.trim();
            const hastag = hashtagInput ? hashtagInput.value.trim() : '';

            if (!name) {
                alert('Vui lòng nhập tên nhóm');
                return;
            }

            const submitBtn = createGroupForm.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.textContent : 'Tạo nhóm';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Đang tạo...';
            }

            try {
                const response = await fetch('/page_manager/group_user/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, hastag })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    alert('Tạo nhóm thành công!');
                    if (modal) modal.classList.remove('active');
                    if (createGroupForm) createGroupForm.reset();
                    window.location.reload();
                } else {
                    alert(data.message || 'Tạo nhóm thất bại');
                }
            } catch (err) {
                console.error('Error creating group:', err);
                alert('Lỗi kết nối server');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        });
    }

    // Xử lý các sự kiện click
    document.addEventListener('click', async (e) => {
        // Toggle more actions
        if (e.target.classList.contains('toggle-more-btn')) {
            e.preventDefault();
            e.stopPropagation();

            const card = e.target.closest('.group-card');
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

        // Hủy yêu cầu tham gia
        if (e.target.classList.contains('cancel-request-btn')) {
            e.preventDefault();
            e.stopPropagation();

            const card = e.target.closest('.group-card');
            if (!card) return;

            const groupId = card.dataset.groupId;
            if (!groupId) return;

            if (!confirm('Bạn có chắc muốn hủy yêu cầu tham gia nhóm?')) return;

            if (e.target.dataset.processing === 'true') return;
            e.target.dataset.processing = 'true';
            e.target.disabled = true;
            const originalText = e.target.textContent;
            e.target.textContent = 'Đang xử lý...';

            try {
                // Lấy userId từ hidden input hoặc từ server context
                const userIdInput = document.querySelector('input[data-user-id]');
                const userId = userIdInput ? userIdInput.value : null;

                if (!userId) {
                    alert('Không tìm thấy thông tin người dùng');
                    e.target.dataset.processing = 'false';
                    e.target.disabled = false;
                    e.target.textContent = originalText;
                    return;
                }

                const response = await fetch('/page_manager/group_user/reject', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_group: parseInt(groupId),
                        id_user: userId,
                        notification_value: {
                            id: null,
                            selectedIdChatRoom: null,
                            selectedSenderId: null,
                            receiver_id: null,
                            content: `đã hủy yêu cầu tham gia nhóm`,
                            type: 'static'
                        }
                    })
                });

                if (response.ok) {
                    alert('Hủy yêu cầu thành công!');
                    card.remove();
                } else {
                    const error = await response.json();
                    alert(error.message || 'Hủy yêu cầu thất bại');
                    e.target.dataset.processing = 'false';
                    e.target.disabled = false;
                    e.target.textContent = originalText;
                }
            } catch (err) {
                console.error('Error canceling request:', err);
                alert('Lỗi kết nối server');
                e.target.dataset.processing = 'false';
                e.target.disabled = false;
                e.target.textContent = originalText;
            }
        }

        // Rời nhóm
        if (e.target.classList.contains('leave-group-btn')) {
            e.preventDefault();
            e.stopPropagation();

            const card = e.target.closest('.group-card');
            if (!card) return;

            const groupId = card.dataset.groupId;
            if (!groupId) return;

            if (!confirm('Bạn có chắc muốn rời khỏi nhóm này?')) return;

            if (e.target.dataset.processing === 'true') return;
            e.target.dataset.processing = 'true';
            e.target.disabled = true;
            const originalText = e.target.textContent;
            e.target.textContent = 'Đang xử lý...';

            try {
                const response = await fetch('/page_manager/group_user/leave', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_group: parseInt(groupId) })
                });

                if (response.ok) {
                    alert('Rời nhóm thành công!');
                    card.remove();
                } else {
                    const error = await response.json();
                    alert(error.message || 'Rời nhóm thất bại');
                    e.target.dataset.processing = 'false';
                    e.target.disabled = false;
                    e.target.textContent = originalText;
                }
            } catch (err) {
                console.error('Error leaving group:', err);
                alert('Lỗi kết nối server');
                e.target.dataset.processing = 'false';
                e.target.disabled = false;
                e.target.textContent = originalText;
            }
        }
    });
});
