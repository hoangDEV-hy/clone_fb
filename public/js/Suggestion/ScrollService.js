const scrollService = {
    container: null,
    prevBtn: null,
    nextBtn: null,

    init(containerId, prevBtnId, nextBtnId) {
        this.container = document.getElementById(containerId);
        this.prevBtn = document.getElementById(prevBtnId);
        this.nextBtn = document.getElementById(nextBtnId);

        if (!this.container || !this.prevBtn || !this.nextBtn) {
            console.error('Scroll elements not found');
            return;
        }

        this.setupEventListeners();
        this.updateButtons();
    },

    setupEventListeners() {
        this.prevBtn.addEventListener('click', () => {
            this.container.scrollBy({ left: -340, behavior: 'smooth' });
        });

        this.nextBtn.addEventListener('click', () => {
            this.container.scrollBy({ left: 340, behavior: 'smooth' });
        });

        this.container.addEventListener('scroll', () => this.updateButtons());
    },

    updateButtons() {
        if (!this.container || !this.prevBtn || !this.nextBtn) return;

        const { scrollLeft, scrollWidth, clientWidth } = this.container;

        this.prevBtn.disabled = scrollLeft <= 0;
        this.nextBtn.disabled = scrollLeft + clientWidth >= scrollWidth - 1;
    }
};