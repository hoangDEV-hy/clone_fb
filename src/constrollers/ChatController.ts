import { contentsChat } from "../Models/Chats/ContentsChat";
import { config_chatFunc, config_chat } from "../Models/Configs/ConfigsChat";
import { chat_member, methods as chatMemberModel } from "../Models/Chats/ChatMember";
import { Op } from "sequelize";
import throwError from "../Helpers/ThrowErrorOfController";

// ============================================================
// CHAT CONTROLLER
// Responsibility: Business logic for chat operations
// ============================================================

export const ChatController = {
    /**
     * Delete messages by IDs
     */
    deleteMessages: async (ids: number[]): Promise<void> => {
        try {
            await contentsChat.destroy({
                where: { id: { [Op.in]: ids } }
            });
        } catch (err) {
            throwError(err);
        }
    },

    /**
     * Create or update chat configuration
     */
    createOrUpdateChatConfig: async (
        chat_id: number,
        author: string,
        nickName?: string
    ): Promise<any> => {
        try {
            const save_data = await createOrUpdateOrLoad_chat(
                { chat_id, author },
                { nickName },
                { chat_id, author, nickName }
            );
            return save_data;
        } catch (err) {
            throwError(err);
        }
    },

    /**
     * Add member to chat room
     */
    addChatMember: async (chat_memberValue: any): Promise<any> => {
        try {
            return await chatMemberModel.create(chat_memberValue);
        } catch (err) {
            throwError(err);
        }
    },

    /**
     * Remove member from chat room
     */
    removeChatMember: async (chat_memberValue: any): Promise<any> => {
        try {
            return await chatMemberModel.remove(chat_memberValue);
        } catch (err) {
            throwError(err);
        }
    },

    /**
     * Update chat member status
     */
    updateChatMember: async (chat_memberValue: any): Promise<any> => {
        try {
            return await chatMemberModel.update(chat_memberValue);
        } catch (err) {
            throwError(err);
        }
    }
};

// Helper function for chat config
async function createOrUpdateOrLoad_chat(
    updateDataWhere: Record<string, any>,
    updateDataEdit: Record<string, any>,
    saveData: Record<string, any>
): Promise<any> {
    if (
        !updateDataEdit ||
        Object.values(updateDataEdit).every(v => v === undefined || v === null)
    ) {
        return await config_chat.findOne({ where: updateDataWhere });
    }

    const result = await config_chatFunc.update_config(updateDataEdit, updateDataWhere);
    if (result) {
        const [affectedCount] = result;
        if (affectedCount > 0) {
            return await config_chat.findOne({ where: updateDataWhere });
        }
    }

    return await config_chatFunc.create_config(saveData);
}
