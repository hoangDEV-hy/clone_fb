// main.js - Main application logic (đã tách navbar logic)
import handle_image from '/js/support/handle_image.js';
import interactions from '/js/interactions/run_interactionFunctions.js';
import loadHandleConfig_chat from '/js/chat/loadHandleConfig_chat.js';
import featureOfChat from '/js/chat/featureOfChat.js';
import notification from '/js/Notification/notification.js';
import NotificationCenter from '/js/Notification/NotificationCenter.js';
import follow from '/js/Follow.js';
import reloadMain from '/js/ReloadMain.js';

// Expose ra global để HTML onclick dùng được
window.NotificationCenter = NotificationCenter;

document.addEventListener('DOMContentLoaded', async () => {
    // Xử lý ảnh base64 từ hidden input
    handle_image('.bd_ct_news_title', '.image_src_img', '.image_src_input');

    // Lấy user ID
    const id_user = window.CURRENT_USER_ID;
    console.log('id_user', id_user)

    // Khởi tạo biến cho interactions
    let data_load;
    const nameCheckInput = '.like-checkbox';
    const nameContainIframe = '.bd_ct_news_cmd_tuongTac_pop';
    let change_like = {};
    let add_commends = [];
    let deleted_commends = [];
    let update_commends = [];

    interactions(change_like, id_user, nameContainIframe, data_load, add_commends, deleted_commends, update_commends);

    // ========== SOCKET.IO CONNECTION ==========
    let socket = io();
    socket.onAny((event, ...args) => {
        console.log('📡 received event:', event, args);
    });

    // ========== INITIALIZE NAVBAR CONTROLLER ==========
    // Navbar controller sẽ xử lý notification socket events
    if (window.NavbarController) {
        await window.NavbarController.init(socket, notification);
    }

    // ========== CHAT BOX ==========
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

    // Handle chat functions
    handle_functions(socket, chatState, id_user)
        .then(updatedChatState => { })
        .catch(err => console.error("Error:", err));

    // Reload messages from server
    const containChat = document.querySelector('[data-role="contain_chat"]');
    const myChat = containChat.querySelector('[data-role="contain_myChat"]');
    const otherChat = containChat.querySelector('[data-role="contain_otherChat"]');

    socket.on('receive_mes', (data) => {
        if (String(data[0].chatID) !== chatState.chat_id.value) {
            console.log('notification');
            return;
        }
        loadHandleConfig_chat.handleChatData(data, myChat, otherChat, chatState.receiver_id);
    });

    // ========== CHAT FEATURES ==========
    const chatHead = document.querySelector('[data-role="chatHead"]');
    const head_option = chatHead.querySelector('[data-role="head_option"]');
    let selecter_messages;

    head_option.addEventListener('change', async (e) => {
        let contain_myChat = document.querySelector('[data-role="contain_myChat"]');
        const value = e.target.value;

        if (['delete', 'submit', 'cancel'].includes(value)) {
            selecter_messages = await featureOfChat.del_mes(e, contain_myChat, selecter_messages);
        }

        if (e.target.value === 'edit_nickName') {
            featureOfChat.edit_nickName(id_user, chatState);
        }

        if (e.target.value === 'select_members') {
            featureOfChat.select_members(myIframe, nameContainIframe);
        }
    });

    // Event click list room
    document.querySelectorAll('[data-role="myRoom"]').forEach(el => {
        el.addEventListener('click', (e) => {
            console.log(e.target.textContent.trim());
        });
    });

    // Event add member to chat
    document.querySelector('[data-role="add_member"]').addEventListener('click', () => {
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

    // ========== POST MENU FOLLOW/UNFOLLOW ==========
    document.addEventListener('click', async (e) => {
        // Mở menu khi click nút 3 chấm
        if (e.target.classList.contains('post-menu-btn')) {
            e.stopPropagation();

            const targetUserId = e.target.dataset.userId;
            const menu = e.target.nextElementSibling;
            const followBtn = menu.querySelector('.follow-toggle-btn');

            // Đóng tất cả menu khác
            document.querySelectorAll('.post-menu').forEach(m => m.style.display = 'none');

            // Mở menu hiện tại
            menu.style.display = 'block';

            // Kiểm tra trạng thái follow
            await follow.checkAndUpdateFollowStatus(followBtn, id_user, targetUserId);
            return;
        }

        // Toggle Follow/Unfollow
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

        // Ẩn bài viết
        if (e.target.classList.contains('hide-post-btn')) {
            const postId = e.target.dataset.postId;
            follow.handleHidePost(postId);
            return;
        }

        // Báo cáo
        if (e.target.classList.contains('report-post-btn')) {
            const postId = e.target.dataset.postId;
            follow.handleReport(postId);
            return;
        }

        // Click ra ngoài → đóng menu
        document.querySelectorAll('.post-menu').forEach(m => m.style.display = 'none');
    });

    // ========== INITIALIZATION ==========
    window.addEventListener('load', async () => {
        NotificationCenter.init(id_user, 1);
        await reloadMain(id_user);
    });

    document.querySelector('.logo').addEventListener('click', async () => {
        await reloadMain(id_user);
    });

    // ========== PAGINATION ==========
    document.getElementById('loadMoreBtn').addEventListener('click', () => {
        let nextCursor = "{{cursor}}";
        console.log('nextCursor', nextCursor);
        const params = new URLSearchParams();
        params.append('limit', 10);

        if (nextCursor) {
            params.append('cursor', nextCursor);
        }

        window.location.href = `/main?${params.toString()}`;
    });
});

// ========== FRIEND SUGGESTIONS ==========
async function initFriendSuggestions() {
    const userInput = document.querySelector('.my_profile input');
    if (!userInput) {
        console.error('User input not found');
        return;
    }

    const userId = userInput.value;
    if (!userId) {
        console.error('User ID not found');
        return;
    }

    // Initialize animations
    toastService.addAnimations();

    // Initialize services
    modalService.init();
    scrollService.init('suggestionsScroll', 'prevBtn', 'nextBtn');

    // Initialize controller and load suggestions
    await suggestionsController.init(userId);
}

// Auto initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFriendSuggestions);
} else {
    initFriendSuggestions();
}