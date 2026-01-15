const notification = {
    define: () => {
        const toastTrigger = document.getElementById('liveToastBtn')
        const toastLiveExample = document.getElementById('liveToast')

        if (toastTrigger) {
            const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample)
            toastTrigger.addEventListener('click', () => {
                toastBootstrap.show()
            })
        }
        console.log("define notification runned")
    },
    generate_notification(data, title = "Thông báo", type) {
        console.log('data', data)
        const container = document.getElementById("toast-container");

        let toast = document.createElement('div');
        toast.className = "toast";
        toast.setAttribute("role", "alert");
        toast.setAttribute("aria-live", "assertive");
        toast.setAttribute("aria-atomic", "true");
        toast.dataset.toastType = type;

        toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">${title}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${data.content}
        </div>
    `;

        container.appendChild(toast);

        toast.addEventListener('click', () => {
            if (type === "invited_joinChat") {
                notification.handler_InvitedNotification(chat_memberValue, chat_memberValue.id);
                toast.remove();
            }
            else {
                console.log("không tồn tại");
            }
        });

        const btToast = new bootstrap.Toast(toast);
        btToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        })
    },
    handler_InvitedNotification(chat_memberValue, notificationId) {

        const overlay = document.getElementById("overlayConfirm");
        if (overlay) overlay.style.display = "flex";
        const h1 = document.createElement('h1')
        h1.textContent = 'it runed'

        document.querySelector('[data-role="notification"]').appendChild(h1);

        // Send the notification to the admin
        const selectedValueNotificationAdmin = {
            selectedSenderId: chat_memberValue.receiver_id,
            receiver_id: chat_memberValue.selectedSenderId,
            content: ""
        };
        // send the notification to the chat room
        // let selectedValueNotificationChat = {
        //     selectedSenderId: chat_memberValue.receiver_id,
        //     receiver_id: chat_memberValue.chat_id,
        //     content: `New ${chat_memberValue.receiver_id} joined this room`
        // };
        console.log('chat_memberValue', chat_memberValue)
        console.log('selectedValueNotificationAdmin', selectedValueNotificationAdmin)

        document.getElementById("btnCancelConfirm").onclick = async function () {
            document.getElementById("overlayConfirm").style.display = "none";

            try {
                const response_delete_chat_member = await fetch('/mess/chat_room/people', {
                    method: 'DELETE',
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(chat_memberValue)
                });

                if (!response_delete_chat_member.ok) {
                    const errorData = await response_delete_chat_member.json();
                    throw new Error(errorData.error || 'Delete chat member failed');
                }

                const data = await response_delete_chat_member.json();

                if (data.success) {
                    console.log('Xóa chat member thành công:', data.result);
                    alert('Huỷ thành công');
                } else {
                    console.error('Server trả success=false:', data.error);
                    alert('Huỷ không thành công');
                }
                // Send the notification to the admin
                selectedValueNotificationAdmin.content = `${selectedValueNotificationAdmin.receiver_id} canceled the invitation to join`;
                notification.sendValueNotificationAdmin(selectedValueNotificationAdmin);

            } catch (error) {
                console.error('DELETE CHAT MEMBER ERROR:', error);
                alert('Huỷ không thành công');
            }

        }

        document.getElementById("btnOkConfirm").onclick = async function () {
            document.getElementById("overlayConfirm").style.display = "none";
            alert("Đã đồng ý");
            try {
                const response_chat_member = await fetch('/mess/chat_room/people', {
                    method: 'PATCH',
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(chat_memberValue)
                });

                if (!response_chat_member.ok) {
                    const errorData = await response_chat_member.json();
                    throw new Error(errorData.error || 'Update chat member failed');
                }

                const data = await response_chat_member.json();

                if (data.success) {
                    console.log('Update thành công:', data.result);
                } else {
                    console.error('Server trả success=false:', data.error);
                }
                try {
                    const response_delete_notification = await fetch('/notification/chat_members', {
                        method: 'DELETE',
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ notificationId })
                    });

                    if (!response_delete_notification.ok) {
                        const errorData = await response_delete_notification.json();
                        throw new Error(errorData.error || 'Delete notification failed');
                    }

                    const data = await response_delete_notification.json();

                    if (data.success) {
                        console.log('Xóa notification thành công');
                        alert('Vào nhóm thành công');
                        //send a notification to the chat-room
                        // console.log("The event has been triggered");
                        // socket.emit('joinChatRoom', selectedValueNotificationChat.receiver_id, selectedValueNotificationChat);

                    } else {
                        console.error('Server trả success=false:', data.error);
                        alert('Vào nhóm không thành công');
                    }

                } catch (error) {
                    console.error('DELETE NOTIFICATION ERROR:', error);
                    alert('Vào nhóm không thành công');
                }
                // Send the notification to the admin
                selectedValueNotificationAdmin.content =
                    `${selectedValueNotificationAdmin.receiver_id} accepted the invitation to join the group`;
                notification.sendValueNotificationAdmin(selectedValueNotificationAdmin);

            } catch (error) {
                console.error('CLIENT ERROR:', error);
            }



        }
    },
    async sendValueNotificationAdmin(selectedValueNotificationAdmin) {
        try {
            const selectedResponseSendingToAdmin = await fetch('/notification/admins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ selectedValueNotificationAdmin })
            });

            if (!selectedResponseSendingToAdmin.ok) {
                const errorData = await selectedResponseSendingToAdmin.json();
                throw new Error(errorData.message || 'Sending notification failed');
            }

            const data = await selectedResponseSendingToAdmin.json();

            if (data.success) {
                console.log('Notification sent successfully');
                alert('Joined the group successfully');
            } else {
                console.error('Server returned success = false:', data.message);
                alert('Joined the group failed');
            }

        } catch (error) {
            console.error('Notification sending error:', error);
            alert('Failed to join the group');
        }
    }
}

export default notification
