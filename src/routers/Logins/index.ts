import express from 'express';
import { AuthController } from '../../Constrollers/AuthController';
import { authenticate } from '../../Middlewares/Auth';
import throwError from '../../Helpers/ThrowErrorOfRouter';
import { Response, Request } from 'express';

// ============================================================
// AUTH ROUTES
// Responsibility: Define endpoints, attach middleware, call controller
// ============================================================

const router = express.Router();

router.get('/login', (req: Request, res: Response) => {
    res.render('Contents/Logins/Login');
});

router.post('/login', authenticate.rendToken, (req: Request, res: Response) => {
    res.redirect('/main');
});

router.get('/logout', authenticate.user_auth, (req: Request, res: Response) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }

        res.clearCookie('token');
        res.redirect('/login');
    });
})

router.get('/login/setPass', async (req: Request, res: Response) => {
    try {
        const selectedInputPhone = req.query.phone as string;
        const result = await AuthController.getPass(selectedInputPhone);
        if (!result) {
            res.send({ error: "Account does not exist." });
            return;
        } else {
            res.render('Contents/Logins/SetPass', { selectedInputPhone });
            return;
        }
    } catch (err) {
        throwError(err, res);
    }
});

router.post('/login/setPass', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, password } = req.body;

        const result = await AuthController.setPass(id, password);

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
    res.render('Contents/Logins/DangKi');
})

router.post('/login/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { phone, password } = req.body;
        const selectedUser = await AuthController.createUser(phone, password);
        if (selectedUser) {
            res.redirect('/main')
        } else {
            res.status(500).json({ error: 'Failed to create user' });
        }
    } catch (err) {
        throwError(err, res);
    }
})

export default router;
