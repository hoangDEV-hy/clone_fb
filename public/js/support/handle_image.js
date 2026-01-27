export default function handle_image(namePost, namePicture, nameDataPicture) {
    document.querySelectorAll(namePost).forEach(container => {
        try {
            let hiddenInput = container.querySelector(nameDataPicture);
            if (!hiddenInput) return;

            let data = hiddenInput.value;

            // Kiểm tra data có rỗng không
            if (!data || data.trim() === '') {
                console.log("Không có dữ liệu ảnh");
                return;
            }

            // Parse JSON an toàn
            data = JSON.parse(data);
            if (typeof data === "string") {
                data = JSON.parse(data);
            }

            let imgElement = container.querySelector(namePicture);

            // Kiểm tra đầy đủ trước khi set src
            if (imgElement && data && data.mimeType && data.base64) {
                imgElement.src = `data:${data.mimeType};base64,${data.base64}`;
            }
        } catch (e) {
            console.error("Lỗi xử lý ảnh:", e);
            // Không throw error để không ảnh hưởng các ảnh khác
        }
    });
}