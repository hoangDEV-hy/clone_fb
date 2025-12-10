import { methods } from "../../models/chat/chat_members"
import { Op } from "sequelize";

export async function select_members(sender_id: string, receiver_id: string): Promise<any> {
    const members = await methods.selectWhere(
        {
            idUser: {
                [Op.in]: [sender_id, receiver_id]
            }
        }
    );
    if (members.length === 2) {
        return members;
    }
    return null;
}

export async function add_members(chat_valueMembers: Array<{ chat_id: number; idUser: string; status: string; }>) {
    return methods.creates(chat_valueMembers);
}