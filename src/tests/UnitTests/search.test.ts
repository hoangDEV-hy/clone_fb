import { Request, Response } from 'express';
import { router } from './your-router-file'; // Adjust path
import * as groupController from './groupController'; // Adjust path
import * as userController from './userController'; // Adjust path

// Mock controllers
jest.mock('./groupController');
jest.mock('./userController');

describe('Router Tests', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockSend: jest.Mock;
    let mockRender: jest.Mock;

    beforeEach(() => {
        mockSend = jest.fn();
        mockRender = jest.fn();
        mockRequest = {
            query: {}
        };
        mockResponse = {
            send: mockSend,
            render: mockRender
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /get', () => {
        it('should merge and deduplicate groups and users by name', async () => {
            const mockGroups = [
                { name: 'Admin', toJSON: () => ({ name: 'Admin', type: 'group' }) },
                { name: 'Users', toJSON: () => ({ name: 'Users', type: 'group' }) }
            ];

            const mockUsers = [
                { name: 'Admin', toJSON: () => ({ name: 'Admin', type: 'user' }) },
                { name: 'John', toJSON: () => ({ name: 'John', type: 'user' }) }
            ];

            (groupController.selectGroupsWithName as jest.Mock).mockResolvedValue(mockGroups);
            (userController.selectUsersWithName as jest.Mock).mockResolvedValue(mockUsers);

            mockRequest.query = { name: 'test' };

            // Get the route handler
            const routeHandler = router.stack.find(
                layer => layer.route?.path === '/get'
            )?.route?.stack[0].handle;

            await routeHandler(mockRequest as Request, mockResponse as Response);

            expect(groupController.selectGroupsWithName).toHaveBeenCalledWith('test');
            expect(userController.selectUsersWithName).toHaveBeenCalledWith('test');
            expect(mockSend).toHaveBeenCalledWith({
                list: expect.arrayContaining([
                    { name: 'Admin', type: 'group' }, // First occurrence wins
                    { name: 'Users', type: 'group' },
                    { name: 'John', type: 'user' }
                ])
            });
            expect(mockSend.mock.calls[0][0].list).toHaveLength(3);
        });

        it('should handle empty results from both controllers', async () => {
            (groupController.selectGroupsWithName as jest.Mock).mockResolvedValue([]);
            (userController.selectUsersWithName as jest.Mock).mockResolvedValue([]);

            mockRequest.query = { name: 'nonexistent' };

            const routeHandler = router.stack.find(
                layer => layer.route?.path === '/get'
            )?.route?.stack[0].handle;

            await routeHandler(mockRequest as Request, mockResponse as Response);

            expect(mockSend).toHaveBeenCalledWith({ list: [] });
        });

        it('should handle null results from controllers', async () => {
            (groupController.selectGroupsWithName as jest.Mock).mockResolvedValue(null);
            (userController.selectUsersWithName as jest.Mock).mockResolvedValue(null);

            mockRequest.query = { name: 'test' };

            const routeHandler = router.stack.find(
                layer => layer.route?.path === '/get'
            )?.route?.stack[0].handle;

            await routeHandler(mockRequest as Request, mockResponse as Response);

            expect(mockSend).toHaveBeenCalledWith({ list: [] });
        });

        it('should handle items without toJSON method', async () => {
            const mockGroups = [
                { name: 'Admin', type: 'group' }
            ];

            (groupController.selectGroupsWithName as jest.Mock).mockResolvedValue(mockGroups);
            (userController.selectUsersWithName as jest.Mock).mockResolvedValue([]);

            mockRequest.query = { name: 'test' };

            const routeHandler = router.stack.find(
                layer => layer.route?.path === '/get'
            )?.route?.stack[0].handle;

            await routeHandler(mockRequest as Request, mockResponse as Response);

            expect(mockSend).toHaveBeenCalledWith({
                list: [{ name: 'Admin', type: 'group' }]
            });
        });
    });

    describe('GET /', () => {
        it('should render search page', () => {
            const routeHandler = router.stack.find(
                layer => layer.route?.path === '/'
            )?.route?.stack[0].handle;

            routeHandler(mockRequest as Request, mockResponse as Response);

            expect(mockRender).toHaveBeenCalledWith('contens/search');
        });
    });
});
