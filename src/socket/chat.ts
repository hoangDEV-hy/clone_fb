import { Socket, Server } from 'socket.io';
import { methods as chatController } from '../constrollers/chat/chat';
import { methods as chatMemberController } from '../constrollers/chat/chat_members';
import { methods as config_chatController } from '../constrollers/Configs/Ctrl_ConfigChat';
import { addNotification, sendNotification } from '../services/FollowerService';


import NotificationServerTake from '../types/Type_Notification';
let active_users: { [userId: string]: string } = {};

export const ChatSocket = {

    /**
     * Gửi và nhận tin nhắn
     */
    sendMessage: (socket: Socket, io: Server, active_users: any) => {
        socket.on(
            'send_message',
            async (
                chatId: number,
                author: string,
                content: string,
                type: 'text' | 'image' | 'file' = 'text'
            ) => {
                try {
                    // Lưu tin nhắn
                    const message = await chatController.sendMessage(
                        chatId,
                        author,
                        content,
                        type
                    );

                    if (!message) {
                        throw new Error('Failed to send message');
                    }

                    // Lấy danh sách members của chat
                    const members = await chatMemberController.selectMembers(
                        false,
                        chatId,
                        author,
                        status
                    );

                    // Gửi tin nhắn đến tất cả members online
                    members.forEach((member) => {
                        const socketId = active_users[member.idUser];
                        if (socketId) {
                            io.to(socketId).emit('receive_message', {
                                chatId,
                                message,
                                author
                            });
                        }
                    });

                    // Gửi thông báo cho những người offline
                    const offlineMembers = members.filter(
                        (m) => !active_users[m.idUser] && m.idUser !== author
                    );

                    for (const member of offlineMembers) {
                        // Kiểm tra config notifications
                        const config = await config_chatController.getConfig(
                            chatId,
                            member.idUser
                        );

                        if (config && config.notifications) {
                            const notification_value: NotificationServerTake = {
                                receiver_id: member.idUser,
                                selectedIdChatRoom: chatId,
                                type: 'static',
                                content: content.substring(0, 50)
                            }
                            const notificationResult = await addNotification(notification_value);
                            sendNotification(notificationResult.id, notification_value);
                        }
                    }
                } catch (err) {
                    console.error('Error in send_message:', err);
                    socket.emit('error', { message: 'Failed to send message' });
                }
            }
        );
    },

    /**
     * Xóa tin nhắn
     */
    deleteMessage: (socket: Socket, io: Server) => {
        socket.on(
            'delete_message',
            async (
                messageId: number,
                userId: string,
                chatId: number
            ) => {
                try {
                    await chatController.deleteMessage(messageId, userId, chatId);

                    // Broadcast đến tất cả members trong chat
                    io.to(`chat_${chatId}`).emit('message_deleted', {
                        messageId,
                        chatId
                    });
                } catch (err) {
                    console.error('Error in delete_message:', err);
                    socket.emit('error', { message: 'Failed to delete message' });
                }
            }
        );
    },

    /**
     * Thêm thành viên
     */
    inviteMembers: (socket: Socket, io: Server) => {
        socket.on(
            'inviteMembers',
            async (
                memberIds: string[],
                notification: NotificationServerTake
            ) => {
                try {
                    // Gửi thông báo cho members mới
                    memberIds.forEach(async (memberId) => {
                        notification.receiver_id = memberId;
                        const notification_value = await addNotification(notification);
                        sendNotification(notification_value.id, notification);
                    });
                } catch (err) {
                    console.error('Error in add_members:', err);
                    socket.emit('error', { message: 'Failed to add members' });
                }
            }
        );
    },
    /**
     * xử lý lời mời vào nhóm
     */
    //khi client click vao tin nhan( lay dau ra nhieu thong tin nhu nay?)
    handleInventMember: (socket: Socket, io: Server) => {
        socket.on('handleInventMembers', async (accept: boolean, chatId: number,
            adminId: string,
            memberIds: string[],
            notification: NotificationServerTake) => {
            if (accept) {
                try {
                    await chatController.addMembers(
                        chatId,
                        adminId,
                        memberIds,
                    );

                    // Lấy lại thông tin chat sau khi thêm members
                    const updatedChat = await chatController.selectChatById(chatId);
                    const members = await chatMemberController.selectMembers(
                        true, chatId
                    );

                    // Broadcast đến tất cả members
                    io.to(`chat_${chatId}`).emit('member_added', {
                        chatId,
                        newMembers: memberIds,
                        chat: updatedChat,
                        allMembers: members
                    });

                    // Gửi thông báo cho admin
                    const notification_value = await addNotification(notification);
                    sendNotification(notification_value.id, notification);
                } catch (err) {
                    console.error('Error in add_members:', err);
                    socket.emit('error', { message: 'Failed to add members' });
                }
            } else {
                const notification_value = await addNotification(notification);
                sendNotification(notification_value.id, notification);
            }
        })
    },

    /**
     * Xóa thành viên
     */
    removeMember: (socket: Socket, io: Server) => {
        socket.on(
            'remove_member',
            async (
                chatId: number,
                adminId: string,
                removedUserId: string,
                notification: NotificationServerTake
            ) => {
                try {
                    await chatController.removeMember(
                        chatId,
                        adminId,
                        removedUserId
                    );

                    // Lấy lại thông tin chat
                    const updatedChat = await chatController.selectChatById(chatId);
                    const members = await chatMemberController.selectMembers(
                        true, chatId
                    );

                    // Broadcast đến tất cả members
                    io.to(`chat_${chatId}`).emit('member_removed', {
                        chatId,
                        removedUserId,
                        chat: updatedChat,
                        allMembers: members
                    });

                    // Thông báo cho người bị xóa
                    const notification_value = await addNotification(notification);
                    sendNotification(notification_value.id, notification);
                } catch (err) {
                    console.error('Error in remove_member:', err);
                    socket.emit('error', { message: 'Failed to remove member' });
                }
            }
        );
    },

    /**
     * Cập nhật config chat
     */
    updateConfig: (socket: Socket, io: Server) => {
        socket.on(
            'update_config',
            async (
                chatId: number,
                userId: string,
                configData: any
            ) => {
                try {
                    await chatController.updateChatConfig(
                        chatId,
                        userId,
                        configData
                    );

                    // Broadcast đến user (có thể có nhiều devices)
                    const socketId = active_users[userId];
                    if (socketId) {
                        io.to(socketId).emit('config_updated', {
                            chatId,
                            configData
                        });
                    }
                } catch (err) {
                    console.error('Error in update_config:', err);
                    socket.emit('error', { message: 'Failed to update config' });
                }
            }
        );
    },

    /**
     * Chuyển đổi type chat <-> group
     */
    // convertChatType: (socket: Socket, io: Server) => {
    //     socket.on(
    //         'convert_chat_type',
    //         async (chatId: number, adminId: string) => {
    //             try {
    //                 const newType = await ChatController.convertChatType(
    //                     chatId,
    //                     adminId
    //                 );

    //                 // Broadcast đến tất cả members
    //                 io.to(`chat_${chatId}`).emit('chat_type_converted', {
    //                     chatId,
    //                     newType
    //                 });
    //             } catch (err) {
    //                 console.error('Error in convert_chat_type:', err);
    //                 socket.emit('error', { message: 'Failed to convert chat type' });
    //             }
    //         }
    //     );
    // },

    /**
     * Chuyển quyền admin
     */
    transferAdmin: (socket: Socket, io: Server) => {
        socket.on(
            'transfer_admin',
            async (
                chatId: number,
                currentAdminId: string,
                newAdminId: string,
                notification: NotificationServerTake
            ) => {
                try {
                    await chatController.transferAdmin(
                        chatId,
                        currentAdminId,
                        newAdminId,
                        notification
                    );

                    // Broadcast đến tất cả members
                    io.to(`chat_${chatId}`).emit('admin_transferred', {
                        chatId,
                        oldAdminId: currentAdminId,
                        newAdminId
                    });

                    // Thông báo cho admin mới
                    const notification_value = await addNotification(notification);
                    sendNotification(notification_value.id, notification);
                } catch (err) {
                    console.error('Error in transfer_admin:', err);
                    socket.emit('error', { message: 'Failed to transfer admin' });
                }
            }
        );
    },

    /**
     * Typing indicator
     */
    typingIndicator: (socket: Socket, io: Server) => {
        socket.on(
            'typing_start',
            (chatId: number, userId: string) => {
                socket.to(`chat_${chatId}`).emit('user_typing', {
                    chatId,
                    userId
                });
            }
        );

        socket.on(
            'typing_stop',
            (chatId: number, userId: string) => {
                socket.to(`chat_${chatId}`).emit('user_stopped_typing', {
                    chatId,
                    userId
                });
            }
        );
    }
};

