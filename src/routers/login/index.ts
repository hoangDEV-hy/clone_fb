import express from 'express';
import { methods as loginController } from '../../constrollers/login/login';
import { authenticate } from '../../middware/auth';
import throwError from '../../helpers/ThrowErrorOfRouter';

import { Response, Request } from 'express';

const router = express.Router();

router.get('/login', (req: Request, res: Response) => {
    res.render('contens/login_dangKi/login');
});

router.post('/login', authenticate.rendToken, (req: Request, res: Response) => {
    res.redirect('/main');
});

router.get('/logout', authenticate.user_auth, (req: Request, res: Response) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }

        res.clearCookie('token'); // tên cookie mặc định
        res.redirect('/login');
    });

})


router.get('/login/setPass', async (req: Request, res: Response) => {
    try {
        const inputPhone = req.query.phone as string;
        const result = await loginController.getPass(inputPhone);
        if (!result) {
            res.send({ error: "Account does not exist." });
            return;
        } else {
            res.render('contens/login_dangKi/setPass', { inputPhone });
            return;
        }
    } catch (err) {
        throwError(err, res);
    }

});
router.post('/login/setPass', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, password } = req.body;

        const result = await loginController.setPass(id, password);

        if (result !== 0) {
            res.redirect('/');
        } else {
            res.status(500).json({ error: 'Failed to update password' });
        }
    } catch (err) {
        throwError(err, res);
    }
});


router.get('/login/register', (req: Request, res: Response) => {
    res.render('contens/login_dangKi/dangKi')
})
router.post('/login/register', async (req: Request, res: Response): Promise<void> => {
    const { phone, password } = req.body;
    try {
        const user = await loginController.createUser(phone, password);
        if (user) {
            res.redirect('/main')
        } else {
            res.status(500).json({ error: 'Failed to create user' });
        }
    } catch (err) {
        throwError(err, res);
    }
})

export { router };

