import throwError from "../../helpers/ThrowErrorOfController"
import { contentsChat, methods as contentsChatModels } from "../../models/chat/contensChat"
import { Transaction } from "sequelize";
import { config_chat } from "../../models/configs/config_chat";

export const methods = {
    getMessages: async (chatId: number, page: number, limit: number): Promise<contentsChat[] | null> => {
        try {
            return await contentsChatModels.getMessages(chatId, page, limit);
        } catch (err) {
            throwError(err)
        }
    },
    createMessage: async (chatId: number, author: string, content: string, type: 'text' | 'image' | 'file' = 'text'): Promise<contentsChat | null> => {
        try {
            return await contentsChatModels.createMessage({
                chatID: chatId,
                author,
                content,
                type
            });
        } catch (err) {
            throwError(err);
        }
    },
    deleteMessage: async (
        messageId: number,
        userId: string,
        isAdmin: boolean,
        transaction?: Transaction
    ): Promise<number> => {
        try {
            return await contentsChatModels.deleteMessage(messageId, userId, isAdmin, transaction);
        } catch (err) {
            throwError(err);
        }
    },
    searchMessages: async (
        chatId: number,
        searchTerm: string,
        page: number = 1,
        limit: number = 20
    ): Promise<contentsChat[]> => {
        try {
            return await contentsChatModels.searchMessages(chatId, searchTerm, page, limit);
        } catch (err) {
            throwError(err);
        }
    }
}