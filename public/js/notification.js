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
    generate_notification(message, title = "Thông báo", type) {
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
            ${message}
        </div>
    `;

        container.appendChild(toast);

        toast.addEventListener('click', () => {
            console.log("it runned")
            if (type === "invited_joinChat") {
                notification.handler_InvitedNotification();
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
    handler_InvitedNotification() {

        const overlay = document.getElementById("overlayConfirm");
        if (overlay) overlay.style.display = "flex";
        const h1 = document.createElement('h1')
        h1.textContent = 'it runed'

        document.querySelector('[data-role="notification"]').appendChild(h1)

        document.getElementById("btnCancelConfirm").onclick = function () {
            document.getElementById("overlayConfirm").style.display = "none";
        }

        document.getElementById("btnOkConfirm").onclick = function () {
            document.getElementById("overlayConfirm").style.display = "none";
            alert("Đã đồng ý");
        }
    }
}
export default notification
