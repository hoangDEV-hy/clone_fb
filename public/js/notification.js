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
    },
    generate_notification(chat_memberValue, title = "Thông báo", type) {
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
            ${chat_memberValue.content}
        </div>
    `;

        container.appendChild(toast);

        toast.addEventListener('click', () => {
            if (type === "invited_joinChat") {
                notification.handler_InvitedNotification(chat_memberValue, chat_memberValue.id);
                toast.remove();
            } else {
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

        document.querySelector('[data-role="notification"]').appendChild(h1)
        document.getElementById("btnCancelConfirm").onclick = async function () {
            document.getElementById("overlayConfirm").style.display = "none";
            let response_delete_chat_member = await fetch('/mess/chat_room/people', {
                method: 'DELETE',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(chat_memberValue)
            });
        }

        document.getElementById("btnOkConfirm").onclick = async function () {
            document.getElementById("overlayConfirm").style.display = "none";
            alert("Đã đồng ý");
            let response_chat_member = await fetch('/mess/chat_room/people', {
                method: 'PATCH',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(chat_memberValue)
            });

            let response_delete_notification = await fetch('/notification/chat_member', {
                method: 'DELETE',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ notificationId })
            });
        }
    }
}
export default notification
