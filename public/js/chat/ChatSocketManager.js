// ChatSocketManager.js - Quản lý tất cả socket events cho chat system

class ChatSocketManager {
    constructor(socket, userId) {
        this.socket = socket;
        this.userId = userId;
        this.chatState = {
            receiver_id: null,
            head_name: null,
            chat_id: null,
            currentChatRoom: null
        };
        this.selectedMessages = new Set();
        this.setupSocketListeners();
    }

    // ========== SOCKET LISTENERS ==========
    setupSocketListeners() {
        // Nhận tin nhắn mới
        this.socket.on('receive_message', (data) => this.handleReceiveMessage(data));

        // Tin nhắn bị xóa
        this.socket.on('message_deleted', (data) => this.handleMessageDeleted(data));

        // Thành viên được thêm vào
        this.socket.on('member_added', (data) => this.handleMemberAdded(data));

        // Thành viên bị xóa
        this.socket.on('member_removed', (data) => this.handleMemberRemoved(data));

        // Config được cập nhật
        this.socket.on('config_updated', (data) => this.handleConfigUpdated(data));

        // Chat type converted
        this.socket.on('chat_type_converted', (data) => this.handleChatTypeConverted(data));

        // Admin transferred
        this.socket.on('admin_transferred', (data) => this.handleAdminTransferred(data));

        // Typing indicators
        this.socket.on('user_typing', (data) => this.handleUserTyping(data));
        this.socket.on('user_stopped_typing', (data) => this.handleUserStoppedTyping(data));

        // Notification for invitation
        this.socket.on('create_notification', (data, callback) => this.handleNotification(data, callback));
    }

    // ========== MESSAGE HANDLERS ==========

