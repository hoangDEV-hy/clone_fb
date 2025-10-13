import { chat } from "../models/chat/chat";
import { contensChat } from "../models/chat/contensChat"

//for selecting history chat
interface select_chatsType extends chat, contensChat {
}
export async function select_chats(id: string): Promise<boolean | select_chatsType[]> {
    let chatResult: chat[] = await chat.findAll({
        where: { receiver_id: id },
        include: {
            model: contensChat,
            required: false,//left-join
            as: "contensChat"
        }
    })
    if (chatResult.length === 0) {
        await chat.create({ receiver_id: id });
        return true
    }
    // return [chatInstance as unknown as select_chatsType, created as unknown as select_chatsType]
    const chatData: select_chatsType[] = chatResult.map((c) => c.toJSON())
    return chatData;
}