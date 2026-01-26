// routes/group.ts
import express, { Request, Response, Router } from "express";
import { methods as groupuserController } from "../constrollers/page_manager/Ctrl_GroupUser";
import { methods as groupController } from "../constrollers/group"
import { methods as postController } from "../constrollers/Posts";
import { transformPostServices } from "../helpers/TransformerPost";
import { addNotification, sendNotification } from '../services/FollowerService';
import throwError from "../helpers/ThrowErrorOfRouter";
import { authenticate } from "../middware/auth";
import ExtendRequest from "../types/Type_ExtendRequest";
import NotificationServerTake from "../types/Type_Notification";

const router: Router = express.Router();

// ==================== RENDER PAGES ====================

// Trang nhóm chính
router.post('/', authenticate.user_auth, async (req: ExtendRequest, res: Response) => {
    try {
        const { groupId } = req.body;
        const userId = req.admin?.id; // Giả sử có session
        if (!userId) {
            res.status(403).send({ success: false, error: "khong co quyen" });
            return;
        }
        const membershipStatus = await groupuserController.checkMembershipStatus(userId, groupId);

        // if (!membershipStatus.exists || membershipStatus.status !== 'active') {
        //     return res.redirect('/main');
        // }

        const group = await groupController.selectGroup(groupId);
        const posts = await groupController.getGroupPostsSorted(groupId, userId);
        const transformedPosts = transformPostServices.transformPosts(posts);

        res.render('contens/groups/main', {
            group: group?.toJSON(),
            Posts: transformedPosts,
            isAdmin: membershipStatus.isAdmin,
            isMember: membershipStatus.status === 'active',
            isPending: membershipStatus.status === 'pending',
            user_id: userId
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// ==================== POST MANAGEMENT ====================

// Xóa bài viết (admin hoặc chủ bài viết)
router.post('/posts/delete', authenticate.user_auth, async (req: ExtendRequest, res: Response) => {
    try {
        const { postId, groupId } = req.body;
        const userId = req.admin?.id;

        const post = await postController.selectPostById(postId);
        if (!post) {
            return res.json({ success: false, message: 'Bài viết không tồn tại' });
        }
        if (!userId) {
            res.status(403).send({ success: false, error: "khong co quyen" });
            return;
        }

        const membershipStatus = await groupuserController.checkMembershipStatus(userId, groupId);

        // Cho phép xóa nếu là admin hoặc chủ bài viết
        if (membershipStatus.isAdmin || post.user_id === userId) {
            await postController.delPost(postId);

            // Gửi thông báo nếu admin xóa bài của người khác
            if (membershipStatus.isAdmin && post.user_id !== userId) {
                const notification_value: NotificationServerTake = {
                    selectedIdChatRoom: groupId,
                    receiver_id: post.user_id,
                    content: `Admin đã xóa bài viết ${postId} của bạn trong nhóm ${groupId}`,
                    type: 'static'
                }
                await addNotification(notification_value);
                if (!notification_value.id) {
                    res.status(500).send({ success: false, err: "loi khi tao thong bao" });
                    return;
                }
                sendNotification(notification_value.id, notification_value);
            }

            return res.json({ success: true });
        }

        res.json({ success: false, message: 'Không có quyền xóa bài viết' });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Lỗi server' });
    }
});

// Sửa bài viết (chỉ chủ bài viết)
router.post('/posts/update', authenticate.user_auth, async (req: ExtendRequest, res: Response) => {
    try {
        const { postId, content, scope, think } = req.body;
        const userId = req.admin?.id;

        const post = await postController.selectPostById(postId);
        if (!post) {
            return res.json({ success: false, message: 'Bài viết không tồn tại' });
        }

        if (post.user_id !== userId) {
            return res.json({ success: false, message: 'Không có quyền sửa bài viết' });
        }

        await postController.update(post.PostId_origin, postId, content, scope, think);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Lỗi server' });
    }
});

// Xóa tất cả bài viết (chỉ admin)
// router.post('/posts/delete-all', async (req: Request, res: Response) => {
//     try {
//         const { groupId } = req.body;
//         const userId = req.session.userId;

//         const deletedCount = await groupController.deleteAllPosts(userId, groupId);
//         res.json({ success: true, deletedCount });
//     } catch (error) {
//         console.error(error);
//         res.json({ success: false, message: error.message });
//     }
// });

// Sắp xếp bài viết
router.get('/posts/sort', authenticate.user_auth, async (req: ExtendRequest, res: Response) => {
    try {
        const groupId = Number(req.query.groupId);
        const sort = req.query.sort as string || 'like';
        const userId = req.admin?.id;

        if (!userId) {
            res.status(403).send({ success: false, error: "khong co quyen" });
            return;
        }

        const posts = await groupController.getGroupPostsSorted(groupId, userId, sort);
        const transformedPosts = transformPostServices.transformPosts(posts);

        res.json({ success: true, posts: transformedPosts });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Lỗi server' });
    }
});

// ==================== MEMBER MANAGEMENT ====================

// Lấy danh sách thành viên
router.get('/members', authenticate.user_auth, async (req: ExtendRequest, res: Response) => {
    try {
        const groupId = Number(req.query.groupId);
        const searchName = req.query.name as string;
        const userId = req.admin?.id;
        if (!userId) {
            res.status(403).send({ success: false, error: "khong co quyen" });
            return;
        }

        const members = await groupuserController.getGroupMembers(userId, groupId, searchName);
        res.json({ success: true, members });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: (error as Error).message });
    }
});

// Lấy danh sách yêu cầu tham gia (admin)
router.get('/members/pending', authenticate.user_auth, async (req: ExtendRequest, res: Response) => {
    try {
        const groupId = Number(req.query.groupId);
        const userId = req.admin?.id;
        if (!userId) {
            res.status(403).send({ success: false, error: "khong co quyen" });
            return;
        }
        const pendingRequests = await groupuserController.getPendingRequests(userId, groupId);
        console.log("pendingRequests", pendingRequests)
        res.json({ success: true, requests: pendingRequests });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: (error as Error).message });
    }
});

// Chấp nhận yêu cầu tham gia
router.post('/members/accept', authenticate.user_auth, async (req: ExtendRequest, res: Response) => {
    try {
        const { groupId, targetUserId } = req.body;
        const userId = req.admin?.id;
        if (!userId) {
            res.status(403).send({ success: false, error: "khong co quyen" });
            return;
        }
        await groupuserController.acceptJoinRequest(
            userId,
            groupId,
            targetUserId,
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
        res.json({ success: false, message: (error as Error).message });
    }
});

// Từ chối yêu cầu tham gia
router.post('/members/reject', authenticate.user_auth, async (req: ExtendRequest, res: Response) => {
    try {
        const { groupId, targetUserId } = req.body;
        const userId = req.admin?.id;
        if (!userId) {
            res.status(403).send({ success: false, error: "khong co quyen" });
            return;
        }
        await groupuserController.rejectJoinRequest(
            userId,
            groupId,
            targetUserId,
            {
                receiver_id: targetUserId,
                content: '',
                type: 'static'
            }
        );

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: (error as Error).message });
    }
});

