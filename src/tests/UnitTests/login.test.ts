// ============================================
// UNIT TESTS - Chỉ test Business Logic
// ============================================

import jwt from 'jsonwebtoken';

// Mock Sequelize để tránh lỗi initialization
jest.mock('../../configs/sql', () => ({
    sequelize: {
        define: jest.fn(),
    }
}));

// Mock model trước khi import controller
jest.mock('../../models/user', () => ({
    methods: {
        selectUser: jest.fn(),
        createUser: jest.fn(),
        updateUser: jest.fn()
    }
}));

// Mock throwError helper - giữ nguyên error để test có thể kiểm tra message
jest.mock('../../helpers/ThrowErrorOfController', () => ({
    __esModule: true,
    default: (err: unknown) => {
        // Giữ nguyên Error instance để test có thể kiểm tra message
        if (err instanceof Error) {
            throw err;
        }
        // Nếu là string, convert thành Error
        if (typeof err === 'string') {
            throw new Error(err);
        }
        throw new Error('Unknown error');
    }
}));

// Mock các models khác để tránh Sequelize initialization issues
jest.mock('../../models/interactions', () => ({
    interactions: {},
    methods: {}
}));

jest.mock('../../models/Posts', () => ({
    Posts: {},
    methods: {}
}));

jest.mock('../../models/user_user', () => ({
    user_user: {},
    methods: {}
}));

// Set JWT_SECRET cho test environment
process.env.JWT_SECRET = 'test-secret-key-for-jwt';

import { methods as loginController } from '../../constrollers/login/login';
import { methods as modelUser } from '../../models/user';

describe('LoginController - Unit Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks(); // Clear mock giữa các test
    });

    // ============================================
    // ✅ TEST 1: createUser
    // Lý do test: Có business logic kiểm tra duplicate + set default values
    // ============================================
    describe('createUser', () => {

        it('should create new user when phone does not exist', async () => {
            // Arrange
            const phone = '0123456789';
            const password = 'password123';

            (modelUser.selectUser as jest.Mock).mockResolvedValue(null); // User chưa tồn tại
            (modelUser.createUser as jest.Mock).mockResolvedValue({
                id: '1',
                phoneNumber: phone,
                password: password,
                avatar: 'pictures/avatar.jpg',
                thumbnail: 'pictures/avatar.jpg'
            });

            // Act
            const result = await loginController.createUser(phone, password);

            // Assert
            expect(result).not.toBeNull();
            expect(result?.phoneNumber).toBe(phone);
            expect(modelUser.selectUser).toHaveBeenCalledWith({ phoneNumber: phone });
            expect(modelUser.createUser).toHaveBeenCalledWith({
                phoneNumber: phone,
                password: password,
                avatar: 'pictures/avatar.jpg',
                thumbnail: 'pictures/avatar.jpg'
            });
        });

        it('should return null when phone already exists', async () => {
            // Arrange
            const phone = '0123456789';
            const password = 'password123';

            (modelUser.selectUser as jest.Mock).mockResolvedValue({
                id: '1',
                phoneNumber: phone
            }); // User đã tồn tại

            // Act
            const result = await loginController.createUser(phone, password);

            // Assert
            expect(result).toBeNull();
            expect(modelUser.createUser).not.toHaveBeenCalled();
        });

        it('should throw error when database fails', async () => {
            // Arrange
            const phone = '0123456789';
            const password = 'password123';

            (modelUser.selectUser as jest.Mock).mockRejectedValue(
                new Error('Database connection failed')
            );

            // Act & Assert
            await expect(
                loginController.createUser(phone, password)
            ).rejects.toThrow('Database connection failed');
        });

        // Test edge cases
        it('should handle empty phone number', async () => {
            const phone = '';
            const password = 'password123';

            (modelUser.selectUser as jest.Mock).mockResolvedValue(null);

            const result = await loginController.createUser(phone, password);

            expect(modelUser.selectUser).toHaveBeenCalledWith({ phoneNumber: '' });
        });
    });

    // ============================================
    // ✅ TEST 2: auth
    // Lý do test: Có logic tạo JWT token, quan trọng cho security
    // ============================================
    describe('auth', () => {

        it('should return JWT token when credentials are valid', async () => {
            // Arrange
            const phone = '0123456789';
            const password = 'password123';
            const userId = 'user-123';

            (modelUser.selectUser as jest.Mock).mockResolvedValue({
                id: userId,
                phoneNumber: phone,
                password: password
            });

            // Act
            const token = await loginController.auth(phone, password);

            // Assert
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');

            // Verify token content
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
            expect(decoded.id).toBe(userId);
            expect(decoded.exp).toBeDefined(); // Token có expiration
        });

        it('should throw error when user not found', async () => {
            // Arrange
            const phone = '0123456789';
            const password = 'wrongpassword';

            (modelUser.selectUser as jest.Mock).mockResolvedValue(null);

            // Act & Assert
            await expect(
                loginController.auth(phone, password)
            ).rejects.toThrow('User not found');
        });

        it('should throw error when database fails', async () => {
            const phone = '0123456789';
            const password = 'password123';

            (modelUser.selectUser as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            await expect(
                loginController.auth(phone, password)
            ).rejects.toThrow('Database error');
        });

        it('should create token with correct expiration time', async () => {
            const phone = '0123456789';
            const password = 'password123';
            const userId = 'user-123';

            (modelUser.selectUser as jest.Mock).mockResolvedValue({
                id: userId,
                phoneNumber: phone,
                password: password
            });

            const token = await loginController.auth(phone, password);
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

            // Token expires in 1 hour
            const now = Math.floor(Date.now() / 1000);
            const expectedExpiry = now + 3600; // 1 hour

            expect(decoded.exp).toBeGreaterThan(now);
            expect(decoded.exp).toBeLessThanOrEqual(expectedExpiry + 5); // Cho phép sai số 5s
        });
    });
});
