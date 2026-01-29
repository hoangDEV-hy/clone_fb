import functionInteractions from '/js/interactions/functionInteractions.js'

export default function interactions(change_like, id_user, nameContainIframe, data_load, add_commends, deleted_commends, update_commends) {
    // Sử dụng object để lưu trữ state và có thể cập nhật được
    const state = {
        change_like: change_like || {},
        add_commends: add_commends || [],
        deleted_commends: deleted_commends || [],
        update_commends: update_commends || []
    };

    //change like
    document.querySelectorAll('.like-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            state.change_like = functionInteractions.change_like(e, state.change_like, id_user);
        })
    });
    //send_commends
    const commendButtons = document.querySelectorAll('.bd_ct_news_commend_tuongTac [name="commend"]');
    commendButtons.forEach(button => {
        button.addEventListener('click', async e => {
            // Ưu tiên avatar ở navbar, fallback sang .my_profile nếu sau này có
            const avatarSelector = document.querySelector('.navbar-profile img')
                ? '.navbar-profile img'
                : '.my_profile img';
            functionInteractions.send_commends(e, nameContainIframe, "myIframe", avatarSelector, id_user, data_load);
        })
    })
    //handle_dataiframe
    window.addEventListener('message', async e => {
        if (!e.data || e.data.type !== 'interactions_an_Post_Data') return;

        functionInteractions.handle_dataiframe(
            e,
            state.add_commends,
            state.deleted_commends,
            state.update_commends,
            nameContainIframe,
            state.change_like,
            id_user,
            async (newData) => {
                // Cập nhật state
                state.deleted_commends = newData.deleted_commends || [];
                state.update_commends = newData.update_commends || [];
                state.change_like = newData.change_like || {};
                state.add_commends = newData.add_commends || [];
                
                // Lưu ngay lập tức khi đóng iframe để đảm bảo không mất dữ liệu khi reload
                await functionInteractions.save_toDb(
                    state.deleted_commends, 
                    state.add_commends, 
                    state.update_commends, 
                    state.change_like
                );
                
                // Reset các biến sau khi lưu thành công
                state.add_commends = [];
                state.deleted_commends = [];
                state.update_commends = [];
                state.change_like = {};
            }
        );

    });

    //save_toDB - backup khi đóng trang
    window.addEventListener("pagehide", () => {
        functionInteractions.save_toDb(
            state.deleted_commends, 
            state.add_commends, 
            state.update_commends, 
            state.change_like
        );
    });

    //for logic the program
    (async () => {
        //take ids for load interactions
        const id_Post_load = await functionInteractions.take_idInteractionPost('.news', 'input[name="news"]');
        //load interactions
        data_load = await functionInteractions.load_interactionPost(id_Post_load, id_user);
        //set like
        await functionInteractions.set_like(data_load);
    })();
}