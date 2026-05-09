import jwt from 'jsonwebtoken';

// Mock Sequelize de tran loi initialization
jest.mock('../../Configs/Sql', () => ({
    sequelize: { define: jest.fn() }
}));

// Mock model truoc khi import controller
jest.mock('../../Models/user', () => ({
    User: {},
    methods: {
        selectUser: jest.fn(),
        createUser: jest.fn(),
        updateUser: jest.fn()
    }
}));

// Mock throwError helper
jest.mock('../../Helpers/ThrowErrorOfController', () => ({
    __esModule: true,
    default: (err: unknown) => {
        if (err instanceof Error) throw err;
        if (typeof err === 'string') throw new Error(err);
        throw new Error('Unknown error');
    }
}));

// Mock cac models khac
jest.mock('../../Models/Interactions', () => ({
    interactions: {}, methods: {}
}));
jest.mock('../../Models/Post', () => ({
    Posts: {}, methods: {}
}));
jest.mock('../../Models/UserUser', () => ({
    user_user: {}, methods: {}
}));

process.env.JWT_SECRET = 'test-secret-key-for-jwt';

import { methods as loginController } from '../../Constrollers/Login/Logins';
import { methods as modelUser } from '../../Models/user';

describe('LoginController - Unit Tests', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    describe('createUser', () => {
        it('should create new user when phone does not exist', async () => {
            const phone = '0123456789';
            const password = 'password123';
            (modelUser.selectUser as jest.Mock).mockResolvedValue(null);
            (modelUser.createUser as jest.Mock).mockResolvedValue({
                id: '1', phoneNumber: phone, password,
                avatar: '/pictures/avatar.jpg', thumbnail: '/pictures/avatar.jpg'
            });

            const result = await loginController.createUser(phone, password);

            expect(result).not.toBeNull();
            expect(modelUser.createUser).toHaveBeenCalledWith({
                phoneNumber: phone, password,
                avatar: '/pictures/avatar.jpg', thumbnail: '/pictures/avatar.jpg'
            });
        });

        it('should return null when phone already exists', async () => {
            const phone = '0123456789';
            const password = 'password123';
            (modelUser.selectUser as jest.Mock).mockResolvedValue({ id: '1', phoneNumber: phone });

            const result = await loginController.createUser(phone, password);

            expect(result).toBeNull();
            expect(modelUser.createUser).not.toHaveBeenCalled();
        });

        it('should throw error when database fails', async () => {
            (modelUser.selectUser as jest.Mock).mockRejectedValue(new Error('Database error'));
            await expect(loginController.createUser('0123', 'pass')).rejects.toThrow('Database error');
        });
    });

    describe('auth', () => {
        it('should return JWT token when credentials are valid', async () => {
            (modelUser.selectUser as jest.Mock).mockResolvedValue({
                id: 'user-123', phoneNumber: '0123', password: 'pass'
            });

            const token = await loginController.auth('0123', 'pass');

            expect(token).toBeDefined();
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
            expect(decoded.id).toBe('user-123');
        });

        it('should throw error when user not found', async () => {
            (modelUser.selectUser as jest.Mock).mockResolvedValue(null);
            await expect(loginController.auth('0123', 'wrong')).rejects.toThrow('User not found');
        });

        it('should create token with correct expiration', async () => {
            (modelUser.selectUser as jest.Mock).mockResolvedValue({ id: 'u1', phoneNumber: '0', password: 'p' });
            const token = await loginController.auth('0', 'p');
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
            const now = Math.floor(Date.now() / 1000);
            expect(decoded.exp).toBeGreaterThan(now);
        });
    });
});