    /**
     * Xử lý nhận tin nhắn mới
     */
    handleReceiveMessage(data) {
        console.log('📨 Message received:', data);

        const chatBox = document.querySelector('[data-role="chatBox"]');
        const currentChatId = chatBox.querySelector('[data-role="head_chatId"]').value;

        // Chỉ hiển thị nếu tin nhắn thuộc chat hiện tại
        if (String(data.chatId) !== String(currentChatId)) {
            console.log('⚠️ Message for different chat');
            // Có thể hiển thị notification
            this.showNewMessageNotification(data);
            return;
        }

        const myChat = chatBox.querySelector('[data-role="contain_myChat"]');
        const otherChat = chatBox.querySelector('[data-role="contain_otherChat"]');

        this.appendMessage(data.message, myChat, otherChat);

        // Scroll to bottom
        const chatBody = chatBox.querySelector('.chat-body');
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    /**
     * Gửi tin nhắn
     */
    async sendMessage(content, type = 'text') {
        const chatBox = document.querySelector('[data-role="chatBox"]');
        const chatId = parseInt(chatBox.querySelector('[data-role="head_chatId"]').value);
        const receiverId = chatBox.querySelector('[data-role="head_receiverId"]').value;

        if (!chatId || !content) {
            console.error('Missing chatId or content');
            return;
        }

        console.log('📤 Sending message:', { chatId, content, type });

        this.socket.emit('send_message', chatId, this.userId, content, type);
    }

    /**
     * Gửi tin nhắn với file (image/audio)
     */
    async sendMessageWithFile(formData) {
        try {
            const response = await fetch('/upload/data', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            const chatBox = document.querySelector('[data-role="chatBox"]');
            const chatId = parseInt(chatBox.querySelector('[data-role="head_chatId"]').value);
            const textContent = chatBox.querySelector('[data-role="contentChat"]').value;

            // Send image
            if (data.imgUrl) {
                this.socket.emit('send_message', chatId, this.userId, data.imgUrl, 'image');
            }

            // Send voice
            if (data.voiceUrl) {
                this.socket.emit('send_message', chatId, this.userId, data.voiceUrl, 'file');
            }

            // Send text if any
            if (textContent.trim()) {
                this.socket.emit('send_message', chatId, this.userId, textContent, 'text');
            }

            // Clear input
            chatBox.querySelector('[data-role="contentChat"]').value = '';

            return data;
        } catch (err) {
            console.error('Error sending message with file:', err);
            throw err;
        }
    }

    /**
     * Xóa tin nhắn
     */
    deleteMessage(messageId) {
        const chatBox = document.querySelector('[data-role="chatBox"]');
        const chatId = parseInt(chatBox.querySelector('[data-role="head_chatId"]').value);

        console.log('🗑️ Deleting message:', messageId);

        this.socket.emit('delete_message', messageId, this.userId, chatId);
    }

    /**
     * Xử lý tin nhắn bị xóa
     */
    handleMessageDeleted(data) {
        console.log('🗑️ Message deleted:', data);

        const chatBox = document.querySelector('[data-role="chatBox"]');
        const messageElement = chatBox.querySelector(`[data-message-id="${data.messageId}"]`);

        if (messageElement) {
            messageElement.remove();
        }
    }

    /**
     * Toggle chọn tin nhắn để xóa
     */
    toggleSelectMessage(messageElement) {
        const messageId = messageElement.dataset.messageId;

        if (this.selectedMessages.has(messageId)) {
            this.selectedMessages.delete(messageId);
            messageElement.classList.remove('selected');
        } else {
            this.selectedMessages.add(messageId);
            messageElement.classList.add('selected');
        }
    }

    /**
     * Xóa các tin nhắn đã chọn
     */
    async deleteSelectedMessages() {
        const messageIds = Array.from(this.selectedMessages);

        if (messageIds.length === 0) {
            alert('Vui lòng chọn tin nhắn để xóa');
            return;
        }

        try {
            const response = await fetch('/chat/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messageIds })
            });

            const data = await response.json();

            if (data.success) {
                // Emit socket event for real-time update
                messageIds.forEach(id => this.deleteMessage(parseInt(id)));

                // Clear selection
                this.selectedMessages.clear();
                document.querySelectorAll('[data-role="message"].selected').forEach(el => {
                    el.classList.remove('selected');
                });
            }
        } catch (err) {
            console.error('Error deleting messages:', err);
            alert('Xóa tin nhắn thất bại');
        }
    }

    // ========== MEMBER HANDLERS ==========

    /**
     * Mời thành viên
     */
    inviteMembers(memberIds, notification) {
        console.log('👥 Inviting members:', memberIds);

        this.socket.emit('inviteMembers', memberIds, notification);
    }

    /**
     * Xử lý lời mời tham gia
     */
    handleInvitation(accept, chatId, adminId, memberIds, notification) {
        console.log('📨 Handling invitation:', { accept, chatId });

        this.socket.emit('handleInventMembers', accept, chatId, adminId, memberIds, notification);
    }

    /**
     * Xử lý thành viên được thêm
     */
    handleMemberAdded(data) {
        console.log('👥 Member added:', data);

        // Update UI if needed
        this.showNotification(`${data.newMembers.length} thành viên mới đã được thêm vào nhóm`);

        // Reload members list if viewing
        this.reloadMembersList(data.chatId);
    }

    /**
     * Xóa thành viên
     */
    removeMember(chatId, removedUserId, notification) {
        console.log('➖ Removing member:', removedUserId);

        this.socket.emit('remove_member', chatId, this.userId, removedUserId, notification);
    }

    /**
     * Xử lý thành viên bị xóa
     */
    handleMemberRemoved(data) {
        console.log('➖ Member removed:', data);

        this.showNotification(`Một thành viên đã rời khỏi nhóm`);

        // Reload members list
        this.reloadMembersList(data.chatId);
    }

    // ========== CONFIG HANDLERS ==========

    /**
     * Cập nhật config chat
     */
    updateConfig(chatId, configData) {
        console.log('⚙️ Updating config:', configData);

        this.socket.emit('update_config', chatId, this.userId, configData);
    }

    /**
     * Xử lý config được cập nhật
     */
    handleConfigUpdated(data) {
        console.log('⚙️ Config updated:', data);

        // Update UI based on config
        if (data.configData.nickName) {
            const chatBox = document.querySelector('[data-role="chatBox"]');
            const nameElement = chatBox.querySelector('[data-role="head_name"]');
            if (nameElement) {
                nameElement.textContent = data.configData.nickName;
            }
        }
    }

    /**
     * Đổi nickname
     */
    async changeNickname(chatId, newNickname) {
        try {
            const response = await fetch('/chat/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    author: this.userId,
                    name: newNickname
                })
            });

            const data = await response.json();

            if (data.success) {
                this.updateConfig(chatId, { nickName: newNickname });
            }

