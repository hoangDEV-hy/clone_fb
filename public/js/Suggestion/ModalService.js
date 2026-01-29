const modalService = {
    modal: null,
    modalBody: null,
    modalTitle: null,
    closeBtn: null,

    init() {
        this.modal = document.getElementById('mutualFriendsModal');
        this.modalBody = document.getElementById('modalBody');
        this.modalTitle = document.getElementById('modalTitle');
        this.closeBtn = document.getElementById('closeModal');

        if (!this.modal || !this.modalBody || !this.modalTitle || !this.closeBtn) {
            console.error('Modal elements not found');
            return;
        }

        this.setupEventListeners();
    },

    setupEventListeners() {
        this.closeBtn.addEventListener('click', () => this.hide());

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });
    },

    show() {
        if (this.modal) {
            this.modal.classList.add('active');
        }
    },

    hide() {
        if (this.modal) {
            this.modal.classList.remove('active');
        }
    },

    setTitle(title) {
        if (this.modalTitle) {
            this.modalTitle.textContent = title;
        }
    },

    setContent(html) {
        if (this.modalBody) {
            this.modalBody.innerHTML = html;
        }
    },

    showLoading() {
        this.setContent('<div class="loading">Đang tải...</div>');
    }
};

// Expose to window for module access
window.modalService = modalService;