// routes/index.ts
import { router as login } from './login';
import { router as group } from './groups';
import { route as page_manager } from './page_manager'
import { route as Posts } from './Router_Post'
import cors from 'cors';
import { route as main } from './Router_Main'
import { route as interactions } from './Router_Interactions'
import { route as upload } from './Router_Upload'
import { route as chat } from './Router_Chat'
import { route as notification } from './Router_Notification'
import { router as follow } from './Router_Follower'
import { router as mutualFriend } from './Router_MutualFriend'

import { Express } from 'express';

function router(app: Express): void {
    app.use('/', login);
    app.use('/groups', group);
    app.use('/page_manager', page_manager);
    app.use('/Posts', cors(), Posts);
    app.use('/main', main);
    app.use('/Post', interactions);
    app.use('/upload', upload);
    app.use('/mess', chat);
    app.use('/notification', notification);
    app.use('/follow', follow);
    app.use('/mutualfriend', mutualFriend);
}


export default router;
