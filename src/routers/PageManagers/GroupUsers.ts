import express, { Response } from 'express';
import { authenticate } from '../../Middlewares/Auth';
import { PageManagerGroupController } from '../../Constrollers/PageManagers/PageManagerGroupController';
import ExtendRequest from '../../Types/ExtendRequest';
import throwError from '../../Helpers/ThrowErrorOfRouter';
import NotificationServerTake from '../../Types/Notification';

// ============================================================
// PAGE MANAGER GROUP ROUTES
// Responsibility: Define endpoints, attach middleware, call controller
// ============================================================

const router = express.Router();

// Get joined groups (status: 'active')
router.get('/joined', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const userId = req.admin!.id;
        if (!userId) {
            res.status(403).send('Không có quyền');
            return;
        }

        const plainGroups = await PageManagerGroupController.selectGroupsJoined(userId);
        res.render('Contents/PageManagers/GroupUser', { group: plainGroups });
    } catch (error) {
        throwError(error, res);
    }
});

// Get pending groups (status: 'pending')
router.get('/pending', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const id = req.admin?.id;
        if (!id) {
            res.status(403).send('Không có quyền');
            return;
        }

        const plainGroups = await PageManagerGroupController.selectGroupsPending(id);

        const groupsWithPending = plainGroups.map(group => ({
            ...group,
            isPending: true
        }));

        res.render('Contents/PageManagers/GroupUser', { group: groupsWithPending });
    } catch (error) {
        throwError(error, res);
    }
});

// Create new group
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

        await PageManagerGroupController.createGroup(adminId, name, hastag);

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

// Reject join request (admin) or cancel request (user)
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

        await PageManagerGroupController.rejectJoinRequest(currentUserId, id_group, id_user, notification_value);

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

// Leave group
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

        await PageManagerGroupController.leaveGroup(userId, id_group);

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

// Check membership status
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

        const result = await PageManagerGroupController.checkMembershipStatus(userId, id_group);

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

export default router;
