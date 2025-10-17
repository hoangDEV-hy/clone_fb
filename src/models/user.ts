import {
    DataTypes,
    Op,
    Model
} from 'sequelize';
import { sequelize as db } from '../configs/sql';
import { Request, Response } from 'express';


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

    checkUser: async (conditions: { [key: string]: any }, res: Response): Promise<any> => {
        try {

            const user = await User.findOne({
                where: conditions
            });

            if (!user) {
                return res.status(401).json({ message: 'Invalid ' });
            }

        } catch (err) {
            console.error(err);
            return res.status(500).send({ error: 'Internal Server Error' });
        }
    },

    getPass: async (req: Request, res: Response): Promise<any> => {
        const inputPhone = req.query.phone as string;
        const user = await User.findOne({ where: { phoneNumber: inputPhone } });

        if (!user) {
            return res.send({ error: "Account does not exist." });
        } else {
            res.render('contens/login_dangKi/setPass', { inputPhone });
        }
    },

    setPass: async (req: Request, res: Response): Promise<any> => {
        const inputPhone = req.query.phone as string;
        try {
            const user = await User.findOne({ where: { phoneNumber: inputPhone } });
            const { password } = req.body;

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            user.password = password;
            await user.save();

            return res.status(200).json({ message: 'Password updated' });

        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: 'Failed to update password' });
        }
    },

    createUser: async (req: Request, res: Response): Promise<any> => {
        const { phone, password } = req.body;
        try {
            const existingUser = await User.findOne({ where: { phoneNumber: phone } });

            if (existingUser) {
                return res.status(400).json({ message: 'Phone number already registered' });
            }

            const avatar: string = 'pictures/avatar.jpg';
            const thumbnail: string = 'pictures/avatar.jpg'
            const newUser = await User.create({ phoneNumber: phone, password, avatar: avatar, thumbnail: thumbnail });

            return res.status(201).json({ message: 'User created', user: newUser });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to create user' });
        }
    },

    updateUser: async (data: { [key: string]: string }, id: any, res: Response): Promise<any> => {
        await User.update(
            data,
            {
                where: {
                    id: id
                }
            }
        )
    },
    selectUser: async (id: string): Promise<any> => {
        let user = await User.findOne(
            {
                where: { id }
            }
        )
        return user;
    }

};

export { methods };
