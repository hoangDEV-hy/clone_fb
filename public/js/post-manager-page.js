// Post Manager Page Logic
import handle_image from '/js/support/handle_image.js';
import functionInteractions from '/js/interactions/functionInteractions.js';

document.addEventListener('DOMContentLoaded', () => {
    handle_image('.bd_ct_news_title', 'img.image_src', 'input.image_src');

    // Sorting
    const sortSelect = document.querySelector('[data-role="sort"]');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            const sort = sortSelect.value;
            if (sort) {
                const url = `Post/sort?sort=${sort}`;
                window.location.href = url;
            }
        });
    }

    // Get user ID
    const userInput = document.querySelector('.news input[type="hidden"]');
    if (!userInput) return;
    const id_user = userInput.value;

    // Variables for interactions
    let data_load;
    const nameCheckInput = '.like-checkbox';
    const nameContainIframe = '.bd_ct_news_cmd_tuongTac_pop';
    let change_like = {};
    let add_commends = [];
    let deleted_commends = [];
    let update_commends = [];

    // Change like
    document.querySelectorAll('.like-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            change_like = functionInteractions.change_like(e, change_like, id_user);
        });
    });

    // Send comments
    const commendButtons = document.querySelectorAll('.bd_ct_news_commend_tuongTac [name="commend"]');
    commendButtons.forEach(button => {
        button.addEventListener('click', async e => {
            functionInteractions.send_commends(e, nameContainIframe, "myIframe", 'img[alt="ảnh con"]', id_user, data_load);
        });
    });

    // Handle iframe data
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

    // Save to DB
    window.addEventListener("pagehide", () => {
        functionInteractions.save_toDb(deleted_commends, add_commends, update_commends, change_like);
    });

    // Load interactions
    (async () => {
        const id_Post_load = await functionInteractions.take_idInteractionPost('.news', '.bd_ct_news_title input[type="hidden"]');
        data_load = await functionInteractions.load_interactionPost(id_Post_load, id_user);
        await functionInteractions.set_like(data_load);
    })();
});
