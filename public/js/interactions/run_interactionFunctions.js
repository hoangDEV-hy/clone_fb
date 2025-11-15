import functionInteractions from '/js/interactions/functionInteractions.js'

export default function interactions(change_like, id_user, nameContainIframe, data_load, add_commends, deleted_commends, update_commends) {
    //change like
    document.querySelectorAll('.like-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            change_like = functionInteractions.change_like(e, change_like, id_user);
        })
    });
    //send_commends
    const commendButtons = document.querySelectorAll('.bd_ct_news_commend_tuongTac [name="commend"]');
    commendButtons.forEach(button => {
        button.addEventListener('click', async e => {
            functionInteractions.send_commends(e, nameContainIframe, "myIframe", '.my_profile img', id_user, data_load);
        })
    })
    //hander_dataIframe
    window.addEventListener('message', e => {
        if (!e.data || e.data.type !== 'interactions_an_Post_Data') return;

        functionInteractions.hander_dataIframe(
            e,
            add_commends,
            deleted_commends,
            update_commends,
            nameContainIframe,
            change_like,
            id_user,
            (newData) => {
                deleted_commends = newData.deleted_commends;
                update_commends = newData.update_commends;
                change_like = newData.change_like;
                add_commends = newData.add_commends;
            }
        );

    });

    //save_toDB
    window.addEventListener("pagehide", () => {
        functionInteractions.save_toDb(deleted_commends, add_commends, update_commends, change_like);
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