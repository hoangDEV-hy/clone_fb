import express, { Response, Request } from "express";
import { authenticate } from "../../middlewares/Mid_Auth";

let router = express.Router();

router.get('/', authenticate.user_auth, (req: Request, res: Response) => {
    const selectedUserId = req.admin?.id;
    res.render('contens/page_manager/View_Following', { selectedUserId });
});

export { router }