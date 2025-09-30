import { Model, DataTypes } from "sequelize";
import { sequelize } from '../configs/sql';


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
import { Group } from "../models/group";
import { Posts } from "./Posts";
group_user.belongsTo(Group, { foreignKey: 'id_group', as: 'groups' });
group_user.hasMany(Posts, {
    foreignKey: 'user_id', // cột bất kỳ trong Posts, Sequelize không thực sự kiểm tra ở DB
    as: 'Posts'
});
export { group_user };

export let method = {
    addGroup: (req: any, res: Response): void => {
        const { id_group, id_userA } = req.body;
        group_user.create({
            id_group, id_userA, status: 'pendding'
        })
        //thông báo đến admin: lấy tất cả bản ghi đang ở trạng thái pendding gửi lên thông báo
    },
    delGroup: (id: { [key: string]: string }, res: Response): void => {
        group_user.destroy({
            where: id
        })
    },
    upGroup: (req: any, res: Response): void => {
        const { id } = req.body;
        group_user.update({
            status: 'active'
        }, {
            where: id
        })
        //thông báo đến user: c1: kiểm tra trạng thái ở id gửi đi để xét thông báo
        //c2: khi chấp nhận tham gia thì sẽ gửi thông báo đến id_user đó
    },
    select: async (key: { [id: string]: string }): Promise<group_user[]> => {
        return group_user.findAll(
            {
                where: key
            }
        );
    }
}
//thông báo: viết khi nào xong giao diện