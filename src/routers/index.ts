// routes/index.ts
import { router as login } from './login';
import { router as group } from './groups';

import { Express } from 'express'; // nếu bạn muốn kiểu rõ hơn thay vì `any`

function router(app: Express): void {
    app.use('/', login);
    app.use('/groups', group);
}


export default router;
