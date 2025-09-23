import express from "express";
import { authenticate } from "../middware/auth";
import { methods as model_ExtPosts, interactions } from "../models/interactions";
import { Response } from "express";
import multer from "multer";
import { methods as model_Posts, Posts } from '../models/Posts';
import { User } from "../models/user";
import { Group } from "../models/group";
import { where } from "sequelize";
import { Op } from "sequelize"
import { QueryTypes } from "sequelize";
import { sequelize } from "../configs/sql";
const upload = multer();
let route = express.Router();



//interactions_load
route.post('/interactions/load', upload.none(), async (req: any, res: Response): Promise<any> => {
    try {
        const { id_Posts, id_user } = req.body;
        const Posts_data = JSON.parse(id_Posts);
        console.log("id_Posts, id_user", Posts_data, id_user)
        //check id_Posts
        if (!Posts_data || !id_user) {
            return res.status(400).json({ error: "id_Post và id_user là bắt buộc" });
        }



        // --------------------------
        // Lấy số like và check user đã like chưa
        // --------------------------
        const sl_like_check: any = await sequelize.query(
            `SELECT id_Posts,
        COUNT(*) AS totalLikes,
        CASE WHEN SUM(CASE WHEN id_user = :id_user THEN 1 ELSE 0 END) > 0 THEN 1 ELSE 0 END AS likedByUser
     FROM interactions
     WHERE id_Posts IN (:Posts_data) AND classify = 'like'
     GROUP BY id_Posts`,
            {
                replacements: { Posts_data, id_user },
                type: QueryTypes.SELECT
            }
        );


        // Shares
        const sl_share: any = await interactions.findAll({
            attributes: [
                'id_Posts',
                [sequelize.fn('COUNT', sequelize.col('id_Posts')), 'totalShares']
            ],
            where: {
                id_Posts: Posts_data, // mảng các id bài viết
                classify: 'share'
            },
            group: ['id_Posts']
        });


        // Comments
        const commend = await interactions.findAll({
            where: {
                classify: 'commend',
                id_Posts: Posts_data
            },
            attributes: ['id', 'id_Posts', 'id_user', 'content'], // chỉ các cột có trong interactions
            include: [
                {
                    model: User,
                    attributes: ['name', 'avatar'], // lấy name, avatar từ bảng users,
                    required: true

                }
            ]
        });


        // Send response
        let interactions_data = { sl_like_check, sl_share, commend };
        res.json(interactions_data);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

route.post('/like', async (req: any, res: Response) => {
    //trans des in db and in req.body
    try {
        // Lấy danh sách ID cần xoá
        const idsToDelete = Object.values(req.body)
            .filter((item: any) => item.method === 'DELETE')
            .map((item: any) => item.id_Posts);
        // Xoá trong DB
        if (idsToDelete.length > 0) {
            await interactions.destroy({
                where: {
                    id_Posts: { [Op.in]: idsToDelete },
                }
            });
            for (const key of Object.keys(req.body)) {
                if (idsToDelete.includes(req.body[key].id_Posts)) {
                    delete req.body[key];
                }
            }
        }



    } catch (error) {
        console.log(error);
    }
    console.log(req.body)
    try {
        const dataToInsert: any = Object.values(req.body)
        await interactions.bulkCreate(dataToInsert);
    } catch (error) {
        console.log(error);
    }

    res.send();
})



route.post('/share', authenticate.user_auth, async (req: any, res: Response): Promise<any> => {
    const { id_Post } = req.body;
    let Post = await Posts.findOne({
        where: { id: id_Post }
    });
    let contenObj = JSON.parse(Post!.contens);
    if (typeof contenObj === 'string') {
        contenObj = JSON.parse(contenObj);
    }
    const Posts_tranforme = {
        text: contenObj.text,
        image: JSON.stringify(contenObj.image)
    }
    res.render('contens/Post/Extend_Post', { Post: Post?.toJSON(), conten: Posts_tranforme })
})

route.post('/share/save', authenticate.user_auth, upload.none(), async (req: any, res: Response): Promise<any> => {
    const { PostId_original } = req.body;
    const id_user = req.admin.id;
    await interactions.create({ id_user: id_user, id_Posts: PostId_original, classify: 'share' });
})

route.delete('/share/delete', authenticate.user_auth, upload.none(), async (req: any, res: Response): Promise<any> => {
    const { id } = req.body;
    try {
        await model_Posts.des(id);
    } catch (error) {
        res.send(error);
    }
    await model_ExtPosts.des({ id_Posts: id });
})

route.post('/Post/load', authenticate.user_auth, upload.none(), async (req: any, res: Response) => {
    const { id_Post } = req.body;
    const post = await Posts.findOne({

        where: { id: id_Post },
        include: [
            {
                model: User,
                as: 'users',
                required: false // inner join

            },
            {
                model: Group,
                as: 'groups',
                required: false
            }
        ]
    });
    let contens = JSON.parse(post!.contens);

    //contens = JSON.parse(contens);


    contens = {
        text: contens.text,
        //image: JSON.stringify(contens.image) // giữ nguyên object/array thay vì stringify
        image: contens.image
    };
    post!.contens = contens;
    let Post = post?.toJSON();
    res.json({ Post });
})
route.get('/iframe/commend', (req, res) => {
    res.render('contens/Post/commend_page', { layout: false }); // view sẵn có HTML + CSS
});

route.post('/commend', upload.none(), (req: any, res: Response) => {
    if (req.body.length > 0) interactions.bulkCreate(req.body);
})

route.post('/commend/del', upload.none(), (req: any) => {
    //using the function destroy
    interactions.destroy({ where: { id: { [Op.in]: req.body } } })

})

route.post('/commend/up', upload.none(), async (req: any) => {
    //using the function 
    const updatedCommends = req.body;
    await Promise.all(updatedCommends.map((c: any) =>
        interactions.update(
            { content: c.content },   // cột cần update
            { where: { id: c.id } }
        )
    ));

})

export { route };