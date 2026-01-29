document.addEventListener('DOMContentLoaded', () => {
    const ground = document.getElementById('ground');
    const backgrounds = document.querySelector('img[name="background"]');
    const text = document.getElementById('contens');
    const emoji = document.getElementById('emoji');
    const dataInput = document.querySelector('input[name="dataImage"]');

    if (dataInput && dataInput.value) {
        try {
            let imgData = JSON.parse(dataInput.value);
            while (typeof imgData === 'string') {
                imgData = JSON.parse(imgData);
            }
            backgrounds.src = `data:${imgData.mimeType};base64,${imgData.base64}`;
        } catch (e) {
            console.error('Không parse được dataImage', e);
        }
    }

    // Đổi background
    ground.onchange = function () {
        backgrounds.src = this.value;
    };

    // Chèn emoji vào textarea
    emoji.onchange = function () {
        if (this.value) {
            text.value += this.value;
            this.value = ""; // reset select về mặc định
        }
    };

    // upload ảnh
    document.getElementById('upload').addEventListener('click', async (e) => {
        e.preventDefault();

        const fileInput = document.getElementById('fileInput');
        if (!fileInput.files.length) {
            alert('Chọn file trước!');
            return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        const res = await fetch('http://localhost:3000/Posts/upload', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        backgrounds.src = `data:${data.mimeType};base64,${data.base64}`;
    });

    async function getBase64FromUrl(url) {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    document.getElementById('submit').addEventListener('click', async (e) => {
        e.preventDefault();

        const url = backgrounds.src;
        let dataUrl = url;
        if (!url.startsWith('data:')) {
            dataUrl = await getBase64FromUrl(url);
        }

        const base64 = dataUrl.split(',')[1];
        const mimeType = dataUrl.match(/^data:(.*);base64/)?.[1] || "";

        const content = {
            text: text.value,
            image: {
                mimeType,
                base64
            }
        };

        const formData = new FormData();
        formData.append('PostId_curtain', document.getElementById('PostId').value);
        formData.append('userId', document.getElementById('userId').value);

        let group_id = document.getElementById('groupId').value;
        let scope = document.getElementById('scope').value;
        if (scope === '') scope = 'only_me';
        formData.append('groupId', group_id);
        formData.append('scope', scope);
        formData.append('content', JSON.stringify(content));

        fetch('http://localhost:3000/Posts/save', {
            method: 'POST',
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'ok') {
                    window.history.back();
                } else {
                    alert('Lưu thất bại');
                }
            })
            .catch(err => {
                console.error(err);
                alert('Có lỗi xảy ra');
            });
    });
});

