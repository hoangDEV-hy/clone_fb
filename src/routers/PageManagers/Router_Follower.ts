import express, { Response } from "express";
import { authenticate } from "../../Middlewares/Auth";
import ExtendRequest from "../../Types/ExtendRequest";

// ============================================================
// PAGE MANAGER FOLLOWER ROUTES
// Responsibility: Define endpoints, attach middleware, call controller
// ============================================================

const router = express.Router();

router.get('/', authenticate.user_auth, (req: ExtendRequest, res: Response) => {
    const selectedUserId = req.admin?.id;
    res.render('contents/PageManagers/View_Following', { selectedUserId });
});

export default router;
