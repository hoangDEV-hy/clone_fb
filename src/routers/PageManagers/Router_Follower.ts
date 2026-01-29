import express, { Response, Request } from "express";
import { authenticate } from "../../Middlewares/Auth";


import ExtendRequest from "../../Types/ExtendRequest";

let router = express.Router();

router.get('/', authenticate.user_auth, (req: ExtendRequest, res: Response) => {
    const selectedUserId = req.admin?.id;
    res.render('contents/PageManagers/View_Following', { selectedUserId });
});

export { router }