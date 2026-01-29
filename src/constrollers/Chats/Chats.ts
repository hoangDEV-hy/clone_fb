import { chat } from "../../Models/Chats/Chat";
import { contentsChat } from "../../Models/Chats/ContentsChat"
import { Op } from "sequelize";
import { config_chatFunc } from "../../Models/Configs/ConfigsChat";
import { config_chat } from "../../Models/Configs/ConfigsChat";

//for selecting history chat
export interface select_chatsType extends chat, contentsChat {
}
//for saving messages
interface MessageData {
    text?: string | null;
    img?: string | null;
    voice?: string | null;
    [key: string]: string | null | undefined;
}
export interface create_chat {
    created: boolean,
    chatId: number
}
export async function select_chats(sender_id: string, receiver_id: string): Promise<create_chat | select_chatsType[]> {
    let chatResult: chat[] = await chat.findAll({
        where: {
            [Op.or]: [
                { [Op.and]: [{ sender_id }, { receiver_id }] },
                { [Op.and]: [{ sender_id: receiver_id }, { receiver_id: sender_id }] }
            ]
        },
        include: {
            model: contentsChat,
            required: false,//left-join
            as: "contentsChat"
        }
    })
    if (chatResult.length === 0) {
        const newChat = await chat.create({ receiver_id: receiver_id, sender_id: sender_id });
        return { created: true, chatId: newChat.id };
    }
    // return [chatInstance as unknown as select_chatsType, created as unknown as select_chatsType]
    const chatData: select_chatsType[] = chatResult.map((c) => c.toJSON())
    return chatData;
}
export async function create_mes(chatId: string, author: string, send_mesData: MessageData): Promise<any[]> {
    const tasks = Object.entries(send_mesData)
        .filter(([, value]) => value !== null && value !== undefined)
        .map(([key, value]) => {
            let type: 'text' | 'picture' | 'voice' = 'text';
            if (key === 'img') type = 'picture';
            else if (key === 'voice') type = 'voice';
            return contentsChat.create({ chatID: chatId, author, content: value!, type });
        });

    const saverMes = await Promise.all(tasks);
    return saverMes;
}
export async function createOrUpdateOrLoad_chat(
    updateDataWhere: Record<string, any>,
    updateDataEdit: Record<string, any>,
    saveData: Record<string, any>
): Promise<any> {
    // Nếu updateDataEdit không tồn tại hoặc rỗng hoặc toàn null/undefined → chỉ load thôi
    if (
        !updateDataEdit ||
        Object.values(updateDataEdit).every(v => v === undefined || v === null)
    ) {
        console.log("⚠️ updateDataEdit rỗng hoặc không hợp lệ => chỉ lấy dữ liệu");
        return await config_chat.findOne({ where: updateDataWhere });
    }

    // Nếu có dữ liệu hợp lệ thì update
    const result = await config_chatFunc.update_config(updateDataEdit, updateDataWhere);
    if (result) {
        const [affectedCount] = result;
        if (affectedCount > 0) {
            return await config_chat.findOne({ where: updateDataWhere });
        }
    }

    // Nếu không update được thì tạo mới
    return await config_chatFunc.create_config(saveData);
}