// Xóa thành viên (admin)
router.delete('/members/remove', authenticate.user_auth, async (req: ExtendRequest, res: Response) => {
    try {
        const { groupId, targetUserId } = req.body;
        const userId = req.admin?.id;
        if (!userId) {
            res.status(403).send({ success: false, error: "khong co quyen" });
            return;
        }
        await groupuserController.removeMember(
            userId,
            groupId,
            targetUserId,
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
        res.json({ success: false, message: (error as Error).message });
    }
});

// Gửi yêu cầu tham gia
router.post('/join', authenticate.user_auth, async (req: ExtendRequest, res: Response) => {
    try {
        const { groupId } = req.body;
        const userId = req.admin?.id;
        if (!userId) {
            res.status(403).send({
                success: false,
                error: "khong co quyen"
            });
            return;
        }
        const group = await groupController.selectGroup(groupId);
        if (!group) {
            return res.status(403).json({
                success: false,
                error: 'GROUP_NOT_FOUND'
            });
        }
        if (!group.admin) {
            res.status(500).send({
                success: false,
                error: "loi o ban ghi"
            });
            return;
        }

        await groupuserController.joinGroupRequest(
            userId,
            groupId,
            {
                selectedIdChatRoom: groupId,
                receiver_id: group.admin,
                content: `Có yêu cầu tham gia nhóm mới`,
                type: 'static'
            }
        );

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: (error as Error).message });
    }
});

// Rời nhóm
router.post('/leave', authenticate.user_auth, async (req: ExtendRequest, res: Response) => {
    try {
        const { groupId } = req.body;
        const userId = req.admin?.id;
        if (!userId) {
            res.status(403).send({
                success: false,
                error: "khong co quyen"
            });
            return;
        }
        await groupuserController.leaveGroup(userId, groupId);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: (error as Error).message });
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

        const result = await groupuserController.checkMembershipStatus(userId, id_group);

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