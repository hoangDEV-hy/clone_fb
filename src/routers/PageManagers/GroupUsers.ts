import express, { Request, Response } from 'express';
import { authenticate } from '../../Middlewares/Auth';
import { methods as groupController } from '../../Constrollers/PageManagers/GroupUsers';
import ExtendRequest from '../../Types/ExtendRequest';
import throwError from '../../Helpers/ThrowErrorOfRouter';
import NotificationServerTake from '../../Types/Notification';

let router = express.Router();

// Lấy danh sách nhóm đã tham gia (status: 'active')
router.get('/joined', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const userId = req.admin!.id;
        if (!userId) {
            res.status(403).send('Không có quyền');
            return;
        }

        const plainGroups = await groupController.selectGroupsJoined(userId);
        res.render('Contents/PageManagers/GroupUser', { group: plainGroups });
    } catch (error) {
        throwError(error, res);
    }
});

// Lấy danh sách nhóm đang chờ duyệt (status: 'pending')
router.get('/pending', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const id = req.admin?.id;
        if (!id) {
            res.status(403).send('Không có quyền');
            return;
        }

        const plainGroups = await groupController.selectGroupsPending(id);

        // Thêm isPending flag
        const groupsWithPending = plainGroups.map(group => ({
            ...group,
            isPending: true
        }));

        res.render('Contents/PageManagers/GroupUser', { group: groupsWithPending });
    } catch (error) {
        throwError(error, res);
    }
});

