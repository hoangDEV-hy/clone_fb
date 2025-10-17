import { chat } from "../models/chat/chat";
import { contensChat } from "../models/chat/contensChat"

//for selecting history chat
interface select_chatsType extends chat, contensChat {
}
//for saving messages
interface MessageData {
    text?: string | null;
    img?: string | null;
    voice?: string | null;
    [key: string]: string | null | undefined;
}
export async function select_chats(sender_id: string, receiver_id: string): Promise<boolean | select_chatsType[]> {
    let chatResult: chat[] = await chat.findAll({
        where: { receiver_id: receiver_id, sender_id: sender_id },
        include: {
            model: contensChat,
            required: false,//left-join
            as: "contensChat"
        }
    })
    if (chatResult.length === 0) {
        await chat.create({ receiver_id: receiver_id, sender_id: sender_id });
        return true
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
            return contensChat.create({ chatID: chatId, author, content: value!, type });
        });

    const saverMes = await Promise.all(tasks);
    return saverMes;
}