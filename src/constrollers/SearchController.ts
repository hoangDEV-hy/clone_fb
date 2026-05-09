import { chat_member } from "../Models/Chats/ChatMember";
import { user_user } from "../Models/UserUser";
import { Op } from "sequelize";
import { User } from "../Models/user";
import throwError from "../Helpers/ThrowErrorOfController";
import { methods as groupController } from "./Groups";
import { methods as userController } from "./User";

// ============================================================
// SEARCH CONTROLLER
// Responsibility: Search for groups and users
// ============================================================

export const SearchController = {
    /**
     * Search chat members and friends by name
     */
    searchChatMembersAndFriends: async (
        name: string,
        idUser: string,
        idChatRoom: number
    ): Promise<{ chatMembers: any[]; friendList: any[] }> => {
        try {
            // 1. Get chat members
            const chatMembers = await chat_member.findAll({
                where: { chat_id: idChatRoom },
                include: [{
                    model: User,
                    as: 'users',
                    required: true,
                    attributes: ['id', 'name', 'avatar'],
                    where: { name: { [Op.like]: `${name}%` } }
                }]
            });

            const existingUserIds = chatMembers.map(m => m.idUser);

            // 2. Get friends
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
                    { model: User, as: 'userA', attributes: ['id', 'name', 'avatar'] },
                    { model: User, as: 'userB', attributes: ['id', 'name', 'avatar'] }
                ]
            });

            // 3. Filter friends by name and exclude existing chat members
            const searchedFriends = friends
                .map((f: any) => {
                    if (f.id_userA === idUser) return f.userB;
                    return f.userA;
                })
                .filter(friend =>
                    friend && friend.name.toLowerCase().startsWith(name.toLowerCase())
                );

            const filteredFriendList = searchedFriends.filter(friend =>
                !existingUserIds.includes(friend.id)
            );

            return {
                chatMembers,
                friendList: filteredFriendList
            };
        } catch (err) {
            throwError(err);
        }
    },

    /**
     * Search groups and users by name
     */
    searchGroupsAndUsers: async (selectedName: string): Promise<any[]> => {
        try {
            const selectedGroups = await groupController.selectGroupsWithName(selectedName) || [];
            const selectedUsers = await userController.selectUsersWithName(selectedName) || [];

            const groupsWithType = selectedGroups.map(g => ({
                ...(g.toJSON ? g.toJSON() : g),
                type: 'group'
            }));

            const usersWithType = selectedUsers.map(u => ({
                ...(u.toJSON ? u.toJSON() : u),
                type: 'user'
            }));

            const merged = [...groupsWithType, ...usersWithType];

            const uniqueList = Array.from(
                new Map(merged.map(item => [item.name, item])).values()
            );

            return uniqueList.map(item =>
                item.toJSON ? item.toJSON() : item
            );
        } catch (err) {
            throwError(err);
        }
    }
};