// Tạo nhóm mới
router.post('/create', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const adminId = req.admin?.id;
        const { name, hastag } = req.body as { name: string; hastag?: string };

        if (!adminId) {
            res.status(403).send('Không có quyền');
            return;
        }

        if (!name) {
            res.status(400).json({
                error: true,
                message: 'Missing group name'
            });
            return;
        }

        await groupController.createGroup(adminId, name, hastag);

        res.status(201).json({
            success: true,
            message: 'Group created successfully'
        });
    } catch (error) {
        console.error('Error in POST /group/create route:', error);

        if (error instanceof Error) {
            if (error.message === 'GROUP_NAME_EXISTS') {
                res.status(400).json({
                    error: true,
                    message: 'Group name already exists'
                });
                return;
            }
        }

        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

// // Gửi yêu cầu tham gia nhóm (từ user)
// router.post('/join', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
//     try {
//         const userId = req.admin?.id;
//         const {
//             id_group,
//             notification_value
//         } = req.body as {
//             id_group: number;
//             notification_value: NotificationServerTake;
//         };

//         if (!userId) {
//             res.status(403).send('Không có quyền');
//             return;
//         }

//         if (!id_group || notification_value === undefined) {
//             res.status(400).json({
//                 error: true,
//                 message: 'Missing required inputs'
//             });
//             return;
//         }

//         notification_value.selectedSenderId = userId;
//         notification_value.content = `${userId} ${notification_value.content}`;

//         await groupController.joinGroupRequest(userId, id_group, notification_value);

//         res.status(200).json({
//             success: true,
//             message: 'Join request sent successfully'
//         });
//     } catch (error) {
//         console.error('Error in POST /group/join route:', error);

//         if (error instanceof Error) {
//             if (error.message === 'ALREADY_MEMBER') {
//                 res.status(400).json({
//                     error: true,
//                     message: 'Already a member or request pending'
//                 });
//                 return;
//             }
//             if (error.message === 'GROUP_NOT_FOUND') {
//                 res.status(404).json({
//                     error: true,
//                     message: 'Group not found'
//                 });
//                 return;
//             }
//         }

//         res.status(500).json({
//             error: true,
//             message: 'Internal server error'
//         });
//     }
// });

// // Chấp nhận yêu cầu tham gia (chỉ admin nhóm)
// router.put('/accept',
//     authenticate.user_auth,
//     groupAuthMiddleware.checkGroupAdmin,
//     async (req: ExtendRequest, res: Response): Promise<void> => {
//         try {
//             const adminId = req.admin?.id;
//             const {
//                 id_group,
//                 id_user,
//                 notification_value
//             } = req.body as {
//                 id_group: number;
//                 id_user: string;
//                 notification_value: NotificationServerTake;
//             };

//             if (!adminId) {
//                 res.status(403).send('Không có quyền');
//                 return;
//             }

//             if (!id_group || !id_user || notification_value === undefined) {
//                 res.status(400).json({
//                     error: true,
//                     message: 'Missing required inputs'
//                 });
//                 return;
//             }

//             notification_value.selectedSenderId = adminId;
//             notification_value.content = `${adminId} ${notification_value.content}`;

//             await groupController.acceptJoinRequest(adminId, id_group, id_user, notification_value);

//             res.status(200).json({
//                 success: true,
//                 message: 'Join request accepted successfully'
//             });
//         } catch (error) {
//             console.error('Error in PUT /group/accept route:', error);

//             if (error instanceof Error) {
//                 if (error.message === 'NOT_GROUP_ADMIN') {
//                     res.status(403).json({
//                         error: true,
//                         message: 'Only group admin can accept requests'
//                     });
//                     return;
//                 }
//                 if (error.message === 'REQUEST_NOT_FOUND') {
//                     res.status(404).json({
//                         error: true,
//                         message: 'Join request not found'
//                     });
//                     return;
//                 }
//             }

//             res.status(500).json({
//                 error: true,
//                 message: 'Internal server error'
//             });
//         }
//     });

// Xóa yêu cầu tham gia (admin từ chối hoặc user hủy yêu cầu)
router.delete('/reject', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const currentUserId = req.admin?.id;
        const {
            id_group,
            id_user,
            notification_value
        } = req.body as {
            id_group: number;
            id_user: string;
            notification_value: NotificationServerTake;
        };

        if (!currentUserId) {
            res.status(403).send('Không có quyền');
            return;
        }

        if (!id_group || !id_user || notification_value === undefined) {
            res.status(400).json({
                error: true,
                message: 'Missing required inputs'
            });
            return;
        }

        // Kiểm tra quyền: phải là admin (từ session) hoặc chính user đó
        const isAdmin = req.session.admin === true;
        const isSelf = currentUserId === id_user;

        if (!isAdmin && !isSelf) {
            res.status(403).json({
                error: true,
                message: 'Not authorized to perform this action'
            });
            return;
        }

        notification_value.selectedSenderId = currentUserId;
        notification_value.content = `${currentUserId} ${notification_value.content}`;

        await groupController.rejectJoinRequest(currentUserId, id_group, id_user, notification_value);

        res.status(200).json({
            success: true,
            message: 'Join request rejected successfully'
        });
    } catch (error) {
        console.error('Error in DELETE /group/reject route:', error);

        if (error instanceof Error) {
            if (error.message === 'UNAUTHORIZED') {
                res.status(403).json({
                    error: true,
                    message: 'Not authorized to perform this action'
                });
                return;
            }
            if (error.message === 'REQUEST_NOT_FOUND') {
                res.status(404).json({
                    error: true,
                    message: 'Join request not found'
                });
                return;
            }
        }

        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

// Rời nhóm
router.delete('/leave', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const userId = req.admin?.id;
        const { id_group } = req.body as { id_group: number };

        if (!userId) {
            res.status(403).send('Không có quyền');
            return;
        }

        if (!id_group) {
            res.status(400).json({
                error: true,
                message: 'Missing group id'
            });
            return;
        }

        await groupController.leaveGroup(userId, id_group);

        res.status(200).json({
            success: true,
            message: 'Left group successfully'
        });
    } catch (error) {
        console.error('Error in DELETE /group/leave route:', error);

        if (error instanceof Error) {
            if (error.message === 'CANNOT_LEAVE_AS_ADMIN') {
                res.status(400).json({
                    error: true,
                    message: 'Admin cannot leave group. Transfer ownership first.'
                });
                return;
            }
            if (error.message === 'NOT_A_MEMBER') {
                res.status(400).json({
                    error: true,
                    message: 'You are not a member of this group'
                });
                return;
            }
        }

        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});

// Kiểm tra trạng thái thành viên trong nhóm
router.post('/check', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const userId = req.admin?.id;
        const { id_group } = req.body as { id_group: number };

        if (!userId) {
            res.status(403).send('Không có quyền');
            return;
        }

        if (!id_group) {
            res.status(400).json({
                error: true,
                message: 'Missing group id'
            });
            return;
        }

        const result = await groupController.checkMembershipStatus(userId, id_group);

        let data = null;
        if (result.status === 'active') {
            data = { isMember: true, isAdmin: result.isAdmin };
        } else if (result.status === 'pending') {
            data = { isPending: true };
        }

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error in POST /group/check route:', error);
        res.status(500).json({
            error: true,
            message: 'Internal server error'
        });
    }
});


export { router };