// routes/index.ts
import { router as login } from './Logins';
import { router as page_manager } from './PageManagers'
import { router as Posts } from './Post'
import cors from 'cors';
import { router as main } from './Main'
import { router as interactions } from './Interactions'
import { router as upload } from './Uploads'
import { router as chat } from './Chats'
import { router as notification } from './Notification'
import { router as follow } from './Follower'
import { router as mutualFriend } from './MutualFriend'
import { router as searches } from './Search'
import { router as group } from './Group'

import { Express } from 'express';

function router(app: Express): void {
    app.use('/', login);
    app.use('/group', group);
    app.use('/page_manager', page_manager);
    app.use('/Posts', cors(), Posts);
    app.use('/main', main);
    app.use('/Post', interactions);
    app.use('/upload', upload);
    app.use('/mess', chat);
    app.use('/notification', notification);
    app.use('/follow', follow);
    app.use('/mutualfriend', mutualFriend);
    app.use('/searches', searches);
}


export default router;
