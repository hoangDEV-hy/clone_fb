export default function handle_image(namePost, namePicture, nameDataPicture) {
    document.querySelectorAll(namePost).forEach(container => {
        try {
            let hiddenInput = container.querySelector(nameDataPicture);
            if (!hiddenInput) return;

            let data = hiddenInput.value;
            data = JSON.parse(data);
            if (typeof data === "string") data = JSON.parse(data);

            let imgElement = container.querySelector(namePicture);
            if (imgElement && data.mimeType && data.base64) {
                imgElement.src = `data:${data.mimeType};base64,${data.base64}`;
            }
        } catch (e) {
            console.error("Lỗi xử lý ảnh:", e);
        }
    });
}
