import {
    DataTypes,
    Op,
    Model
} from 'sequelize';
import { sequelize as db } from '../configs/sql';
import throwError from '../helpers/ThrowErrorOfSqlQuery';


// 3. Khai báo class model với generic Model<UserAttributes, UserCreationAttributes>
class User extends Model {
    declare id: string;
    declare name?: string;
    declare alias?: string;
    declare hometown?: string;
    declare school?: string;
    declare phoneNumber?: string;
    declare password: string;
    declare avatar?: any;
    declare thumbnail?: any;
    declare idGroup?: any;
}


User.init({
    id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
    },
    alias: {
        type: DataTypes.STRING,
    },
    hometown: {
        type: DataTypes.STRING,
    },
    school: {
        type: DataTypes.STRING,
    },
    phoneNumber: {
        type: DataTypes.STRING,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    thumbnail: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    idGroup: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    sequelize: db,
    modelName: 'users',
    freezeTableName: true,
    hooks: {
        beforeValidate: async (user: User) => {
            if (!user.id) {
                const id = await getNextUsername();
                user.id = id;
            }
            if (!user.name) user.name = user.id + 'person';
            if (!user.alias) user.alias = user.id + 'person';
        }
    }
});

async function getNextUsername() {
    const lastUser = await User.findOne({
        where: {
            id: {
                [Op.like]: 'user %'
            }
        },
        order: [['id', 'DESC']],
    });

    let nextNumber = 1;
    if (lastUser?.id) {
        const match = lastUser.id.match(/user (\d+)/);
        if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
        }
    }
    return `user ${nextNumber}`;
}

export { User };
import { user_user } from './user_user';
User.hasMany(user_user, { foreignKey: 'id_userA', as: 'userA' })
User.hasMany(user_user, { foreignKey: 'id_userB', as: 'userB' })


const methods = {

    selectUser: async (
        data: Partial<User>
    ): Promise<User | null> => {
        try {
            return await User.findOne({
                where: data
            });
        } catch (err) {
            throwError(err);
        }
    },
    selectUsers: async (data: Partial<User>): Promise<User[]> => {
        try {
            return await User.findAll({
                where: data
            });
        } catch (err) {
            throwError(err);
        }
    },


    updateUser: async (data: Partial<User>, selectedIdUser: string): Promise<number> => {
        try {
            const [affectedRows] = await User.update(
                data,
                {
                    where: { id: selectedIdUser }
                }
            );
            return affectedRows;
        } catch (err) {
            throwError(err);
        }
    },

    selectUsersWithOrder: async (selectedIdUsers: string[]): Promise<User[]> => {
        try {
            return await User.findAll({
                where: {
                    id: {
                        [Op.in]: selectedIdUsers
                    }
                },
                attributes: ['id', 'name', 'alias', 'avatar', 'thumbnail'],
                order: [['id', 'ASC']]
            });
        } catch (err) {
            throwError(err);
        }
    },
    createUser: async (data: Partial<User>): Promise<User | null> => {
        try {
            return await User.create(data);
        } catch (err) {
            throwError(err);
        }
    },
    selectUsersWithIdsList: async (idsList: string[]): Promise<User[]> => {
        try {
            if (!idsList || idsList.length === 0) {
                return [];
            }

            return await User.findAll({
                where: {
                    id: {
                        [Op.in]: idsList
                    }
                }
            });
        } catch (err) {
            throwError(err);
        }
    }

};

export { methods };
