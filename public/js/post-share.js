document.addEventListener('DOMContentLoaded', () => {
    const data = document.querySelector('input[name="dataImage"]');
    const text = document.getElementById('text');
    const contens = document.getElementById('contens');
    const emoji = document.getElementById('emoji');
    const background = document.querySelector('img[name="background"]');

    if (data && data.value) {
        try {
            let imgData = JSON.parse(data.value);
            while (typeof imgData === "string") imgData = JSON.parse(imgData);
            background.src = `data:${imgData.mimeType};base64,${imgData.base64}`;
        } catch (e) {
            console.error('Không parse được dataImage', e);
        }
    }

    emoji.onchange = function () {
        if (this.value) {
            contens.value += this.value;
            this.value = "";
        }
    };

    document.getElementById('submit').addEventListener('click', async (e) => {
        e.preventDefault();

        const conten = {
            text: text.value,
            image: data ? data.value : null
        };

        const selectedUserId = document.getElementById('userId').value;
        const selectedPostId = document.getElementById('PostId_original').value;

        const formData = new FormData();
        formData.append('PostId_original', selectedPostId);
        formData.append('PostId_curtain', document.getElementById('PostId_curtain').value);
        formData.append('userId', selectedUserId);
        formData.append('groupId', document.getElementById('groupId').value);

        let scope = document.getElementById('scope').value || 'only_me';
        formData.append('scope', scope);

        formData.append('content', JSON.stringify(conten));
        formData.append('think', contens.value);

        formData.append('notification_value', JSON.stringify({
            id: null,
            selectedIdChatRoom: null,
            selectedSenderId: null,
            receiver_id: selectedUserId,
            content: `${selectedUserId} đã chia sẻ bài viết ${selectedPostId} của`,
            type: "static"
        }));
        try {
            const res1 = await fetch('http://localhost:3000/Posts/save', {
                method: 'POST',
                body: formData
            });

            const res2 = await fetch('http://localhost:3000/Post/share/save', {
                method: 'POST',
                body: formData
            });

            if (res1.ok && res2.ok) {
                alert('Success');
                window.history.back();
            } else {
                alert('Lỗi khi lưu dữ liệu');
            }
        } catch (err) {
            console.error(err);
            alert('Có lỗi kết nối server');
        }
    });
});

