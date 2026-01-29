let input = document.querySelector('[data-role="textBox"] input');
let inputBox = document.querySelector('[data-role="textBox"]');
let data = undefined;
let type = null;
let timer = null;

window.addEventListener('message', event => {
    if (event.origin !== window.location.origin) return;
    window.lastChatRoomUser = event.data;
});

async function send_searchResult() {
    const text = input.value.trim();
    if (text === "") return;

    data = window.lastChatRoomUser;
    let search_values;

    if (!data) {
        type = "normal";
        const params = new URLSearchParams({ name: text });
        const res = await fetch('/searches/get?' + params);
        search_values = await res.json();
    } else {
        type = "mess";
        const params = new URLSearchParams({
            idUser: data.idUser,
            chat_roomId: data.chat_roomId,
            name: text
        });
        const res = await fetch('/searches/chatmember?' + params);
        search_values = await res.json();
    }

    const actualList = search_values.list || search_values.friendList || [];
    handle_searchValues(actualList, type);
}

input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(send_searchResult, 1000);
});

document.addEventListener('click', (e) => {
    if (!inputBox.contains(e.target)) {
        clearTimeout(timer);
        send_searchResult();
    }
});

async function addTo_room(userId) {
    const chat_memberValue = {
        chat_id: data.chat_roomId,
        idUser: userId,
        status: 'pending'
    };

    const notification_value = {
        selectedIdChatRoom: data.chat_roomId,
        selectedSenderId: data.idUser,
        receiver_id: userId,
        content: `Invite to chat room of ${data.idUser}`
    };

    try {
        const resNotify = await fetch('/notification/chat_members', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notification_value })
        });
        if (!resNotify.ok) throw new Error("Lỗi tạo thông báo");

        const resAdd = await fetch('/mess/chat_room/people', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_memberValue })
        });
        if (!resAdd.ok) throw new Error("Lỗi thêm thành viên");

        alert("Gửi lời mời thành công!");
    } catch (err) {
        console.error(err);
        alert("Có lỗi xảy ra.");
    }
}

function handle_searchValues(list, type) {
    let tbody = document.querySelector('[data-role="tableValue"] table tbody');
    tbody.innerHTML = "";

    if (!Array.isArray(list) || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center">No data</td></tr>`;
        return;
    }
    list.forEach(item => {
        const tr = document.createElement('tr');

        const avatarHtml = item.avatar
            ? `<img src="/${item.avatar}" width="40" height="40" style="object-fit:cover">`
            : '';

        let profileLinkHtml = '';

        if (item.type === 'user') {
            profileLinkHtml = `
            <form action="http://localhost:3000/page_manager/user" method="POST" style="display:inline;">
                <input type="hidden" name="selectedTargetId" value="${item.id}">
                <button type="submit"
                    style="background:none;border:none;color:blue;text-decoration:underline;cursor:pointer;padding:0;">
                    Trang cá nhân
                </button>
            </form>
        `;
        } else if (item.type === 'group') {
            profileLinkHtml = `
            <form action="http://localhost:3000/group" method="POST" style="display:inline;">
                <input type="hidden" name="groupId" value="${item.id}">
                <button type="submit"
                    style="background:none;border:none;color:blue;text-decoration:underline;cursor:pointer;padding:0;">
                    Trang nhóm
                </button>
            </form>
        `;
        }

        if (type === 'mess') {
            tr.innerHTML = `
            <td align="center">${avatarHtml}</td>
            <td>${profileLinkHtml}</td>
            <td align="center">
                <button onclick="addTo_room('${item.id}')">Add to room</button>
            </td>
        `;
        } else if (type === 'normal') {
            tr.innerHTML = `
            <td align="center">${avatarHtml}</td>
            <td>${profileLinkHtml}</td>
            <td align="center"><small>N/A</small></td>
        `;
        } else {
            tr.innerHTML = `
            <td colspan="3" style="text-align:center;color:red;">
                Định dạng không hợp lệ
            </td>
        `;
        }

        tbody.appendChild(tr);
    });

}

