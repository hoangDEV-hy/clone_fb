import express from 'express'
import userRoutes from './Users'
import group_userRoutes from './GroupUsers'
import postRoutes from './Posts'
import followerRoutes from './Router_Follower'
import friendRoutes from './UserUsers'

// ============================================================
// PAGE MANAGER ROUTES INDEX
// Responsibility: Aggregate all page manager routes
// ============================================================

const router = express.Router();

router.use('/user', userRoutes);
router.use('/group_user', group_userRoutes);
router.use('/Post', postRoutes);
router.use('/follower', followerRoutes);
router.use('/friends', friendRoutes);

export default router;
