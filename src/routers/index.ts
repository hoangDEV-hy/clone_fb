import loginRouter from './Logins';
import pageManagerRouter from './PageManagers'
import PostsRouter from './Post'
import cors from 'cors';
import MainRouter from './Main'
import interactionsRouter from './interactions'
import uploadsRouter from './Uploads'
import chatsRouter from './Chats'
import notificationsRouter from './Notification'
import followerRouter from './Follower'
import mutualFriendRouter from './MutualFriend'
import searchRouter from './Search'
import groupRouter from './Group'

import { Express } from 'express';

// ============================================================
// ROUTES INDEX
// Responsibility: Aggregate all routes
// ============================================================

function router(app: Express): void {
    app.use('/', loginRouter);
    app.use('/group', groupRouter);
    app.use('/page_manager', pageManagerRouter);
    app.use('/Posts', cors(), PostsRouter);
    app.use('/main', MainRouter);
    app.use('/Post', interactionsRouter);
    app.use('/upload', uploadsRouter);
    app.use('/mess', chatsRouter);
    app.use('/notification', notificationsRouter);
    app.use('/follow', followerRouter);
    app.use('/mutualfriend', mutualFriendRouter);
    app.use('/searches', searchRouter);
}

export default router;
