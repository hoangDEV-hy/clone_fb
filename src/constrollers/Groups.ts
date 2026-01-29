import { group_user } from "../Models/GroupUser";
import { Group, methods as groupModel } from "../Models/Group";
import { Posts } from "../Models/Post";
import { Op } from "sequelize";
import { sequelize } from "../Configs/Sql";
import { User } from "../Models/user";
import throwError from "../Helpers/ThrowErrorOfController";
import { methods as groupuserController } from "./PageManagers/GroupUsers"
import { methods as postController } from "./Posts"
let methods = {
    joinGroup_list: async (id: string): Promise<any> => {
        const resuil = await group_user.findAll({
            where:
                { id_userA: id, status: 'done' }
            , include: [
                {
                    model: Group,
                    as: 'groups',
                    required: true
                }
            ]
        })
        return resuil;
    },
    PostsAll_group: async (id: string): Promise<any> => {
        // Truy vấn 1: Lấy danh sách group_user mà user tham gia với status 'done'
        const userGroups = await group_user.findAll({
            where: {
                id_userA: id,
                status: 'done'
            }
        });
    
        // Nếu không có group nào, trả về mảng rỗng
        if (!userGroups || userGroups.length === 0) {
            return [];
        }
    
        // Lấy danh sách id_group
        const groupIds = userGroups.map(gu => gu.id_group);
    
        // Truy vấn 2: Lấy posts từ các group đó với scope 'group'
        const posts = await Posts.findAll({
            where: {
                group_id: {
                    [Op.in]: groupIds
                },
                scope: 'group'
            },
            include: [
                {
                    model: User,
                    as: 'users',
                    required: true
                },
                {
                    model: Group,
                    as: 'groups',
                    required: true
                }
            ]
        });
    
        // Map posts vào từng group_user tương ứng
        const result = userGroups.map(groupUser => {
            const groupPosts = posts.filter(post => post.group_id === groupUser.id_group);
            return {
                ...groupUser.toJSON(),
                Posts: groupPosts
            };
        });
    
        // Lọc ra những group_user có posts (vì required: true)
        return result.filter(item => item.Posts.length > 0);
    },
    
    selectGroup: async (id: number): Promise<Group | null> => {
        try {
            return await groupModel.selectGroup({ id: id });
        } catch (err) {
            throwError(err);
        }
    },
    selectGroupsWithName: async (selectedName: string): Promise<Group[] | null> => {
        try {
            return await groupModel.selectGroups({ name: selectedName });
        } catch (err) {
            throwError(err);
        }
    },
    // Lấy danh sách bài viết trong nhóm có sắp xếp
    getGroupPostsSorted: async (
        groupId: number,
        userId: string,
        sort: string = 'like'
    ): Promise<Posts[]> => {
        try {
            // const membership = await groupuserController.checkMembershipStatus(userId, groupId);
            // if (!membership || membership.status !== 'active') {
            //     throw new Error('NOT_A_MEMBER');
            // }
            const scope = "group";

            return await postController.selectPostsWithFilter_InteractionAndUser(
                groupId,
                scope,
                sort
            );
        } catch (err) {
            throwError(err);
        }
    },
    getIdAdmin: async (groupId: number): Promise<string | undefined> => {
        try {

            return groupModel.getIdAdmin(groupId);
        } catch (err) {
            throwError(err);
        }
    }
    // Xóa tất cả bài viết trong nhóm (chỉ admin)
    // deletePostsForAdmin: async (
    //     adminId: string,
    //     groupId: number
    // ): Promise<number> => {
    //     const transaction = await sequelize.transaction();
    //     try {
    //         const group = await groupModel.selectGroup({ id: groupId });
    //         if (!group || group.admin !== adminId) {
    //             throw new Error('NOT_GROUP_ADMIN');
    //         }

    //         const deletedCount = await postModel.des({ group_id: groupId });

    //         await transaction.commit();
    //         return deletedCount;
    //     } catch (error) {
    //         await transaction.rollback();
    //         console.error('Error in deleteAllPosts controller:', error);
    //         throw error;
    //     }
    // },

}
export { methods };