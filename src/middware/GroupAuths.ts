// middleware/groupAuth.ts
import { Response, NextFunction } from "express";
import ExtendRequest from "../types/Type_ExtendRequest";
import { Group } from "../models/group";

export const groupAuthMiddleware = {
    // Middleware kiểm tra user có phải admin của nhóm cụ thể không
    checkGroupAdmin: async (req: ExtendRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.admin?.id;
            const groupId = req.body.id_group || req.params.groupId || req.session.currentGroupId;

            if (!userId) {
                res.status(403).json({ error: true, message: 'Không có quyền' });
                return;
            }

            if (!groupId) {
                res.status(400).json({ error: true, message: 'Missing group ID' });
                return;
            }

            // Kiểm tra user có phải admin của group này không
            const group = await Group.findOne({
                where: {
                    id: groupId,
                    admin: userId
                }
            });

            // Set session
            req.session.currentGroupId = groupId;
            req.session.admin = !!group;

            if (!group) {
                res.status(403).json({
                    error: true,
                    message: 'You are not admin of this group'
                });
                return;
            }

            next();
        } catch (error) {
            console.error('Error in checkGroupAdmin middleware:', error);
            res.status(500).json({ error: true, message: 'Internal server error' });
        }
    },

    // Middleware kiểm tra user có phải admin của BẤT KỲ nhóm nào không
    checkIsGroupAdmin: async (req: ExtendRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.admin?.id;

            if (!userId) {
                res.status(403).json({ error: true, message: 'Không có quyền' });
                return;
            }

            // Kiểm tra user có phải admin của nhóm nào không
            const hasAdminGroup = await Group.findOne({
                where: { admin: userId }
            });

            req.session.admin = !!hasAdminGroup;

            next();
        } catch (error) {
            console.error('Error in checkIsGroupAdmin middleware:', error);
            res.status(500).json({ error: true, message: 'Internal server error' });
        }
    },

    // Middleware yêu cầu phải là admin (dùng sau checkGroupAdmin)
    requireGroupAdmin: (req: ExtendRequest, res: Response, next: NextFunction): void => {
        if (!req.session.admin) {
            res.status(403).json({
                error: true,
                message: 'Only group admin can perform this action'
            });
            return;
        }
        next();
    },

    // Middleware set currentGroupId từ body hoặc params
    setCurrentGroup: (req: ExtendRequest, res: Response, next: NextFunction): void => {
        const groupId = req.body.id_group || req.params.groupId || req.query.groupId;

        if (groupId) {
            req.session.currentGroupId = Number(groupId);
        }

        next();
    }
};