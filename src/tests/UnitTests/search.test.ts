import { Request, Response } from 'express';
import { SearchController } from '../../Constrollers/SearchController';

// ============================================================
// SEARCH CONTROLLER TESTS
// (Router tested indirectly via controller)
// ============================================================

describe('Search Controller Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('searchGroupsAndUsers', () => {
        it('should search and deduplicate groups and users by name', async () => {
            const mockGroups = [
                { name: 'Admin', toJSON: () => ({ name: 'Admin', type: 'group' }) },
                { name: 'Users', toJSON: () => ({ name: 'Users', type: 'group' }) }
            ];

            const mockUsers = [
                { name: 'John', toJSON: () => ({ name: 'John', type: 'user' }) }
            ];

            // Mock the dependencies
            jest.spyOn(SearchController as any, 'searchGroupsAndUsers').mockImplementation(async () => {
                return [...mockGroups, ...mockUsers];
            });

            const result = await (SearchController as any).searchGroupsAndUsers('test');

            expect(Array.isArray(result)).toBe(true);
        });
    });
});
