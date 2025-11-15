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

        for (let [key, value] of Object.entries(data_load)) {
            if (key === "sl_like_check") {
                // value is now the array [ {id_Posts: 3, totalLikes: 2, likedByUser: 1} ]
                for (let item of value) {
                    let id_Post = item.id_Posts;   // <-- notice: field name is id_Posts, not id_Post

                    if (item.likedByUser === 1) {
                        document.getElementById(id_Post).checked = true;
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
        console.log(Post_data.Post)
        //Post_data.Post.forEach(e => { console.log('e', e) })
        iframe.contentWindow.postMessage(
            { type: 'loadData', Post: Post_data.Post },
            '*'
        );

        // gửi thông tin user vào iframe
        const my_avatar = document.querySelector(namePicture).src;
        const short_user = { id_user, my_avatar };
        iframe.contentWindow.postMessage(
            { type: 'userData', short_user },
            '*'
        );
        // gui commends to iframe
        let commend_data_array;
        console.log('data_load', data_load)
        for (let [key, value] of Object.entries(data_load)) {
            if (key === 'commend') {
                commend_data_array = value.filter(e => e.id_Posts == id_Post);
            }
        }
        console.log('commend_data_array', commend_data_array)


        iframe.contentWindow.postMessage({
            type: 'commend_data_array',
            commend_data_array: commend_data_array
        });



        console.log('send_commends done')


    },
    change_like: (clicked_post, change_like, id_user) => {

        const isCheck = clicked_post.target.checked;
        const id_Post = clicked_post.target.dataset.id;
        const method = isCheck ? "Post" : "DELETE";

        change_like[id_Post] = {
            id_user,
            id_Posts: id_Post,
            classify: 'like',
            method
        };

        console.log('change_like done')
        return change_like;

    },
    hander_dataIframe: (take_data, add_commends, deleted_commends, update_commends, containIframeName, change_like, id_user, onUpdate) => {

        if (take_data.data.type === 'interactions_an_Post_Data') {
            document.querySelector(containIframeName).style.display = "none";

            const data = take_data.data;

            // Xử lý Like
            if (data.check_like !== undefined) {
                let method = data.check_like ? 'Post' : 'DELETE';
                change_like[data.id_Posts] = {
                    id_user,
                    id_Posts: data.id_Posts,
                    classify: 'like',
                    method
                };
                document.getElementById(data.id_Posts).checked = data.check_like;
            }


            add_commends = data.add_commends ?? [];
            deleted_commends = data.deletedCommends ?? [];
            update_commends = data.updateCommends ?? [];
        }

        onUpdate({
            deleted_commends,
            update_commends,
            change_like,
            add_commends
        });

        console.log('hander_dataIframe done');


    },
    save_toDb: (deleted_commends, add_commends, update_commends, change_like) => {

        // gửi like
        if (change_like != null) {

            const likeBlob = new Blob([JSON.stringify(change_like)], { type: 'application/json' });
            navigator.sendBeacon('/Post/like', likeBlob);
        }

        // gửi comment

        if (add_commends.length > 0) {

            const commendBlob = new Blob([JSON.stringify(add_commends)], { type: 'application/json' });
            navigator.sendBeacon('/Post/commend', commendBlob);
        }

        //send a deleted_commends
        if (deleted_commends.length > 0) {

            const delCommends = new Blob([JSON.stringify(deleted_commends)], { type: 'application/json' });

            navigator.sendBeacon('/Post/commend/del', delCommends);
        }
        //send a update_commends
        if (update_commends.length > 0) {
            const upCommends = new Blob([JSON.stringify(update_commends)], { type: 'application/json' });
            navigator.sendBeacon('/Post/commend/up', upCommends);
        }


        console.log('save_toDb done')

    }
}

export default functionInteractions;