const loadHandleConfig_chat = {
    load_chat: (socket, id_user, chatState) => {
        return new Promise((resolve, reject) => {
            const chatBox = document.querySelector('[data-role="chatBox"]');
            chatBox.querySelector('[data-role=head_close]').addEventListener('click', () => {
                chatBox.style.display = 'none';
            });

            const friend_chat = document.querySelector('[data-role="friendList"]');
            friend_chat.addEventListener('click', (e) => {
                const li = e.target.closest('li');
                if (!li) return;

                chatState.receiver_id = li.dataset.id;

                socket.emit('register', id_user);
                socket.emit("get_chatData", id_user, chatState.receiver_id, (data) => {
                    const containChat = document.querySelector('[data-role="contain_chat"]');
                    const chatHead = chatBox.querySelector('[data-role="chatHead"]');

                    chatState.head_name = chatHead.querySelector('[data-role="head_name"]');
                    chatState.head_name.textContent = li.querySelector('span').textContent;
                    chatHead.querySelector('img').src = li.querySelector('img').src;

                    const myChat = containChat.querySelector('[data-role="contain_myChat"]');
                    const otherChat = containChat.querySelector('[data-role="contain_otherChat"]');
                    chatState.chat_id = chatHead.querySelector('[data-role="head_chatId"]');

                    myChat.innerHTML = "";
                    otherChat.innerHTML = "";

                    if (Array.isArray(data.chat.data)) {
                        chatState.chat_id.value = data.chat.data[0].id;
                        socket.emit('defaultLeaveChatRoom', data.chat.data[0].id);
                        socket.emit('defaultJoinChatRoom', data.chat.data[0].id);
                        loadHandleConfig_chat.handleChatData(data.chat.data[0].contentsChat, myChat, otherChat, chatState.receiver_id);
                    } else {
                        chatState.chat_id.value = data.chatId;
                    }

                    loadHandleConfig_chat.install_configChat(true, chatState.chat_id, chatState.head_name, id_user);

                    chatBox.style.display = 'block';
                    //trả về data
                    resolve(chatState);
                });
            });
        });
    },
    handleChatData: (data, myChat, otherChat, receiver_id) => {
        if (!Array.isArray(data)) return;
        data.forEach((e) => {
            let parent;
            if (e.author === receiver_id) parent = otherChat;
            else {
                parent = myChat;
            }

            let message = document.createElement('div');
            message.dataset.role = 'message';
            message.dataset.messageId = e.id;
            let contentElement;
            let timeElement = document.createElement('div');
            timeElement.dataset.role = 'msg_time';
            timeElement.textContent = e.updatedAt;

            if (e.type === 'picture') {
                contentElement = document.createElement('img');
                contentElement.dataset.role = 'msg_content';
                contentElement.src = e.content; // e.content should be image URL
            } else if (e.type === 'voice') {
                contentElement = document.createElement('audio');
                contentElement.dataset.role = 'msg_content';
                contentElement.src = e.content; // e.content should be audio URL
                contentElement.controls = true;
            } else if (e.type === 'text') {
                contentElement = document.createElement('div');
                contentElement.dataset.role = 'msg_content';
                contentElement.textContent = e.content; // safer than innerHTML
            }
            message.appendChild(contentElement);
            message.appendChild(timeElement);
            parent.appendChild(message);

        })


    },
    install_configChat: async (loadOrIntall, chat_id, head_name, id_user) => {
        let body;
        if (!loadOrIntall) body = JSON.stringify({ "chat_id": chat_id.value, "author": id_user, "name": head_name.textContent })
        else body = JSON.stringify({ "chat_id": chat_id.value, "author": id_user })
        let respone = await fetch('/mess/config', {
            method: 'Post',
            headers: {
                "Content-Type": "application/json"
            },
            body: body
        })
        let data = await respone.json(); // ✅ parse JSON

        if (data.save_data?.nickName) {
            head_name.textContent = data.save_data.nickName;
        }
        head_name.contentEditable = "false";
    },
    reloading_mes: (socket, chat_id) => {

    }
}

export default loadHandleConfig_chat;