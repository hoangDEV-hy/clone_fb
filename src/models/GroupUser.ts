import { Model, DataTypes, Op, Transaction } from "sequelize";
import { sequelize } from '../Configs/Sql';


class group_user extends Model {
    public id!: number;
    public id_userA!: string;
    public id_group!: number;
    public status!: string;
}

group_user.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    id_userA: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    id_group: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    }
},
    {

        sequelize,
        modelName: 'group_user',
        timestamps: false,
        tableName: 'groups_users'
    })

//setup association
import { Group } from "./Group";
import { Posts } from "./Post";
import throwError from "../Helpers/ThrowErrorOfSqlQuery";
group_user.belongsTo(Group, { foreignKey: 'id_group', as: 'groups' });
group_user.hasMany(Posts, {
    foreignKey: 'group_id',
    as: 'Posts'
});
export { group_user };

export let methods = {
    // Thêm thành viên vào nhóm
    addMember: async (
        userId: string,
        groupId: number,
        status: 'pending' | 'active',
        transaction?: Transaction
    ): Promise<group_user> => {
        try {
            return await group_user.create({
                id_userA: userId,
                id_group: groupId,
                status
            }, { transaction });
        } catch (err) {
            throwError(err);
        }
    },
    // Xóa thành viên khỏi nhóm
    deleteMember: async (
        userId: string,
        groupId: number,
        status?: string,
        transaction?: Transaction
    ): Promise<number> => {
        try {
            const whereClause: any = {
                id_userA: userId,
                id_group: groupId
            };

            if (status) {
                whereClause.status = status;
            }

            return await group_user.destroy({
                where: whereClause,
                transaction
            });
        } catch (err) {
            throwError(err);
        }
    },
    // Cập nhật trạng thái thành viên
    updateMemberStatus: async (
        userId: string,
        groupId: number,
        newStatus: string,
        transaction?: Transaction
    ): Promise<number> => {
        try {
            const [affectedRows] = await group_user.update(
                { status: newStatus },
                {
                    where: {
                        id_userA: userId,
                        id_group: groupId,
                        status: 'pending'
                    },
                    transaction
                }
            );
            return affectedRows;
        } catch (err) {
            throwError(err);
        }
    },
    // Lấy danh sách nhóm đã tham gia (status: 'active')
    selectGroupsJoined: async (userId: string): Promise<group_user[]> => {
        try {
            return await group_user.findAll({
                where: {
                    id_userA: userId,
                    status: 'active'
                },
                attributes: ['id_group', 'status']
            });
        } catch (err) {
            throwError(err);
        }
    },
    // Lấy danh sách nhóm đang chờ duyệt (status: 'pending')
    selectGroupsPending: async (userId: string): Promise<group_user[]> => {
        try {
            return await group_user.findAll({
                where: {
                    id_userA: userId,
                    status: 'pending'
                },
                attributes: ['id_group', 'status']
            });
        } catch (err) {
            throwError(err);
        }
    },
    //lấy danh sách thành viên đang yêu cầu tham gia
    selectUsersPending: async (group_id: number): Promise<group_user[]> => {
        try {
            return await group_user.findAll({
                where: {
                    id_group: group_id,
                    status: 'pending'
                }
            })
        } catch (err) {
            throwError(err);
        }
    },
    // Kiểm tra trạng thái thành viên trong nhóm
    checkMembership: async (
        userId: string,
        groupId: number
    ): Promise<group_user | null> => {
        try {
            return await group_user.findOne({
                where: {
                    id_userA: userId,
                    id_group: groupId
                }
            });
        } catch (err) {
            throwError(err);
        }
    },
    // Lấy tất cả thành viên của một nhóm
    getGroupMembersByGroupId: async (
        groupId: number,
        status?: 'active' | 'pending'
    ): Promise<group_user[]> => {
        try {
            const whereClause: any = { id_group: groupId };

            if (status) {
                whereClause.status = status;
            }

            return await group_user.findAll({
                where: whereClause,
                attributes: ['id_userA', 'status']
            });
        } catch (err) {
            throwError(err);
        }
    },

    // Lấy danh sách user trong các nhóm chung (để tìm mutual groups)
    selectMutualGroupMembers: async (
        mutualGroupIds: number[],
        excludeUserId: string
    ): Promise<group_user[]> => {
        try {
            return await group_user.findAll({
                where: {
                    id_group: { [Op.in]: mutualGroupIds },
                    status: 'active',
                    id_userA: { [Op.not]: excludeUserId }
                },
                attributes: ['id_userA']
            });
        } catch (err) {
            throwError(err);
        }
    },

    // Đếm số lượng thành viên active trong nhóm
    countActiveMembers: async (groupId: number): Promise<number> => {
        try {
            return await group_user.count({
                where: {
                    id_group: groupId,
                    status: 'active'
                }
            });
        } catch (err) {
            throwError(err);
        }
    },

    // Đếm số lượng yêu cầu pending của nhóm
    countPendingRequests: async (groupId: number): Promise<number> => {
        try {
            return await group_user.count({
                where: {
                    id_group: groupId,
                    status: 'pending'
                }
            });
        } catch (err) {
            throwError(err);
        }
    },
    selectGroups: async (userId: string) => {
        return await group_user.findAll({
            where: {
                id_userA: userId,
                status: 'active'
            },
            attributes: ['id_group']
        });
    },
    getMutualGroupMembers: async (mutualGroupIds: number[], userId: string) => {
        return await group_user.findAll({
            where: {
                id_group: { [Op.in]: mutualGroupIds },
                status: 'active',
                id_userA: { [Op.notIn]: [userId] }
            },
            attributes: ['id_userA']
        });
    },

}