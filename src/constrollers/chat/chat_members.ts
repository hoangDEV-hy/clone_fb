import { methods } from "../../models/chat/chat_members"
import { Op } from "sequelize";

export async function select_members(sender_id: string, receiver_id: string, selectedChatId: number): Promise<any> {
    const members = await methods.selectWhere(
        {
            [Op.and]: {
                idUser: {
                    [Op.in]: [sender_id, receiver_id]
                },
                chat_id: selectedChatId
            }
        }
    );
    console.log('members', members)
    if (members.length === 2) {
        return members;
    }
    return null;
}

export async function add_members(chat_valueMembers: Array<{ chat_id: number; idUser: string; status: string; }>) {
    return methods.creates(chat_valueMembers);
}