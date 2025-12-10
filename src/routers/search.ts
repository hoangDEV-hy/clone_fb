import express, { Request, Response, NextFunction, Router } from "express";
import { chat_member } from "../models/chat/chat_members";
import { user_user } from "../models/user_user";
import { Op } from "sequelize";
import { User } from "../models/user";
import { authenticate } from '../middware/auth'
import { Posts } from "../models/Posts";
import { Group } from '../models/group';

const route: Router = express.Router();

route.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const name = req.query.name as string;
        const idUser = req.query.idUser as string;
        const idChatRoom = Number(req.query.chat_roomId);


        // ============================
        // 1. LẤY DANH SÁCH CHAT MEMBERS
        // ============================
        const chatMembers = await chat_member.findAll({
            where: { chat_id: idChatRoom },
            include: [
                {
                    model: User,
                    as: 'users',
                    required: true,
                    attributes: ['id', 'name', 'avatar'],
                    where: {
                        name: { [Op.like]: `${name}%` }
                    }
                }
            ]
        });

        const existingUserIds = chatMembers.map(m => { return m.idUser });

        // ============================
        // 2. LẤY DANH SÁCH BẠN BÈ
        // ============================
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
                {
                    model: User,
                    as: 'userA',
                    attributes: ['id', 'name', 'avatar']
                },
                {
                    model: User,
                    as: 'userB',
                    attributes: ['id', 'name', 'avatar']
                }
            ]
        });

        // ============================
        // 3. LỌC DANH SÁCH BẠN THEO NAME GIỐNG TÌM KIẾM
        // ============================
        const searchedFriends = friends
            .map((f: any) => {
                // nếu userA = mình → bạn là userB
                if (f.id_userA === idUser) return f.userB;
                // nếu userB = mình → bạn là userA
                return f.userA;
            })
            .filter(friend =>
                friend.name.toLowerCase().startsWith(name.toLowerCase())
            );


        // ============================
        // 4. LOẠI BỎ BẠN ĐÃ CÓ TRONG CHAT
        // ============================
        const filteredFriendList = searchedFriends.filter(friend =>
            !existingUserIds.includes(friend.id)
        );

        res.json({
            chatMembers,
            friendList: filteredFriendList
        });

    } catch (error) {
        console.error(error);
        next(error);
    }
});
route.get('/profileUser', async (req: Request, res: Response) => {
    const targetId = req.query.userId;
    let config_interface = false;

    const user = await User.findOne({ where: { id: targetId }, attributes: ['name', 'avatar', 'thumbnail'] });

    let posts = await Posts.findAll({
        where: { user_id: targetId, scope: 'public' },
        include: [
            { model: Group, as: 'groups', required: false },
            { model: User, as: 'users', required: false }
        ]
    })
    posts = posts.map((post: any) => {
        const obj = post.toJSON ? post.toJSON() : post;

        try {
            let parsed = JSON.parse(obj.contens);

            // Nếu parsed là string → parse lại
            if (typeof parsed === "string") {
                parsed = JSON.parse(parsed);
            }

            // Lấy image
            let imageValue = parsed?.image;

            // Nếu image là object → stringify
            if (imageValue && typeof imageValue === "object") {
                imageValue = JSON.stringify(imageValue);
            }

            obj.contens = {
                text: parsed?.text ?? "",
                image: imageValue ?? ""
            };
        } catch (err) {
            // JSON lỗi → fallback
            obj.contens = { text: "", image: "" };
        }

        return obj;
    });

    return res.render('contens/page_manager/user', {
        Posts: posts,
        user: user?.toJSON(),
        config_interface
    });
})


export { route };
