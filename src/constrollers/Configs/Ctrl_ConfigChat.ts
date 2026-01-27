import { Transaction } from "sequelize";
import throwError from "../../helpers/ThrowErrorOfController"
import { config_chat, methods as config_chatModel } from "../../models/configs/config_chat"
import ConfigChatRoom from "../../types/Type_ConfigChatRoom";

export const methods = {
    createDefaultConfig: async (chatId: number, userId: string, transaction: Transaction): Promise<config_chat | null> => {
        try {
            return await config_chatModel.createDefaultConfig(chatId, userId, transaction);
        } catch (err) {
            throwError(err);
        }
    },
    getConfig: async (chatId: number, userId: string): Promise<config_chat | null> => {
        try {
            return await config_chatModel.getConfig(chatId, userId);
        } catch (err) {
            throwError(err);
        }
    },
    deleteConfig: async (chatId: number, userId: string, transaction: Transaction): Promise<Number> => {
        try {
            return await config_chatModel.deleteConfig(chatId, userId, transaction);
        } catch (err) {
            throwError(err);
        }
    },
    updateConfig: async (chatId: number, userId: string, configData: ConfigChatRoom, transaction?: Transaction): Promise<number> => {
        try {
            return await config_chatModel.updateConfig(configData, { chat_id: chatId, author: userId }, transaction);
        } catch (err) {
            throwError(err);
        }
    }

}