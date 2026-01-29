// Hàm tính thời gian
function calculateTimeAgo(dateTime) {
    if (!dateTime) return '';
    const current_time = new Date(dateTime);
    const now_time = new Date();
    const diffMs = now_time - current_time;

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day(s) ago`;
    if (diffHours > 0) return `${diffHours} hour(s) ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute(s) ago`;
    return `${diffSeconds} second(s) ago`;
}

// Hàm async để gán dữ liệu vào DOM
async function renderPostData(Post) {
    document.querySelector('#new input').value = Post.id ?? '';

    const avatarImg = document.querySelector('.bd_ct_n_nguoiDang_anh [name=avatar]');
    avatarImg.src = Post.users?.avatar ? "/" + Post.users.avatar : '';

    const userName = document.querySelector('.bd_ct_n_nguoiDang_name [name=name]');
    userName.innerHTML = Post.users?.name ?? '';

    const timeEl = document.querySelector('.bd_ct_n_nguoiDang_name [name=time]');
    timeEl.innerHTML = calculateTimeAgo(Post.updatedAt);

    document.querySelector('.conten [name=think]').innerHTML = Post.think ?? '';

    if (Post.contens?.text) {
        document.querySelector('.bd_ct_news_title [name=text]').innerHTML = Post.contens.text;
    }

    if (Post.contens?.image) {
        const data = Post.contens.image;
        document.querySelector('.bd_ct_news_title [name=picture]').src = `data:${data.mineType};base64,${data.base64}`;
    }

    document.querySelector('#bd_ct_news_commend_tuongTac input').checked = Post.like ?? false;

    document.querySelector('input[name="id_Post"]').value = Post.id;
}

// Mảng lưu thao tác comment
let add_commends = [];
let updateCommends = [];
let deletedCommends = [];
let check_like;

const likeCheckbox = document.querySelector('#bd_ct_news_commend_tuongTac input');
likeCheckbox.addEventListener('change', () => {
    check_like = likeCheckbox.checked;
});

// Gửi bình luận mới
document.querySelector('#bd_ct_news_commend_thembinhLuan button').addEventListener('click', () => {

    const textarea = document.querySelector('#bd_ct_news_commend_thembinhLuan textarea');
    const content = textarea.value.trim();
    if (!content) return alert('Vui lòng nhập bình luận!');

    const avatar = document.querySelector('#bd_ct_news_commend_thembinhLuan img').src;
    const idUser = document.querySelector('#bd_ct_news_commend_thembinhLuan input').value;
    const parent = document.querySelector("#bd_ct_news_commend_congdong");

    parent.insertAdjacentHTML("beforeend", `
            <div>
              <img src="${avatar}" alt="ava">
              <div>
                <h3>Bạn</h3>
                <h3 class="commend-content" contentEditable="false">${content}</h3>
              </div>
            </div>
        `);

    add_commends.push({ id_user: idUser, id_Posts: id_Post, content, classify: 'commend' });
    textarea.value = '';
});

// Xử lý update / delete comment
document.querySelector("#bd_ct_news_commend_congdong").addEventListener('click', (e) => {
    const btnDel = e.target.closest('.btn-delete');
    const btnUp = e.target.closest('.btn-update');

    if (btnDel) {
        const id = btnDel.dataset.id;
        deletedCommends.push(id);
        document.getElementById('commend' + id)?.remove();
    } else if (btnUp) {
        const id = btnUp.dataset.id;
        const parent = document.querySelector(`#commend${id}`);
        const contentEl = parent.querySelector('.commend-content');

        if (btnUp.innerText === "Sửa") {
            contentEl.contentEditable = true;
            btnUp.innerText = "Xong";
        } else {
            contentEl.contentEditable = false;
            const text = contentEl.innerText.trim();
            const index = updateCommends.findIndex(c => c.id === id);
            if (index >= 0) updateCommends[index].content = text;
            else updateCommends.push({ id, content: text });
            btnUp.innerText = "Sửa";
        }
    }
});
let id_Post = "";
// Lắng nghe message từ parent
window.addEventListener('message', async e => {
    if (e.data.type === 'loadData') {
        const Post = e.data.Post;
        await renderPostData(Post);
        id_Post = Post.id;
    } else if (e.data.type === 'userData') {
        const my_avatar = e.data.short_user.my_avatar;
        const my_id = e.data.short_user.id_user;

        document.querySelector('#bd_ct_news_commend_thembinhLuan img').src = my_avatar ?? '';
        document.querySelector('#bd_ct_news_commend_thembinhLuan input').value = my_id ?? '';
    } else if (e.data.type === 'commend_data_array') {
        let commend_data_array = e.data.commend_data_array;
        const parent = document.querySelector("#bd_ct_news_commend_congdong");
        parent.innerHTML = "";

        commend_data_array.forEach(item => {
            let insert_Html = `
                <div id="commend${item.id}">
                    <img src="/${item.user.avatar}" alt="ava">
                    <div>
                      <h3>${item.user.name}</h3>
                      <h3 class="commend-content" contentEditable="false">${item.content}</h3>
                    </div>
                </div>`;
            parent.insertAdjacentHTML("beforeend", insert_Html);

            const idUser = document.querySelector('#bd_ct_news_commend_thembinhLuan input').value;
            if (idUser == item.id_user) {
                const parentComment = document.querySelector(`#commend${item.id}`);
                const insertBtn = `
                        <button class="btn-delete" data-id="${item.id}">delete</button>
                        <button class="btn-update" data-id="${item.id}">update</button>
                    `;
                parentComment.insertAdjacentHTML("beforeend", insertBtn);
            }
        });
    }
});

// Gửi dữ liệu về parent khi đóng
document.querySelector("#close").addEventListener('click', () => {
    window.parent.postMessage({
        type: 'interactions_an_Post_Data',
        id_Posts: id_Post,
        check_like,
        add_commends,
        updateCommends,
        deletedCommends
    }, '*');
});

