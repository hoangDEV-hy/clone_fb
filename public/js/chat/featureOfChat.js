import loadHandleConfig_chat from "./loadHandleConfig_chat.js";
const featureOfChat = {
    send_mes: (id_user, receiver_id, socket) => {
        const typeMes = document.querySelector('[data-role="typeMes"]');
        const emojiPicker = document.querySelector('emoji-picker');
        const voiceAction = document.querySelector('[data-role="voiceAction"]')
        const chatContent = document.querySelector('[data-role="contentChat"]');
        const upload_img = document.querySelector('[data-role="upload_img"]');
        typeMes.addEventListener('change', () => {
            if (typeMes.value === 'emoji') {
                emojiPicker.style.display = 'block';
            } else if (typeMes.value === 'voice') {
                voiceAction.style.display = 'block';
            } else if (typeMes.value === 'picture') {
                upload_img.style.display = 'block';
            }
        });
        emojiPicker.addEventListener('emoji-click', (e) => {
            chatContent.value += e.detail.unicode;
        });
        // for setting up voice
        let start_buton = voiceAction.querySelector("[data-role='start_voice']");
        let end_buton = voiceAction.querySelector("[data-role='end_voice']");
        let audioObjectArray = [];
        let mediaRecorder;
        let imgData;
        let audioData;

        // Bắt đầu ghi âm
        start_buton.onclick = async () => {
            try {
                //config recording

                // Lấy luồng âm thanh từ micro
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioObjectArray = [];

                // Khi có dữ liệu âm thanh mới
                mediaRecorder.ondataavailable = (event) => {
                    audioObjectArray.push(event.data);
                };

                // Khi dừng ghi âm
                mediaRecorder.onstop = () => {
                    // Tạo blob âm thanh từ dữ liệu thu được
                    audioData = new Blob(audioObjectArray, { type: "audio/webm" });
                    const replay_voice = voiceAction.querySelector("[data-role='replay_voice']");
                    replay_voice.src = URL.createObjectURL(audioData);

                    // Tạo nút xoá audio
                    const destroy = document.createElement("button");
                    destroy.textContent = "Xoá";
                    destroy.onclick = () => {
                        replay_voice.pause();
                        if (replay_voice.src) URL.revokeObjectURL(replay_voice.src);

                        // Xoá dữ liệu trong thẻ audio (nhưng KHÔNG xoá thẻ)
                        replay_voice.removeAttribute("src");
                        replay_voice.load();
                        destroy.remove();
                    }
                    replay_voice.insertAdjacentElement("afterend", destroy);
                };

                // Bắt đầu ghi âm
                mediaRecorder.start();
                start_buton.disabled = true;
                end_buton.disabled = false;

            } catch (err) {
                console.error("❌ Không thể truy cập micro:", err);
                alert("Không thể bật micro. Hãy kiểm tra quyền truy cập!");
            }
        };

        // Dừng ghi âm
        end_buton.onclick = () => {
            if (mediaRecorder && mediaRecorder.state === "recording") {
                mediaRecorder.stop();
            }
            start_buton.disabled = false;
            end_buton.disabled = true;
        };
        //for uploading a picture
        upload_img.addEventListener('change', () => {

            const file = upload_img.files[0]; // get selected file
            if (!file) return;

            imgData = new FileReader();

            imgData.onload = (e) => {
                // Tạo wrapper chứa ảnh + nút xoá
                const wrapper = document.createElement('div');
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.gap = '10px';
                wrapper.style.marginTop = '10px';

                const preview_img = document.createElement('img');
                const destroy = document.createElement('button');
                preview_img.dataset.role = 'preview_img';
                preview_img.src = e.target.result;
                preview_img.style.maxWidth = "120px";
                preview_img.style.borderRadius = "4px";
                preview_img.style.border = "1px solid #ccc";

                destroy.textContent = "Xoá";
                destroy.dataset.role = 'destroy';
                destroy.style.padding = "5px 10px";
                destroy.style.cursor = "pointer";

                // Gắn vào wrapper
                wrapper.appendChild(preview_img);
                wrapper.appendChild(destroy);

                // Gắn wrapper vào ngay sau textarea chatContent
                chatContent.insertAdjacentElement('afterend', wrapper);

                // Delete button
                destroy.onclick = () => {
                    preview_img.remove();
                    destroy.remove();
                };
            };

            imgData.readAsDataURL(file); // 🔹 this triggers the onload
        });
        //for sending message
        document.querySelector('[data-role="send_mes"]').addEventListener('click', () => {
            let sent_data = new FormData();

            if (imgData) {
                let fileImg = upload_img.files[0];
                sent_data.append('img', fileImg);
            }

            if (audioData) {
                let fileAudio = new File([audioData], `voice-${Date.now()}.webm`, { type: "audio/webm" });
                sent_data.append('audio', fileAudio);
            }

            fetch('/upload/data', {
                method: "POST",
                body: sent_data
            })
                .then(res => res.json())
                .then(data => {
                    const chatId = document.querySelector('[data-role="head_chatId"]').value;
                    const author = id_user;
                    const send_mesData = {
                        text: chatContent.value,
                        img: data.imgUrl,
                        voice: data.voiceUrl
                    };
                    // Gửi dữ liệu qua socket
                    socket.emit('send_mes', send_mesData, chatId, author, receiver_id);
                    //cleaning interface preview of message
                    if (send_mesData.img) {
                        document.querySelector('[data-role="preview_img"]').remove();
                        document.querySelector('[data-role="destroy"]').remove();
                    }
                    if (send_mesData.voice) {
                        const replay_voice = voiceAction.querySelector("[data-role='replay_voice']");
                        replay_voice.removeAttribute("src");
                        replay_voice.load();
                        audioData = undefined;
                    }
                    chatContent.value = "";
                })
                .catch(err => console.error('Lỗi upload:', err));
        });
        // Ẩn emoji picker khi click ra ngoài
        document.addEventListener('click', (e) => {
            if (!emojiPicker.contains(e.target) && e.target !== typeMes && e.target !== chatContent) {
                emojiPicker.style.display = 'none';
            }
            if (!voiceAction.contains(e.target) && e.target !== typeMes && e.target !== chatContent) {
                voiceAction.style.display = 'none';
            }
            if (!upload_img.contains(e.target) && e.target !== typeMes && e.target !== chatContent) {
                upload_img.style.display = 'none';
            }
        });
    },
    del_mes: async (e, contain_myChat, selecter_messages) => {
        if (!selecter_messages) selecter_messages = new Set();


        let messages = contain_myChat.querySelectorAll('[data-role="message"]');


        messages.forEach(e => {
            let chat_id = e.dataset.messageId;
            // Chỉ gắn nếu chưa có attribute đánh dấu
            if (!e.dataset.listenerAttached) {
                e.addEventListener('click', () => {
                    if (!selecter_messages) return; // bảo vệ khi cancel
                    if (selecter_messages.has(chat_id)) {
                        selecter_messages.delete(chat_id);
                        e.classList.remove('selected');
                    } else {
                        selecter_messages.add(chat_id);
                        e.classList.add('selected');
                    }
                });

                // Đánh dấu là đã gắn listener
                e.dataset.listenerAttached = "true";
            };
        })


        if (e.target.value === 'submit') {
            let send_data = new FormData();
            const delArray = [...selecter_messages];

            send_data.append("del_mesData", JSON.stringify(delArray));

            try {
                const response = await fetch('/mess/del', {
                    method: 'POST',
                    body: send_data
                });

                const result = await response.json();
                if (result.result == 'success') {
                    selecter_messages.forEach((msgId) => {
                        const remove_divMess = contain_myChat.querySelector(
                            `[data-role="message"][data-message-id="${msgId}"]`
                        );
                        if (remove_divMess) remove_divMess.remove();
                    });
                    selecter_messages = undefined;
                } else {
                    alert("Failed to delete messages");
                }
            } catch (error) {
                console.error(error);
                alert("Fail to delete (network or server error)");
            }
        }
        if (e.target.value === 'cancel') {

            let messages = contain_myChat.querySelectorAll('[data-role="message"]');


            messages.forEach(e => {
                e.classList.remove('selected')
            });

            selecter_messages = undefined;
        }
        return selecter_messages;
    },
    edit_nickName: (id_user, chatState) => {
        let chatHead = document.querySelector('[data-role="chatHead"]');
        chatState.head_name.contentEditable = "true";

        let submit = document.createElement('button');
        submit.innerText = 'submit';
        submit.dataset.role = 'submit_button';
        chatHead.appendChild(submit);

        submit.addEventListener('click', async () => {
            await loadHandleConfig_chat.install_configChat(false, chatState.chat_id, chatState.head_name, id_user);
            submit.remove();
        })
    },
    select_members: (myIframe, nameContainIframe) => {
        const iframe = document.getElementById(myIframe);
        iframe.url =
            document.querySelector(nameContainIframe).style.display = "block";
    }
}
export default featureOfChat