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
    generate_notification(message, title = "Thông báo") {
        const container = document.getElementById("toast-container");

        let toast = document.createElement('div');
        toast.className = "toast";
        toast.setAttribute("role", "alert");
        toast.setAttribute("aria-live", "assertive");
        toast.setAttribute("aria-atomic", "true");

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

        const btToast = new bootstrap.Toast(toast);
        btToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        })
    }
}
export default notification