            return data;
        } catch (err) {
            console.error('Error changing nickname:', err);
            throw err;
        }
    }

    // ========== ADMIN HANDLERS ==========

    /**
     * Chuyển quyền admin
     */
    transferAdmin(chatId, newAdminId, notification) {
        console.log('👑 Transferring admin to:', newAdminId);

        this.socket.emit('transfer_admin', chatId, this.userId, newAdminId, notification);
    }

    /**
     * Xử lý chuyển quyền admin
     */
    handleAdminTransferred(data) {
        console.log('👑 Admin transferred:', data);

        this.showNotification('Quyền quản trị viên đã được chuyển');
    }

    // ========== TYPING INDICATORS ==========

    /**
     * Bắt đầu typing
     */
    startTyping(chatId) {
        this.socket.emit('typing_start', chatId, this.userId);
    }

    /**
     * Dừng typing
     */
    stopTyping(chatId) {
        this.socket.emit('typing_stop', chatId, this.userId);
    }

    /**
     * Xử lý user typing
     */
    handleUserTyping(data) {
        console.log('⌨️ User typing:', data.userId);

        const chatBox = document.querySelector('[data-role="chatBox"]');
        const currentChatId = chatBox.querySelector('[data-role="head_chatId"]').value;

        if (String(data.chatId) !== String(currentChatId)) {
            return;
        }

        // Show typing indicator
        this.showTypingIndicator(data.userId);
    }

    /**
     * Xử lý user stopped typing
     */
    handleUserStoppedTyping(data) {
        console.log('⌨️ User stopped typing:', data.userId);

        // Hide typing indicator
        this.hideTypingIndicator(data.userId);
    }

    // ========== CHAT ROOM HANDLERS ==========

    /**
     * Tham gia chat room
     */
    joinChatRoom(chatId) {
        console.log('🚪 Joining chat room:', chatId);

        if (this.chatState.currentChatRoom) {
            this.leaveChatRoom(this.chatState.currentChatRoom);
        }

        this.socket.emit('defaultJoinChatRoom', chatId);
        this.chatState.currentChatRoom = chatId;
    }

    /**
     * Rời khỏi chat room
     */
    leaveChatRoom(chatId) {
        console.log('🚪 Leaving chat room:', chatId);

        this.socket.emit('defaultLeaveChatRoom', chatId);
    }

    /**
     * Convert chat type
     */
    handleChatTypeConverted(data) {
        console.log('🔄 Chat type converted:', data);

        this.showNotification(`Nhóm chat đã được chuyển đổi sang ${data.newType}`);
    }

    // ========== NOTIFICATION HANDLERS ==========

    /**
     * Xử lý thông báo
     */
    handleNotification(data, callback) {
        if (!data) {
            if (callback) callback({ received: false });
            return;
        }

        console.log('🔔 Notification received:', data);

        // Import notification module if available
        if (window.notification) {
            window.notification.generate_notification(
                data,
                "Thông báo",
                data.type || "static",
                this.socket
            );
        }

        if (callback) callback({ received: true });
    }

    /**
     * Hiển thị notification tin nhắn mới
     */
    showNewMessageNotification(data) {
        // Show browser notification if permitted
        if (Notification.permission === 'granted') {
            new Notification('Tin nhắn mới', {
                body: data.message.content.substring(0, 50),
                icon: '/pictures/messenger-icon.png'
            });
        }
    }

    /**
     * Hiển thị notification trong UI
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'chat-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #242526;
            color: #e4e6eb;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ========== UI HELPERS ==========

    /**
     * Thêm tin nhắn vào UI
     */
    appendMessage(message, myChat, otherChat) {
        const parent = message.author === this.userId ? myChat : otherChat;

        const messageDiv = document.createElement('div');
        messageDiv.className = message.author === this.userId ? 'message my-message' : 'message other-message';
        messageDiv.dataset.role = 'message';
        messageDiv.dataset.messageId = message.id;

        let contentElement;

        if (message.type === 'image') {
            contentElement = document.createElement('img');
            contentElement.src = message.content;
            contentElement.style.maxWidth = '200px';
            contentElement.style.borderRadius = '8px';
        } else if (message.type === 'file') {
            contentElement = document.createElement('audio');
            contentElement.src = message.content;
            contentElement.controls = true;
            contentElement.style.maxWidth = '200px';
        } else {
            contentElement = document.createElement('div');
            contentElement.textContent = message.content;
        }

        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        timeElement.textContent = new Date(message.createdAt || Date.now()).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageDiv.appendChild(contentElement);
        messageDiv.appendChild(timeElement);
        parent.appendChild(messageDiv);
    }

    /**
     * Hiển thị typing indicator
     */
    showTypingIndicator(userId) {
        const chatBody = document.querySelector('.chat-body');

        // Remove existing indicator
        const existingIndicator = chatBody.querySelector('.typing-indicator');
        if (existingIndicator) return;

        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        indicator.style.cssText = `
            display: flex;
            gap: 4px;
            padding: 8px 12px;
            background: #3a3b3c;
            border-radius: 18px;
            width: fit-content;
            margin-bottom: 8px;
        `;

        indicator.querySelectorAll('span').forEach((span, i) => {
            span.style.cssText = `
                width: 8px;
                height: 8px;
                background: #b0b3b8;
                border-radius: 50%;
                animation: typing 1.4s infinite;
                animation-delay: ${i * 0.2}s;
            `;
        });

        chatBody.querySelector('[data-role="contain_otherChat"]').appendChild(indicator);
    }

    /**
     * Ẩn typing indicator
     */
    hideTypingIndicator(userId) {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) indicator.remove();
    }

    /**
     * Reload danh sách thành viên
     */
    async reloadMembersList(chatId) {
        // Implement if needed
        console.log('Reload members list for chat:', chatId);
    }
}

// Export
export default ChatSocketManager;