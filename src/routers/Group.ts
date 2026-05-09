import express, { Response } from "express";
import { GroupController } from "../Constrollers/GroupController";
import { transformPostServices } from "../Helpers/TransformerPost";
import { authenticate } from "../Middlewares/Auth";
import ExtendRequest from "../Types/ExtendRequest";

// ============================================================
// GROUP ROUTES
// Responsibility: Define endpoints, attach middleware, call controller
// ============================================================

const router = express.Router();

// ==================== RENDER PAGES ====================

router.post('/', authenticate.user_auth, async (req: ExtendRequest, res: Response) => {
    try {
        const { groupId } = req.body;
        const userId = req.admin?.id;
        if (!userId) {
            res.status(403).send({ success: false, error: "khong co quyen" });
            return;
        }

        const pageData = await GroupController.getGroupPageData(userId, groupId);

        res.render('Contents/Groups/Main', {
            ...pageData,
            user_id: userId
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// ==================== POST MANAGEMENT ====================

router.post('/posts/delete', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const { postId, groupId } = req.body;
        const userId = req.admin?.id;

        if (!userId) {
            res.status(403).json({ success: false, error: "khong co quyen" });
            return;
        }

        const result = await GroupController.deletePost(userId, groupId, postId);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Lỗi server' });
    }
});

router.post('/posts/update', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const { postId, content, scope, think } = req.body;
        const userId = req.admin?.id;

        if (!userId) {
            res.status(403).json({ success: false, error: "khong co quyen" });
            return;
        }

        const result = await GroupController.updatePost(userId, postId, content, scope, think);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Lỗi server' });
    }
});

router.get('/posts/sort', authenticate.user_auth, async (req: ExtendRequest, res: Response) => {
    try {
        const groupId = Number(req.query.groupId);
        const sort = req.query.sort as string || 'like';
        const userId = req.admin?.id;

        if (!userId) {
            res.status(403).json({ success: false, error: "khong co quyen" });
            return;
        }

        const posts = await GroupController.getGroupPostsSorted(groupId, userId, sort);
        const transformedPosts = transformPostServices.transformPosts(posts);

        res.json({ success: true, posts: transformedPosts });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Lỗi server' });
    }
});

// ==================== MEMBER MANAGEMENT ====================

router.get('/members', authenticate.user_auth, async (req: ExtendRequest, res: Response) => {
    try {
        const groupId = Number(req.query.groupId);
        const searchName = req.query.name as string;
        const userId = req.admin?.id;
        if (!userId) {
            res.status(403).json({ success: false, error: "khong co quyen" });
            return;
        }

        const members = await GroupController.getGroupMembers(userId, groupId, searchName);
        res.json({ success: true, members });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "An error occurred while retrieving group members." });
    }
});

router.get('/members/pending', authenticate.user_auth, async (req: ExtendRequest, res: Response) => {
    try {
        const groupId = Number(req.query.groupId);
        const userId = req.admin?.id;
        if (!userId) {
            res.status(403).json({ success: false, error: "khong co quyen" });
            return;
        }

        const requests = await GroupController.getPendingRequests(userId, groupId);
        res.json({ success: true, requests });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "An error occurred while retrieving pending requests." });
    }
});

router.post('/members/accept', authenticate.user_auth, async (req: ExtendRequest, res: Response) => {
    try {
        const { groupId, targetUserId } = req.body;
        const userId = req.admin?.id;
        if (!userId) {
            res.status(403).json({ success: false, error: "khong co quyen" });
            return;
        }

        await GroupController.acceptJoinRequest(
            userId, groupId, targetUserId,
            {
                selectedSenderId: userId,
                receiver_id: targetUserId,
                content: `Bạn đã được chấp nhận vào nhóm ${groupId}`,
                type: 'static'
            }
        );

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "An error occurred while accepting join request." });
    }
});

router.post('/members/reject', authenticate.user_auth, async (req: ExtendRequest, res: Response) => {
    try {
        const { groupId, targetUserId } = req.body;
        const userId = req.admin?.id;
        if (!userId) {
            res.status(403).json({ success: false, error: "khong co quyen" });
            return;
        }

        await GroupController.rejectJoinRequest(
            userId, groupId, targetUserId,
            { receiver_id: targetUserId, content: '', type: 'static' }
        );

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "An error occurred while rejecting join request." });
    }
});

router.delete('/members/remove', authenticate.user_auth, async (req: ExtendRequest, res: Response) => {
    try {
        const { groupId, targetUserId } = req.body;
        const userId = req.admin?.id;
        if (!userId) {
            res.status(403).json({ success: false, error: "khong co quyen" });
            return;
        }

        await GroupController.removeMember(
            userId, groupId, targetUserId,
            {
                selectedSenderId: userId,
                receiver_id: targetUserId,
                content: `Bạn đã bị xóa khỏi nhóm ${groupId}`,
                type: 'static'
            }
        );

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "An error occurred while removing member." });
    }
});

// ==================== JOIN / LEAVE ====================

router.post('/join', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const { groupId } = req.body;
        const userId = req.admin?.id;
        if (!userId) {
            res.status(403).json({ success: false, error: "khong co quyen" });
            return;
        }

        await GroupController.joinGroup(userId, groupId);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "An error occurred while sending join request." });
    }
});

router.post('/leave', authenticate.user_auth, async (req: ExtendRequest, res: Response) => {
    try {
        const { groupId } = req.body;
        const userId = req.admin?.id;
        if (!userId) {
            res.status(403).json({ success: false, error: "khong co quyen" });
            return;
        }

        await GroupController.leaveGroup(userId, groupId);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "An error occurred while leaving group." });
    }
});

router.post('/check', authenticate.user_auth, async (req: ExtendRequest, res: Response): Promise<void> => {
    try {
        const userId = req.admin?.id;
        const { id_group } = req.body as { id_group: number };

        if (!userId) {
            res.status(403).send('Khong co quyen');
            return;
        }

        if (!id_group) {
            res.status(400).json({ error: true, message: 'Missing group id' });
            return;
        }

        const result = await GroupController.checkMembershipStatus(userId, id_group);

        let data = null;
        if (result.status === 'active') {
            data = { isMember: true, isAdmin: result.isAdmin };
        } else if (result.status === 'pending') {
            data = { isPending: true };
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error in POST /group/check route:', error);
        res.status(500).json({ error: true, message: 'Internal server error' });
    }
});

export default router;
