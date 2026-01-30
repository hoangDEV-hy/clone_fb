import handle_image from '/js/support/handle_image.js';
import interactions from '/js/interactions/run_interactionFunctions.js';
import loadHandleConfig_chat from '/js/chat/loadHandleConfig_chat.js';
import featureOfChat from '/js/chat/featureOfChat.js';
import notification from '/js/Notification/notification.js';
import NotificationCenter from '/js/Notification/NotificationCenter.js';
import follow from '/js/Follow.js';
import reloadMain from '/js/ReloadMain.js';

// expose ra global để HTML onclick dùng được
window.NotificationCenter = NotificationCenter;

document.addEventListener('DOMContentLoaded', async () => {
    // xử lý ảnh base64 từ hidden input
    handle_image('.bd_ct_news_title', '.image_src_img', '.image_src_input');

    const profileInput = document.querySelector('.navbar-profile input, .my_profile input');
    if (!profileInput) {
        console.error('Không tìm thấy input user id cho trang main');
        return;
    }

    const id_user = profileInput.value;

    //for load_Posts, set_like
    let data_load;
    const nameCheckInput = '.like-checkbox';
    const nameContainIframe = '.bd_ct_news_cmd_tuongTac_pop';
    let change_like = {};
    let add_commends = [];
    let deleted_commends = [];
    let update_commends = [];

    interactions(change_like, id_user, nameContainIframe, data_load, add_commends, deleted_commends, update_commends);

    // ===== SOCKET IO & CHAT =====
    let socket = io({
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
    });

    socket.onAny((eventName, ...args) => {
        console.log('📤 Event nhận từ server', eventName, args);
    });

    socket.emit('register', id_user);

    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    let notificationShown = false;

    function showNotification(message, type = 'info') {
        const el = document.createElement('div');
        el.className = `notification ${type}`;
        el.textContent = message;
        el.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            border-radius: 5px;
            z-index: 9999;
        `;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }

    socket.on('connect', () => {
        reconnectAttempts = 0;
        notificationShown = false;
        showNotification('Đã kết nối đến server', 'success');
    });

    socket.on('disconnect', (reason) => {
        console.log('Mất kết nối:', reason);
        showNotification('Mất kết nối với server', 'error');

        if (reason === 'io server disconnect') {
            setTimeout(() => {
                window.location.href = './404.html';
            }, 2000);
        }
    });

    socket.on('connect_error', () => {
        reconnectAttempts++;

        if (!notificationShown) {
            showNotification(`Đang thử kết nối lại... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`, 'error');
            notificationShown = true;
        }

        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            showNotification('Không thể kết nối đến server. Chuyển hướng...', 'error');
            setTimeout(() => {
                window.location.href = './404.html';
            }, 2000);
        }
    });

    socket.on('reconnect_failed', () => {
        showNotification('Kết nối thất bại. Chuyển hướng...', 'error');
        setTimeout(() => {
            window.location.href = '/404.html';
        }, 2000);
    });

    let chatState = {
        receiver_id: null,
        head_name: null,
        chat_id: null
    };

    async function handle_functions(socket, chatState, id_user) {
        chatState = await loadHandleConfig_chat.load_chat(socket, id_user, chatState);
        featureOfChat.send_mes(id_user, chatState.receiver_id, socket);
        return chatState;
    }

    socket.on('badge_increment', (badge_increment) => {
        const badge = document.getElementById('unreadBadge');
        if (!badge) return;

        const current = parseInt(badge.textContent || '0', 10);
        const newCount = current + badge_increment;

        NotificationCenter.updateUnreadBadge(newCount);
    });

    handle_functions(socket, chatState, id_user).catch(err => console.error("Error:", err));

    const containChat = document.querySelector('[data-role="contain_chat"]');
    if (containChat) {
        const myChat = containChat.querySelector('[data-role="contain_myChat"]');
        const otherChat = containChat.querySelector('[data-role="contain_otherChat"]');
        socket.on('receive_mes', (data) => {
            if (String(data[0].chatID) !== chatState.chat_id.value) {
                console.log('notification');
                return;
            }
            loadHandleConfig_chat.handleChatData(data, myChat, otherChat, chatState.receiver_id);
        });
    }

    // Xử lý head_option - đặt event listener trên document để đảm bảo hoạt động khi chatBox được hiển thị
    let selecter_messages;
    document.addEventListener('change', async (e) => {
        // Kiểm tra cả getAttribute và dataset để đảm bảo tương thích
        const dataRole = e.target.getAttribute('data-role') || e.target.dataset?.role;
        if (dataRole !== 'head_option') return;
        
        const head_option = e.target;
        // Query lại container mỗi lần để đảm bảo lấy được container mới nhất
        const containChat = document.querySelector('[data-role="contain_chat"]');
        let contain_myChat = containChat ? containChat.querySelector('[data-role="contain_myChat"]') : null;
        const value = head_option.value;
        
        // Bỏ qua nếu giá trị rỗng hoặc giá trị mặc định
        if (!value || value === '' || value === '----------') {
            return;
        }
        
        // Reset select về giá trị mặc định sau khi xử lý
        const resetSelect = () => {
            // Reset ngay lập tức để đảm bảo event change được trigger khi chọn lại
            head_option.selectedIndex = 0;
        };
        
        try {
            if (value === 'delete') {
                // Bật chế độ chọn tin nhắn để xoá
                selecter_messages = await featureOfChat.del_mes('delete', contain_myChat, selecter_messages);
                resetSelect();
            } else if (value === 'submit') {
                // Gửi yêu cầu xoá các tin nhắn đã chọn
                selecter_messages = await featureOfChat.del_mes('submit', contain_myChat, selecter_messages);
                resetSelect();
            } else if (value === 'cancel') {
                // Huỷ chế độ chọn tin nhắn
                selecter_messages = await featureOfChat.del_mes('cancel', contain_myChat, selecter_messages);
                resetSelect();
            } else if (value === 'edit_nickName') {
                featureOfChat.edit_nickName(id_user, chatState);
                resetSelect();
            }
        } catch (error) {
            console.error('Error handling head_option:', error);
            resetSelect();
        }
    });

    notification.define();
    socket.on('create_notification', (data, callback) => {
        if (data) {
            if (data.type === "invited_joinChat") {
                notification.generate_notification(data, "Thông báo", "invited_joinChat", socket);
            }
            else if (data.type === "static") {
                notification.generate_notification(data, "Thông báo", "static", socket);
            }
        } else {
            console.log('khong ton tai data.content');
            if (callback && typeof callback === 'function') {
                callback({ received: false });
            }
        }
    });

    document.querySelectorAll('[data-role="myRoom"]').forEach(el => {
        el.addEventListener('click', (e) => {
            console.log(e.target.textContent.trim());
        });
    });

    const addMemberBtn = document.querySelector('[data-role="add_member"]');
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', () => {
            const iframe = document.getElementById('myIframe');
            iframe.src = '/mess/chat_room/people';
            document.querySelector(nameContainIframe).style.display = "block";
            let chat_roomUserId = {
                chat_roomId: chatState.chat_id.value,
                idUser: id_user
            };
            iframe.onload = () => {
                iframe.contentWindow.postMessage(chat_roomUserId, window.location.origin);
            };
            let close_buttonIframe = document.createElement('button');
            close_buttonIframe.addEventListener('click', () => {
                document.querySelector(nameContainIframe).style.display = "none";
            });
            document.querySelector(nameContainIframe).appendChild(close_buttonIframe);
        });
    }

    // ================= MENU / NOTIFICATION =================
    const menus = document.querySelectorAll('.menu');
    const menuButtons = document.querySelectorAll('.menu-btn');

    function closeAllMenus() {
        menus.forEach(menu => menu.classList.remove('active'));
    }

    menuButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();

            const className = btn.dataset.menu;
            if (!className) return;

            const menu = document.querySelector(`.${className}`);
            if (!menu) return;

            const isOpen = menu.classList.contains('active');

            closeAllMenus();

            if (!isOpen) {
                menu.classList.add('active');

                if (className === 'thongBao') {
                    NotificationCenter.loadNotifications(id_user, 1);
                }
            }
        });
    });

    menus.forEach(menu => {
        menu.addEventListener('click', (e) => {
            // Không chặn bubbling đối với post-menu để các handler
            // document-level (follow-toggle-btn, hide-post-btn, report-post-btn)
            // vẫn bắt được sự kiện click
            if (!menu.classList.contains('post-menu')) {
                e.stopPropagation();
            }
        });
    });

    document.addEventListener('click', () => {
        closeAllMenus();
    });

    // ========== XỬ LÝ MENU 3 CHẤM VỚI FOLLOW ĐỘNG ==========
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('post-menu-btn')) {
            e.stopPropagation();

            const targetUserId = e.target.dataset.userId;
            const menu = e.target.nextElementSibling;
            const followBtn = menu.querySelector('.follow-toggle-btn');

            document.querySelectorAll('.post-menu').forEach(m => m.style.display = 'none');

            menu.style.display = 'block';

            await follow.checkAndUpdateFollowStatus(followBtn, id_user, targetUserId);
            return;
        }

        if (e.target.classList.contains('follow-toggle-btn')) {
            e.stopPropagation();
            const targetUserId = e.target.dataset.userId;
            const currentStatus = e.target.dataset.status;

            if (currentStatus === 'following') {
                await follow.handleUnfollow(e.target, id_user, targetUserId);
            } else if (currentStatus === 'not-following') {
                await follow.handleFollow(e.target, id_user, targetUserId);
            }
            return;
        }

        if (e.target.classList.contains('hide-post-btn')) {
            const postId = e.target.dataset.postId;
            follow.handleHidePost(postId);
            return;
        }

        if (e.target.classList.contains('report-post-btn')) {
            const postId = e.target.dataset.postId;
            follow.handleReport(postId);
            return;
        }

        document.querySelectorAll('.post-menu').forEach(m => m.style.display = 'none');
    });

    window.addEventListener('load', async () => {
        NotificationCenter.init(id_user, 1);
        await reloadMain(id_user);
    });

    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', async () => {
            await reloadMain(id_user);
        });
    }

    // phân trang bài viết (cursor được render ra DOM thông qua data-cursor)
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            const params = new URLSearchParams();
            params.append('limit', 10);

            const cursorValue = loadMoreBtn.dataset.cursor;
            if (cursorValue) {
                params.append('cursor', cursorValue);
            }

            window.location.href = `/main?${params.toString()}`;
        });
    }

    // Friend suggestions init
    if (window.toastService && window.modalService && window.scrollService && window.suggestionsController) {
        async function initFriendSuggestions() {
            const userInput = profileInput;
            if (!userInput) {
                console.error('User input not found');
                return;
            }

            const userId = userInput.value;
            if (!userId) {
                console.error('User ID not found');
                return;
            }

            window.toastService.addAnimations();
            window.modalService.init();
            window.scrollService.init('suggestionsScroll', 'prevBtn', 'nextBtn');
            await window.suggestionsController.init(userId);
        }

        initFriendSuggestions().catch(console.error);
    } else {
        console.warn('Friend suggestions services not loaded. Check if all suggestion scripts are loaded.');
    }
}
);

