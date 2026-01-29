import express, { Request, Response, NextFunction, Router } from 'express';
import { methods as chatController } from "../constrollers/chat/chat";
import { methods as chat_memberController } from '../constrollers/chat/chat_members';
import { User } from '../models/user';
import { Op } from 'sequelize';
import NotificationServerTake from '../types/Type_Notification';
import ExtendRequest from '../types/Type_ExtendRequest';
import throwError from '../helpers/ThrowErrorOfRouter';
import { chat } from '../models/chat/chat';
import { authenticate } from '../middware/auth';

const router: Router = express.Router();

/**
 * GET /chat/list
 * Lấy danh sách chat của user
 */
router.get('/list', authenticate.user_auth, async (req: ExtendRequest, res: Response) => {
    try {
        const userId = req.admin?.id;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const chats = await chatController.getUserChats(userId);

        res.json({
            success: true,
            chats
        });
    } catch (error) {
        throwError(error, res);
    }
});

/**
 * GET /chat/detail
 * Lấy thông tin đầy đủ của chat
 */
router.get('/detail', authenticate.user_auth, async (req: ExtendRequest, res: Response, next: NextFunction) => {
    try {
        const chatId = Number(req.query.chatId);
        const userId = req.admin?.id;

        if (!chatId || !userId) {
            return res.status(400).json({ error: 'chatId and userId are required' });
        }

        const chatData = await chatController.getChatFullData(chatId, userId);

        res.json({
            success: true,
            data: chatData
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/**
 * POST /chat/create
 * Tạo chat giữa 2 người
 */
router.post('/create', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { senderId, receiverId } = req.body;

        if (!senderId || !receiverId) {
            return res.status(400).json({ error: 'senderId and receiverId are required' });
        }

        const result = await chatController.getOrCreateChat(senderId, receiverId);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/**
 * POST /chat/members/add
 * Thêm thành viên vào chat
 */
// router.post('/members/add', async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { chatId, adminId, memberIds, notification } = req.body;

//         if (!chatId || !adminId || !memberIds || !Array.isArray(memberIds)) {
//             return res.status(400).json({
//                 error: 'chatId, adminId, and memberIds (array) are required'
//             });
//         }

//         await chatController.addMembers(chatId, adminId, memberIds);

//         res.json({
//             success: true,
//             message: 'Members added successfully'
//         });
//     } catch (error) {
//         console.error(error);
//         next(error);
//     }
// });

/**
 * DELETE /chat/members/remove
 * Xóa thành viên khỏi chat
 */
// router.delete('/members/remove', async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { chatId, adminId, removedUserId, notification } = req.body;

//         if (!chatId || !adminId || !removedUserId) {
//             return res.status(400).json({
//                 error: 'chatId, adminId, and removedUserId are required'
//             });
//         }

//         await chatController.removeMember(chatId, adminId, removedUserId);

//         res.json({
//             success: true,
//             message: 'Member removed successfully'
//         });
//     } catch (error) {
//         console.error(error);
//         next(error);
//     }
// });

/**
 * GET /chat/members/search
 * Tìm kiếm thành viên để thêm vào chat
 */
router.get('/members/search', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const name = req.query.name as string;
        const idUser = req.query.idUser as string;
        const idChatRoom = Number(req.query.chatId);

        if (!name || !idUser || !idChatRoom) {
            return res.status(400).json({
                error: 'name, idUser, and chatId are required'
            });
        }

        // Lấy danh sách thành viên hiện tại
        const chatMembers = await chat_memberController.selectMembers(
            true,
            idChatRoom,
            idUser,
            status
        );

        const existingUserIds = chatMembers.map(m => m.idUser);

        // Lấy danh sách bạn bè (giả sử có model user_user như trong code mẫu)
        const { user_user } = require('../models/user_user');
        const friends = await user_user.findAll({
            where: {
                status: 'done',
                [Op.or]: [
                    { id_userA: idUser },
                    { id_userB: idUser }
                ]
            },
            attributes: ['id_userB', 'id_userA'],
            include: [
                {
                    model: User,
                    as: 'userA',
                    attributes: ['id', 'name', 'avatar']
                },
                {
                    model: User,
                    as: 'userB',
                    attributes: ['id', 'name', 'avatar']
                }
            ]
        });

        // Lọc danh sách bạn theo name
        const searchedFriends = friends
            .map((f: any) => {
                if (f.id_userA === idUser) return f.userB;
                return f.userA;
            })
            .filter((friend: any) =>
                friend.name.toLowerCase().startsWith(name.toLowerCase())
            );

        // Loại bỏ bạn đã có trong chat
        const filteredFriendList = searchedFriends.filter(
            (friend: any) => !existingUserIds.includes(friend.id)
        );

        res.json({
            success: true,
            chatMembers,
            friendList: filteredFriendList
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/**
 * POST /chat/message/send
 * Gửi tin nhắn
 */
// router.post('/message/send', async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { chatId, author, content, type } = req.body;

//         if (!chatId || !author || !content) {
//             return res.status(400).json({
//                 error: 'chatId, author, and content are required'
//             });
//         }

//         const message = await chatController.sendMessage(
//             chatId,
//             author,
//             content,
//             type || 'text'
//         );

//         res.json({
//             success: true,
//             message
//         });
//     } catch (error) {
//         console.error(error);
//         next(error);
//     }
// });

/**
 * DELETE /chat/message/delete
 * Xóa tin nhắn
 */
// router.delete('/message/delete', async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { messageId, userId, chatId } = req.body;

//         if (!messageId || !userId || !chatId) {
//             return res.status(400).json({
//                 error: 'messageId, userId, and chatId are required'
//             });
//         }

//         await chatController.deleteMessage(messageId, userId, chatId);

//         res.json({
//             success: true,
//             message: 'Message deleted successfully'
//         });
//     } catch (error) {
//         console.error(error);
//         next(error);
//     }
// });

/**
 * GET /chat/message/search
 * Tìm kiếm tin nhắn
 */
router.get('/message/search', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const chatId = Number(req.query.chatId);
        const searchTerm = req.query.searchTerm as string;
        const page = Number(req.query.page) || 1;

        if (!chatId || !searchTerm) {
            return res.status(400).json({
                error: 'chatId and searchTerm are required'
            });
        }

        const messages = await chatController.searchMessages(chatId, searchTerm, page);

        res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

/**
 * PUT /chat/config
 * Cập nhật config chat
 */
// router.put('/config', async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { chatId, userId, nickName, theme, notifications } = req.body;

//         if (!chatId || !userId) {
//             return res.status(400).json({
//                 error: 'chatId and userId are required'
//             });
//         }

//         const configData: any = {};
//         if (nickName !== undefined) configData.nickName = nickName;
//         if (theme !== undefined) configData.theme = theme;
//         if (notifications !== undefined) configData.notifications = notifications;

//         await chatController.updateChatConfig(chatId, userId, configData);

//         res.json({
//             success: true,
//             message: 'Config updated successfully'
//         });
//     } catch (error) {
//         console.error(error);
//         next(error);
//     }
// });

/**
 * PUT /chat/convert-type
 * Chuyển đổi type chat <-> group
 */
// router.put('/convert-type', async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { chatId, adminId } = req.body;

//         if (!chatId || !adminId) {
//             return res.status(400).json({
//                 error: 'chatId and adminId are required'
//             });
//         }

//         const newType = await chatController.convertChatType(chatId, adminId);

//         res.json({
//             success: true,
//             newType
//         });
//     } catch (error) {
//         console.error(error);
//         next(error);
//     }
// });

/**
 * PUT /chat/transfer-admin
 * Chuyển quyền admin
 */
// router.put('/transfer-admin', async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { chatId, currentAdminId, newAdminId, notification } = req.body;

//         if (!chatId || !currentAdminId || !newAdminId) {
//             return res.status(400).json({
//                 error: 'chatId, currentAdminId, and newAdminId are required'
//             });
//         }

//         await chatController.transferAdmin(
//             chatId,
//             currentAdminId,
//             newAdminId,
//             notification
//         );

//         res.json({
//             success: true,
//             message: 'Admin transferred successfully'
//         });
//     } catch (error) {
//         console.error(error);
//         next(error);
//     }
// });

export { router };