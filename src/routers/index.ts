// routes/index.ts
import { router as login } from './login';
import { router as group } from './groups';
import { route as page_manager } from './page_manager'

import { Express } from 'express'; // nếu bạn muốn kiểu rõ hơn thay vì `any`

function router(app: Express): void {
    app.use('/', login);
    app.use('/groups', group);
    app.use('/page_manager', page_manager);
}


export default router;
