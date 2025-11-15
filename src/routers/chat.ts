import express from "express";
let route = express.Router();
import { Request, Response } from "express";
import multer = require("multer");
const upload = multer();
import { contensChat } from "../models/chat/contensChat";
import { config_chatFunc } from "../models/configs/config_chat";
import { createOrUpdateOrLoad_chat } from "../constrollers/chat"
//to get the friends who are not in the chatrooms
import { methods as methodFriends, user_user } from "../models/user_user"
import { methods as methodChat_members, chat_member } from "../models/chat/chat_members"
import { Op, where } from "sequelize";
import { Json } from "sequelize/types/utils";
interface del_mesData {
    id: number,
    author: string
}
route.post('/del', upload.none(), async (req: Request, res: Response) => {
    try {
        let del_mesData = req.body.del_mesData;

        // Parse JSON from form-data
        if (typeof del_mesData === 'string') {
            del_mesData = JSON.parse(del_mesData);
        }

        console.log('req:', del_mesData);


        const ids = del_mesData

        // Delete from DBs
        await contensChat.destroy({
            where: {
                id: { [Op.in]: ids }
            }
        });

        res.send({ result: 'success' });
    } catch (e) {
        console.error(e);
        res.status(500).send({ result: 'fail' });
    }
});
route.post('/config', async (req: Request, res: Response) => {
    const { chat_id, author, name: nickName } = req.body;
    console.log("data", chat_id, author, nickName)
    const save_data: any = await createOrUpdateOrLoad_chat({ chat_id, author }, { nickName }, { chat_id, author, nickName });
    console.log("save_data", save_data);
    res.send({ "save_data": save_data.toJSON() });
})
//post chat_room people
// route.post('/chat_room/people', async (req: Request, res: Response) => {
//     const idUser = req.body.id_user;


//     const chat_members = await chat_member.findAll({
//         where: { idUser },
//         attributes: ['idUser'],
//         raw: true
//     });

//     const finally_chat_member = chat_members.length > 0
//         ? chat_members.map(row => row.idUser)
//         : [];


//     const users = await user_user.findAll({
//         where: {
//             idUser: {
//                 [Op.notIn]: finally_chat_member
//             }
//         }
//     });

//     console.log('users who are not in the chatroom', users)
//     res.send(JSON.stringify({ data: users }))

// });
//get chat_room add_people
route.get('/chat_room/people', (req: Request, res: Response) => {
    res.render('contens/search')
})
export { route }