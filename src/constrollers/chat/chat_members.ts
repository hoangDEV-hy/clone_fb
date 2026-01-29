import throwError from "../../helpers/ThrowErrorOfController";
import { chat } from "../../models/chat/chat";
import { chat_member, methods as chat_memberModel } from "../../models/chat/chat_members"
import { Op, Transaction } from "sequelize";

export const methods = {
    createAdmins: async (
        data: {
            selectedChatId: number;
            userIds: string[];
        },
        transaction?: Transaction
    ): Promise<chat_member[]> => {
        try {
            const members = data.userIds.map(idUser => ({
                chat_id: data.selectedChatId,
                idUser,
                status: 'joining' as const,
                role: 'admin' as const
            }));

            return await chat_memberModel.creates(members, transaction);
        } catch (err) {
            throwError(err);
            return [];
        }
    },
    isAdmin: async (chatId: number, userId: string): Promise<boolean> => {
        try {
            return await chat_memberModel.isAdmin(chatId, userId);
        } catch (err) {
            throwError(err);
        }
    },
    createGuests: async (
        data: {
            selectedChatId: number;
            userIds: string[];
        },
        transaction?: Transaction
    ): Promise<chat_member[]> => {
        try {
            const members = data.userIds.map(idUser => ({
                chat_id: data.selectedChatId,
                idUser,
                status: 'joining' as const,
                role: 'guest' as const
            }));

            return await chat_memberModel.creates(members, transaction);
        } catch (err) {
            throwError(err);
            return [];
        }
    },
    countMembers: async (chatId: number, transaction?: Transaction): Promise<number> => {
        try {
            return await chat_memberModel.countMembers(chatId, transaction);
        } catch (err) {
            throwError(err);
        }
    },
    remove: async (chatId: number, receiver_id: string, transaction: Transaction): Promise<Number> => {
        try {
            return await chat_memberModel.remove(chatId, receiver_id, transaction);
        } catch (err) {
            throwError(err);
        }
    },
    selectMembers: async (includeUser: boolean, chat_id?: number, author?: string, status?: string,): Promise<chat_member[]> => {
        try {
            return await chat_memberModel.selectMembers({
                chat_id: chat_id,
                status: 'joining'
            }, includeUser);
        } catch (err) {
            throwError(err);
        }
    },
    transferAdmin: async (
        chatId: number,
        oldAdminId: string,
        newAdminId: string,
        transaction?: Transaction
    ): Promise<boolean> => {
        try {
            return await chat_memberModel.transferAdmin(chatId, oldAdminId, newAdminId, transaction);
        } catch (err) {
            throwError(err);
        }
    }
}