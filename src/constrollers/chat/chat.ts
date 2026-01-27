import { chat } from "../../models/chat/chat";
import { Op } from "sequelize";
import { methods as config_chatController } from "../../constrollers/Configs/Ctrl_ConfigChat";
import { methods as chat_memberController } from "../chat/chat_members"
import { methods as chatModel } from "../../models/chat/chat"
import { methods as contentsChatController } from "./Ctrl_ContentsChat"
import { sequelize } from '../../configs/sql';
import { getNotificationsChat, create } from "../Ctrl_Notification"
import NotificationServerTake from "../../types/Type_Notification";
import ConfigChatRoom from "../../types/Type_ConfigChatRoom";
import throwError from "../../helpers/ThrowErrorOfController";


export const methods = {
    /**
     * Lấy hoặc tạo chat giữa 2 người
     */
    getOrCreateChat: async (
        senderId: string,
        receiverId: string
    ): Promise<any> => {
        const transaction = await sequelize.transaction();
        try {
            // Kiểm tra chat đã tồn tại
            let existingChat = await chatModel.selectChatBySenderAndReceiver(
                senderId,
                receiverId
            );

            if (existingChat) {
                await transaction.commit();
                return {
                    chat: existingChat,
                    created: false
                };
            }

            // Tạo chat mới
            const newChat = await chatModel.createChat(
                {
                    sender_id: senderId,
                    receiver_id: receiverId,
                    type: 'chat'
                },
                transaction
            );

            if (!newChat) {
                throw new Error('Failed to create chat');
            }

            // Tạo chat members
            await chat_memberController.createAdmins(
                { selectedChatId: newChat.id, userIds: [senderId, receiverId] },
                transaction
            );

            // Tạo config mặc định cho 2 người
            await config_chatController.createDefaultConfig(newChat.id, senderId, transaction);
            await config_chatController.createDefaultConfig(newChat.id, receiverId, transaction);

            await transaction.commit();

            return {
                chat: newChat,
                created: true
            };
        } catch (error) {
            await transaction.rollback();
            console.error('Error in getOrCreateChat:', error);
            throw error;
        }
    },

    /**
     * Lấy thông tin đầy đủ của chat (config, notifications, messages)
     */
    getChatFullData: async (
        chatId: number,
        userId: string
    ): Promise<any> => {
        try {
            // Lấy thông tin chat
            const chat = await chatModel.selectChatById(chatId);
            if (!chat) {
                throw new Error('Chat not found');
            }

            // Lấy config của user
            const config = await config_chatController.getConfig(chatId, userId);

            // Lấy 5 notifications mới nhất
            const latestNotifications = await getNotificationsChat(chatId, userId);

            // Lấy tin nhắn
            const messages = await contentsChatController.getMessages(chatId, 1, 50);

            if (messages) {

                return {
                    chat,
                    config,
                    notifications: latestNotifications,
                    messages: messages.reverse(), // Đảo ngược để hiển thị từ cũ đến mới
                };
            } else {
                return {
                    chat,
                    config,
                    notifications: latestNotifications
                };
            }
        } catch (error) {
            console.error('Error in getChatFullData:', error);
            throw error;
        }
    },

    /**
     * Thêm thành viên vào chat/group
     */
    addMembers: async (
        chatId: number,
        adminId: string,
        newMemberIds: string[],
    ): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            // Kiểm tra quyền admin
            const isAdmin = await chat_memberController.isAdmin(chatId, adminId);
            if (!isAdmin) {
                throw new Error('Only admin can add members');
            }


            await chat_memberController.createGuests({ selectedChatId: chatId, userIds: newMemberIds }, transaction);

            // Tạo config cho members mới
            for (const userId of newMemberIds) {
                await config_chatController.createDefaultConfig(chatId, userId, transaction);
            }

            // Kiểm tra và cập nhật type của chat
            const memberCount = await chat_memberController.countMembers(chatId, transaction);
            const newType = memberCount === 2 ? 'chat' : 'group';
            chatModel.updateChat({ type: newType }, { id: chatId }, transaction);

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            console.error('Error in addMembers:', error);
            throw error;
        }
    },

    /**
     * Xóa thành viên khỏi chat/group
     */
    removeMember: async (
        chatId: number,
        adminId: string,
        removedUserId: string,
    ): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            // Kiểm tra quyền admin
            const isAdmin = await chat_memberController.isAdmin(chatId, adminId);
            if (!isAdmin && adminId !== removedUserId) {
                throw new Error('Only admin can remove members');
            }

            // Xóa member
            await chat_memberController.remove(chatId, removedUserId, transaction);

            // Xóa config
            await config_chatController.deleteConfig(chatId, removedUserId, transaction);

            // Kiểm tra và cập nhật type của chat
            const memberCount = await chat_memberController.countMembers(chatId, transaction);
            const newType = memberCount === 2 ? 'chat' : 'group';
            chatModel.updateChat({ type: newType }, { id: chatId }, transaction);



            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            console.error('Error in removeMember:', error);
            throw error;
        }
    },

    /**
     * Gửi tin nhắn
     */
    sendMessage: async (
        chatId: number,
        author: string,
        content: string,
        type: 'text' | 'image' | 'file' = 'text'
    ): Promise<any> => {
        try {
            // Kiểm tra user có trong chat không
            const members = await chat_memberController.selectMembers(false, chatId, author, status);

            if (members.length === 0) {
                throw new Error('User is not a member of this chat');
            }

            // Tạo tin nhắn
            const message = await contentsChatController.createMessage(
                chatId,
                author,
                content,
                type
            );

            // Cập nhật updatedAt của chat
            await chatModel.updateChat(
                { updatedAt: new Date() } as any,
                { id: chatId }
            );

            return message;
        } catch (error) {
            console.error('Error in sendMessage:', error);
            throw error;
        }
    },

    /**
     * Xóa tin nhắn
     */
    deleteMessage: async (
        messageId: number,
        userId: string,
        chatId: number
    ): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            // Kiểm tra xem user có phải admin không
            const isAdmin = await chat_memberController.isAdmin(chatId, userId);

            // Xóa tin nhắn
            const deleted = await contentsChatController.deleteMessage(
                messageId,
                userId,
                isAdmin,
                transaction
            );

            if (deleted === 0) {
                throw new Error('Message not found or permission denied');
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            console.error('Error in deleteMessage:', error);
            throw error;
        }
    },

    /**
     * Chuyển type chat <-> group
     */
    // convertChatType: async (
    //     chatId: number,
    //     adminId: string
    // ): Promise<string> => {
    //     const transaction = await sequelize.transaction();
    //     try {
    //         // Kiểm tra quyền admin
    //         const isAdmin = await chatMemberMethods.isAdmin(chatId, adminId);
    //         if (!isAdmin) {
    //             throw new Error('Only admin can convert chat type');
    //         }

    //         const newType = await chatMethods.checkAndUpdateChatType(
    //             chatId,
    //             transaction
    //         );

    //         await transaction.commit();
    //         return newType;
    //     } catch (error) {
    //         await transaction.rollback();
    //         console.error('Error in convertChatType:', error);
    //         throw error;
    //     }
    // },

    /**
     * Cập nhật config chat
     */
    updateChatConfig: async (
        chatId: number,
        userId: string,
        configData: ConfigChatRoom
    ): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            await config_chatController.updateConfig(chatId, userId, configData, transaction);

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            console.error('Error in updateChatConfig:', error);
            throw error;
        }
    },

    /**
     * Lấy danh sách chat của user
     */
    getUserChats: async (userId: string): Promise<any[]> => {
        try {
            return await chatModel.selectUserChats(userId);
        } catch (error) {
            console.error('Error in getUserChats:', error);
            throw error;
        }
    },

    /**
     * Tìm kiếm tin nhắn trong chat
     */
    searchMessages: async (
        chatId: number,
        searchTerm: string,
        page: number = 1
    ): Promise<any[]> => {
        try {
            return await contentsChatController.searchMessages(chatId, searchTerm, page);
        } catch (error) {
            console.error('Error in searchMessages:', error);
            throw error;
        }
    },

    /**
     * Chuyển quyền admin
     */
    transferAdmin: async (
        chatId: number,
        currentAdminId: string,
        newAdminId: string,
        notificationValue: NotificationServerTake
    ): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            // Kiểm tra quyền admin hiện tại
            const isAdmin = await chat_memberController.isAdmin(chatId, currentAdminId);
            if (!isAdmin) {
                throw new Error('You are not admin');
            }

            // Chuyển quyền
            await chat_memberController.transferAdmin(
                chatId,
                currentAdminId,
                newAdminId,
                transaction
            );

            // Cập nhật admin trong bảng chat
            await chatModel.updateChat(
                { admin: newAdminId },
                { id: chatId },
                transaction
            );

            // Tạo thông báo
            await create(notificationValue as any, transaction);

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            console.error('Error in transferAdmin:', error);
            throw error;
        }
    },
    selectChatById: async (chatId: number): Promise<chat | null> => {
        try {
            return await chatModel.selectChatById(chatId);
        } catch (err) {
            throwError(err);
        }
    }
};


