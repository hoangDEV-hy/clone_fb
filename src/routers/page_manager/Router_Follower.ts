import express, { Response, Request } from "express";
import { authenticate } from "../../middware/auth";


import ExtendRequest from "../../types/Type_ExtendRequest";

let router = express.Router();

router.get('/', authenticate.user_auth, (req: ExtendRequest, res: Response) => {
    const selectedUserId = req.admin?.id;
    res.render('contens/page_manager/View_Following', { selectedUserId });
});

export { router }