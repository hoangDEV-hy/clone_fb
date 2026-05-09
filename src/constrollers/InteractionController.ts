import { Transaction } from 'sequelize';
import { sequelize } from '../Configs/Sql';
import { methods as interactionsModel } from '../Models/Interactions';
import { interactions } from '../Models/Interactions';
import throwError from '../Helpers/ThrowErrorOfController';
import { addNotification, sendNotification } from '../Services/FollowerService';
import NotificationServerTake from '../Types/Notification';

// ============================================================
// INTERACTION CONTROLLER
// Responsibility: Business logic for interactions (like, share, comment)
// ============================================================

export const InteractionController = {
    // =====================================================
    // LOAD INTERACTIONS
    // =====================================================

    loadInteractions: async (idPosts: number[], idUser: string) => {
        if (!idPosts || idPosts.length === 0) {
            return null;
        }

        const [sl_like_check, sl_share, commend] = await Promise.all([
            interactionsModel.selectLikeStatus(idPosts, idUser),
            interactionsModel.selectedShareCount(idPosts),
            interactionsModel.selectCommendData(idPosts),
        ]);

        return { sl_like_check, sl_share, commend };
    },

    // =====================================================
    // LIKE
    // =====================================================

    processLikes: async (likeData: Record<string, any>): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            if (!likeData || Object.keys(likeData).length === 0) {
                throw new Error('MISSING_INPUT');
            }

            const notifications: NotificationServerTake[] = [];

            const toDelete = Object.values(likeData)
                .filter((item: any) => item.method === 'DELETE')
                .map((item: any) => item.id_Posts);

            const toCreate = Object.values(likeData)
                .filter((item: any) => item.method === 'Post') as interactions[];

            if (toDelete.length > 0) {
                await interactionsModel.destroyInteractions(toDelete, transaction);
            }

            if (toCreate.length > 0) {
                await interactionsModel.createInteractions(toCreate, transaction);

                toCreate.forEach((like: any) => {
                    if (like.notification_value) {
                        notifications.push(like.notification_value);
                    }
                });
            }

            const notificationResults = await Promise.all(
                notifications.map(notif =>
                    addNotification(notif, transaction)
                )
            );

            await transaction.commit();

            notificationResults.forEach((result, index) => {
                if (result?.id) {
                    sendNotification(result.id, notifications[index]);
                }
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error in processLikes:', error);
            throw error;
        }
    },

    // =====================================================
    // SHARE
    // =====================================================

    saveShare: async (
        userId: string,
        postIdOriginal: string | number,
        notification_value: NotificationServerTake
    ): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            if (!postIdOriginal || !notification_value) {
                throw new Error('MISSING_INPUT');
            }

            await interactionsModel.createInteraction(
                { id_user: userId, id_Posts: postIdOriginal as any, classify: 'share' },
                transaction
            );

            notification_value.selectedSenderId = userId;
            notification_value.content = `${notification_value.content} ${userId}`;

            const notificationResult = await addNotification(notification_value, transaction);

            await transaction.commit();

            if (notificationResult?.id) {
                sendNotification(notificationResult.id, notification_value);
            }
        } catch (error) {
            await transaction.rollback();
            console.error('Error in saveShare:', error);
            throw error;
        }
    },

    deleteShare: async (postId: number): Promise<void> => {
        try {
            await interactionsModel.destroyInteraction({ id_Posts: postId });
        } catch (err) {
            throwError(err);
        }
    },

    // =====================================================
    // COMMENT
    // =====================================================

    saveComments: async (comments: any[]): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            if (!comments || comments.length === 0) {
                throw new Error('MISSING_INPUT');
            }

            const commentsForDb = comments.map(comment => {
                const { notification_value, ...commentData } = comment;
                return {
                    ...commentData,
                    id_Posts: typeof commentData.id_Posts === 'string'
                        ? parseInt(commentData.id_Posts)
                        : commentData.id_Posts
                };
            });

            await interactionsModel.createInteractions(commentsForDb, transaction);

            const notificationResults = await Promise.all(
                comments.map(comment =>
                    addNotification(comment.notification_value, transaction)
                )
            );

            await transaction.commit();

            notificationResults.forEach((result, index) => {
                if (result?.id) {
                    sendNotification(result.id, comments[index].notification_value);
                }
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error in saveComments:', error);
            throw error;
        }
    },

    deleteComments: async (comments: any[]): Promise<void> => {
        const transaction = await sequelize.transaction();
        try {
            if (!comments || comments.length === 0) {
                throw new Error('MISSING_INPUT');
            }

            await interactionsModel.destroyInteractions(comments, transaction);

            const notificationResults = await Promise.all(
                comments.map(comment =>
                    addNotification(comment.notification_value, transaction)
                )
            );

            await transaction.commit();

            notificationResults.forEach((result, index) => {
                if (result?.id) {
                    sendNotification(result.id, comments[index].notification_value);
                }
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error in deleteComments:', error);
            throw error;
        }
    },

    updateComments: async (updatedCommends: { id: number; content: string }[]): Promise<void> => {
        try {
            await Promise.all(
                updatedCommends.map(c =>
                    interactionsModel.updateInteraction({ content: c.content }, { id: c.id })
                )
            );
        } catch (err) {
            throwError(err);
        }
    },

    // =====================================================
    // EXISTING METHODS (delegated)
    // =====================================================

    selectLikeStatus: async (selectedIdPosts: number[], selectedIdUser: string) => {
        try {
            return await interactionsModel.selectLikeStatus(selectedIdPosts, selectedIdUser);
        } catch (err) {
            throwError(err);
        }
    },

    selectedShareCount: async (selectedIdPosts: number[]) => {
        try {
            return await interactionsModel.selectedShareCount(selectedIdPosts);
        } catch (err) {
            throwError(err);
        }
    },

    selectCommendData: async (selectedIdPosts: number[]) => {
        try {
            return await interactionsModel.selectCommendData(selectedIdPosts);
        } catch (err) {
            throwError(err);
        }
    },

    destroyInteractions: async (selectedInteractionIds: number[], transaction?: Transaction) => {
        try {
            return await interactionsModel.destroyInteractions(selectedInteractionIds, transaction);
        } catch (err) {
            throwError(err);
        }
    },

    createInteractions: async (addedInteractions: interactions[], transaction?: Transaction) => {
        try {
            return await interactionsModel.createInteractions(addedInteractions, transaction);
        } catch (err) {
            throwError(err);
        }
    },

    createInteraction: async (data: Partial<interactions>, transaction?: Transaction) => {
        try {
            return await interactionsModel.createInteraction(data, transaction);
        } catch (err) {
            throwError(err);
        }
    },

    destroyInteractionById: async (selectedId: number) => {
        try {
            return await interactionsModel.destroyInteraction({ id: selectedId });
        } catch (err) {
            throwError(err);
        }
    },

    updateInteraction: async (selectedId: number, selectedContent: string) => {
        try {
            return await interactionsModel.updateInteraction({ content: selectedContent }, { id: selectedId });
        } catch (err) {
            throwError(err);
        }
    }
};
