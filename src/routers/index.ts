// routes/index.ts
import { router as login } from './login';
import { router as group } from './groups';
import { route as page_manager } from './page_manager'
import { route as essays } from './essay'
import cors from 'cors';
import { route as main } from './main'
import { route as interactions } from './interactions'

import { Express } from 'express'; // nếu bạn muốn kiểu rõ hơn thay vì `any`

function router(app: Express): void {
    app.use('/', login);
    app.use('/groups', group);
    app.use('/page_manager', page_manager);
    app.use('/essays', cors(), essays);
    app.use('/main', main);
    app.use('/essay', interactions)
}


export default router;
