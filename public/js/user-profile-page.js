// User Profile Page Logic
import handle_image from '/js/support/handle_image.js';
import functionInteractions from '/js/interactions/functionInteractions.js';

// ============ EDIT TOGGLE MODULE ============
const EditToggle = {
    isEditMode: false,

    init() {
        const toggleBtn = document.getElementById('toggleEditBtn');
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', () => {
            this.toggleEditMode();
        });
    },

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        const editSections = document.querySelectorAll('.edit-section');
        const toggleBtn = document.getElementById('toggleEditBtn');
        const userInfoInputs = document.querySelectorAll('.user-info-input');

        // Toggle hiển thị các section ẩn
        editSections.forEach(section => {
            if (this.isEditMode) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        // Toggle khả năng chỉnh sửa input
        userInfoInputs.forEach(input => {
            if (this.isEditMode) {
                input.classList.add('editable');
                input.removeAttribute('readonly');
            } else {
                input.classList.remove('editable');
                input.setAttribute('readonly', 'readonly');
            }
        });

        // Cập nhật text button
        if (toggleBtn) {
            toggleBtn.textContent = this.isEditMode ? 'Hủy chỉnh sửa' : 'Chỉnh sửa trang cá nhân';
        }
    }
};

// ============ FRIEND MANAGEMENT MODULE ============
const FriendManager = {
    currentUserId: null,
    profileUserId: null,
    friendshipStatus: null,

    async init() {
        this.profileUserId = document.getElementById('profile_user_id')?.value;

        // Nếu không phải xem profile của người khác thì ẩn button
        if (!this.profileUserId) {
            return;
        }

        await this.checkFriendship();
        this.attachEventListener();
    },

    async checkFriendship() {
        try {
            const response = await fetch('/page_manager/friends/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_userB: this.profileUserId
                })
            });

            const result = await response.json();

            if (result.success) {
                this.friendshipStatus = result.data;
                this.updateButtonUI();
            }
        } catch (error) {
            console.error('Error checking friendship:', error);
            this.showError('Không thể kiểm tra trạng thái bạn bè');
        }
    },

    updateButtonUI() {
        const btn = document.getElementById('friendActionBtn');
        if (!btn) return;

        btn.style.display = 'inline-block';
        btn.disabled = false;

        // Tùy thuộc vào trạng thái friendship
        if (this.friendshipStatus?.isFriend) {
            btn.textContent = 'Xóa bạn bè';
            btn.classList.add('btn-remove-friend');
            btn.classList.remove('btn-add-friend');
        } else if (this.friendshipStatus?.isPending) {
            btn.textContent = 'Đã gửi lời mời';
            btn.disabled = true;
            btn.classList.add('btn-pending');
        } else {
            btn.textContent = 'Kết bạn';
            btn.classList.add('btn-add-friend');
            btn.classList.remove('btn-remove-friend');
        }
    },

    attachEventListener() {
        const btn = document.getElementById('friendActionBtn');
        if (!btn) return;

        btn.addEventListener('click', async (e) => {
            e.preventDefault();

            if (btn.disabled) return;

            btn.disabled = true;
            const originalText = btn.textContent;
            btn.textContent = 'Đang xử lý...';

            try {
                if (this.friendshipStatus?.isFriend) {
                    await this.removeFriend();
                } else {
                    await this.addFriend();
                }
            } catch (error) {
                console.error('Error:', error);
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    },

    async addFriend() {
        try {
            const response = await fetch('/page_manager/friends', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_userB: this.profileUserId,
                    notification_value: {
                        id: null,
                        selectedIdChatRoom: null,
                        selectedSenderId: null,
                        receiver_id: this.profileUserId,
                        content: `gửi lời mời kết bạn đến ${this.profileUserId}`,
                        type: 'static'
                    }
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Đã gửi lời mời kết bạn');
                await this.checkFriendship();
            } else {
                this.showError(result.message || 'Không thể gửi lời mời kết bạn');
                const btn = document.getElementById('friendActionBtn');
                btn.disabled = false;
                this.updateButtonUI();
            }
        } catch (error) {
            console.error('Error adding friend:', error);
            this.showError('Đã xảy ra lỗi khi gửi lời mời');
            throw error;
        }
    },

    async removeFriend() {
        if (!confirm('Bạn có chắc muốn xóa bạn bè này?')) {
            const btn = document.getElementById('friendActionBtn');
            btn.disabled = false;
            this.updateButtonUI();
            return;
        }

        try {
            const response = await fetch('/joined', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_userB: this.profileUserId
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Đã xóa bạn bè');
                await this.checkFriendship();
            } else {
                this.showError(result.message || 'Không thể xóa bạn bè');
                const btn = document.getElementById('friendActionBtn');
                btn.disabled = false;
                this.updateButtonUI();
            }
        } catch (error) {
            console.error('Error removing friend:', error);
            this.showError('Đã xảy ra lỗi khi xóa bạn bè');
            throw error;
        }
    },

    showSuccess(message) {
        alert(message);
    },

    showError(message) {
        alert(message);
    }
};

// ============ MAIN INITIALIZATION ============
document.addEventListener('DOMContentLoaded', async () => {
    handle_image('.bd_ct_news_title', '.image_src_img', '.image_src_input');

    // Initialize Edit Toggle
    EditToggle.init();

    // Initialize Friend Management
    await FriendManager.init();

    // Sorting
    const sortSelect = document.querySelector('.body select[name="sort"]');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            const userId = document.getElementById('profile_user_id')?.value || '';
            const sort = sortSelect.value;
            if (sort) {
                const url = `/page_manager/user/sort?sort=${sort}&selectedTargetId=${userId}`;
                window.location.href = url;
            }
        });
    }

    // Get user ID
    const id_user = document.getElementById('profile_user_id')?.value || '';

    // Variables for interactions
    let data_load;
    const nameCheckInput = '.like-checkbox';
    const nameContainIframe = '.bd_ct_news_cmd_tuongTac_pop';
    let change_like = {};
    let add_commends = [];
    let deleted_commends = [];
    let update_commends = [];

    // Change like
    document.querySelectorAll('.like-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            change_like = functionInteractions.change_like(e, change_like, id_user);
        });
    });

    // Send comments
    const commendButtons = document.querySelectorAll('.bd_ct_news_commend_tuongTac [name="commend"]');
    commendButtons.forEach(button => {
        button.addEventListener('click', async e => {
            functionInteractions.send_commends(e, nameContainIframe, "myIframe", 'form[action="/page_manager/user/upload/thumbnail"] img', id_user, data_load);
        });
    });

    // Handle iframe data
    window.addEventListener('message', e => {
        if (!e.data || e.data.type !== 'interactions_an_Post_Data') return;

        functionInteractions.hander_dataIframe(
            e,
            add_commends,
            deleted_commends,
            update_commends,
            nameContainIframe,
            change_like,
            id_user,
            (newData) => {
                deleted_commends = newData.deleted_commends;
                update_commends = newData.update_commends;
                change_like = newData.change_like;
                add_commends = newData.add_commends;
            }
        );
    });

    // Save to DB
    window.addEventListener("pagehide", () => {
        functionInteractions.save_toDb(deleted_commends, add_commends, update_commends, change_like);
    });

    // Load interactions
    (async () => {
        const id_Post_load = await functionInteractions.take_idInteractionPost('.news', 'input[name="news"]');
        data_load = await functionInteractions.load_interactionPost(id_Post_load, id_user);
        await functionInteractions.set_like(data_load);
    })();
});
