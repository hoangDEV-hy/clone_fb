const functionInteractions = {
    take_idInteractionPost: async (namePost, nameIdPost) => {
        let id_Post_load = [];
        await document.querySelectorAll(namePost).forEach(container => {
            let id_Post = container.querySelector(nameIdPost).value;
            id_Post_load.push(id_Post);
        })
        console.log('take_idInteractionPost done')
        return id_Post_load;
    },
    load_interactionPost: async (id_Post_load, id_user) => {

        const formData = new FormData();
        formData.append('id_Posts', JSON.stringify(id_Post_load));
        formData.append('id_user', id_user);
        const res = await fetch('/Post/interactions/load', {
            method: 'Post',
            body: formData
        });
        console.log('load_interactionPost done')
        return await res.json();
    },
    set_like: (data_load) => {
        // Hàm format số lượng
        function formatCount(count) {
            if (!count || count === 0) return '';
            if (count >= 1000) {
                return (count / 1000).toFixed(1) + 'K';
            }
            return count.toString();
        }

        for (let [key, value] of Object.entries(data_load)) {
            if (key === "sl_like_check") {
                // value is now the array [ {id_Posts: 3, totalLikes: 2, likedByUser: 1} ]
                for (let item of value) {
                    let id_Post = item.id_Posts;   // <-- notice: field name is id_Posts, not id_Post

                    // Set checkbox checked/unchecked
                    if (item.likedByUser === 1) {
                        document.getElementById(id_Post).checked = true;
                    }

                    // Hiển thị số lượng like
                    const likeCountEl = document.getElementById(`bd_ct_news_cmd_tk_text_news${id_Post}`);
                    if (likeCountEl && item.totalLikes > 0) {
                        likeCountEl.textContent = formatCount(item.totalLikes);
                    } else if (likeCountEl) {
                        likeCountEl.textContent = '';
                    }
                }
            }

        }
        console.log('set_like done')
    },
    send_commends: async (clicked_post, nameContainIframe, nameIframe, namePicture, id_user, data_load) => {
        const iframe = document.getElementById(nameIframe);

        const click = clicked_post.target;
        const id_Post = click.dataset.id;
        document.querySelector(nameContainIframe).style.display = "block";

        // xác định đã like chưa
        let like = document.getElementById(id_Post).checked;


        // load Post_data từ server
        const formData = new FormData();
        formData.append('id_Post', id_Post);
        const res = await fetch('/Post/Post/load', {
            method: 'Post',
            body: formData
        });
        const Post_data = await res.json();
        Post_data.Post.like = like;
        // gửi Post_data  vào iframe
        //Post_data.Post.forEach(e => { console.log('e', e) })
        iframe.contentWindow.postMessage(
            { type: 'loadData', Post: Post_data.Post },
            '*'
        );

        // gửi thông tin user vào iframe
        const avatarElement = document.querySelector(namePicture);
        let my_avatar = '';
        if (avatarElement) {
            my_avatar = avatarElement.src || avatarElement.getAttribute('src') || '';
            // Đảm bảo đường dẫn có dấu / ở đầu nếu là đường dẫn tương đối
            if (my_avatar && !my_avatar.startsWith('http') && !my_avatar.startsWith('/') && !my_avatar.startsWith('data:')) {
                my_avatar = '/' + my_avatar;
            }
        }
        const short_user = { id_user, my_avatar };
        iframe.contentWindow.postMessage(
            { type: 'userData', short_user },
            '*'
        );
        // gui commends to iframe
        let commend_data_array;
        for (let [key, value] of Object.entries(data_load)) {
            if (key === 'commend') {
                commend_data_array = value.filter(e => e.id_Posts == id_Post);
            }
        }


        iframe.contentWindow.postMessage({
            type: 'commend_data_array',
            commend_data_array: commend_data_array
        });

        // Gửi interactions_data vào iframe để hiển thị stats
        iframe.contentWindow.postMessage({
            type: 'interactions_data',
            interactions_data: data_load
        }, '*');

        console.log('send_commends done')


    },
    change_like: (clicked_post, change_like, id_user) => {

        const isCheck = clicked_post.target.checked;
        const id_Post = clicked_post.target.dataset.id;
        const method = isCheck ? "Post" : "DELETE";
        const postElement = clicked_post.target.closest('.news');
        const postOwnerIdInput = postElement.querySelector('input[name="post_owner_id"]');
        const postOwnerId = postOwnerIdInput ? postOwnerIdInput.value : null;

        change_like[id_Post] = {
            id_user,
            id_Posts: id_Post,
            classify: 'like',
            method,
            notification_value: isCheck ? {
                type: 'static',
                selectedIdChatRoom: null,
                selectedSenderId: id_user,
                receiver_id: postOwnerId,
                content: `${id_user} đã thích bài viết ${id_Post} của ${postOwnerId}`
            } : null // Không gửi notification khi unlike
        };

        console.log('change_like done')
        return change_like;

    },
    handle_dataiframe: (take_data, add_commends, deleted_commends, update_commends, containIframeName, change_like, id_user, onUpdate) => {

        if (take_data.data.type === 'interactions_an_Post_Data') {
            document.querySelector(containIframeName).style.display = "none";

            const data = take_data.data;

            // Xử lý Like
            if (data.check_like !== undefined) {
                let method = data.check_like ? 'Post' : 'DELETE';
                // Lấy post owner từ DOM
                const postElement = document.querySelector(`input[name="news"][value="${data.id_Posts}"]`)?.closest('.news');
                const postOwnerIdInput = postElement?.querySelector('input[name="post_owner_id"]');
                const postOwnerId = postOwnerIdInput ? postOwnerIdInput.value : null;
                change_like[data.id_Posts] = {
                    id_user,
                    id_Posts: data.id_Posts,
                    classify: 'like',
                    method,
                    notification_value: data.check_like ? {
                        type: 'static',
                        selectedIdChatRoom: null,
                        selectedSenderId: id_user,
                        receiver_id: postOwnerId,
                        content: `${id_user} đã thích bài viết ${data.id_Posts} của ${postOwnerId}`
                    } : null // Không gửi notification khi unlike
                };
                document.getElementById(data.id_Posts).checked = data.check_like;
            }


            // Xử lý Comments - thêm notification data
            if (data.add_commends && data.add_commends.length > 0) {
                const postElement = document.querySelector(`input[name="news"][value="${data.id_Posts}"]`)?.closest('.news');
                const postOwnerIdInput = postElement?.querySelector('input[name="post_owner_id"]');
                const postOwnerId = postOwnerIdInput ? postOwnerIdInput.value : null;

                add_commends = data.add_commends.map(comment => ({
                    ...comment,
                    notification_value: {
                        type: 'comment',
                        selectedIdChatRoom: null,
                        selectedSenderId: id_user,
                        receiver_id: postOwnerId,
                        content: `${id_user} đã bình luận: "${comment.content.substring(0, 30)}${comment.content.length > 30 ? '...' : ''}" tại bài viết ${data.id_Posts} của ${postOwnerId}`
                    }
                }));
            } else {
                add_commends = [];
            }
            deleted_commends = data.deletedCommends ?? [];
            update_commends = data.updateCommends ?? [];
        }

        onUpdate({
            deleted_commends,
            update_commends,
            change_like,
            add_commends
        });

        console.log('handle_dataiframe done');


    },
    save_toDb: async (deleted_commends, add_commends, update_commends, change_like) => {

        // Gửi like với notification
        if (change_like && Object.keys(change_like).length > 0) {
            try {
                const response = await fetch('/Post/like', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(change_like)
                });

                if (!response.ok) {
                    console.error('Failed to save likes');
                }
            } catch (error) {
                console.error('Error saving likes:', error);
                // Fallback to sendBeacon if fetch fails
                const likeBlob = new Blob([JSON.stringify(change_like)], { type: 'application/json' });
                navigator.sendBeacon('/Post/like', likeBlob);
            }
        }

        // Gửi comment với notification
        if (add_commends && add_commends.length > 0) {
            try {
                const response = await fetch('/Post/commend', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(add_commends)
                });

                if (!response.ok) {
                    console.error('Failed to save comments');
                }
            } catch (error) {
                console.error('Error saving comments:', error);
                // Fallback to sendBeacon
                const commendBlob = new Blob([JSON.stringify(add_commends)], { type: 'application/json' });
                navigator.sendBeacon('/Post/commend', commendBlob);
            }
        }

        // Gửi deleted comments
        if (deleted_commends && deleted_commends.length > 0) {
            try {
                const response = await fetch('/Post/commend/del', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(deleted_commends)
                });

                if (!response.ok) {
                    console.error('Failed to delete comments');
                }
            } catch (error) {
                console.error('Error deleting comments:', error);
                const delCommends = new Blob([JSON.stringify(deleted_commends)], { type: 'application/json' });
                navigator.sendBeacon('/Post/commend/del', delCommends);
            }
        }

        // Gửi updated comments
        if (update_commends && update_commends.length > 0) {
            try {
                const response = await fetch('/Post/commend/up', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(update_commends)
                });

                if (!response.ok) {
                    console.error('Failed to update comments');
                }
            } catch (error) {
                console.error('Error updating comments:', error);
                const upCommends = new Blob([JSON.stringify(update_commends)], { type: 'application/json' });
                navigator.sendBeacon('/Post/commend/up', upCommends);
            }
        }


        console.log('save_toDb done')

    }
}

export default functionInteractions;