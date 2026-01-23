import { Transaction } from 'sequelize';
import throwError from '../helpers/ThrowErrorOfController';
import { methods as interactionsModel } from '../models/interactions'

import { interactions } from '../models/interactions';

export const methods = {
    // Lấy trạng thái like + tổng like
    selectLikeStatus: async (
        selectedIdPosts: number[],
        selectedIdUser: string
    ): Promise<interactions[]> => {
        try {
            return await interactionsModel.selectLikeStatus(
                selectedIdPosts,
                selectedIdUser
            );
        } catch (err) {
            throwError(err);
        }
    },

    // Lấy tổng số share theo danh sách post
    selectedShareCount: async (
        selectedIdPosts: number[]
    ): Promise<interactions[]> => {
        try {
            return await interactionsModel.selectedShareCount(selectedIdPosts);
        } catch (err) {
            throwError(err);
        }
    },

    // Lấy danh sách comment kèm thông tin user
    selectCommendData: async (
        selectedIdPosts: number[]
    ): Promise<interactions[]> => {
        try {
            return await interactionsModel.selectCommendData(selectedIdPosts);
        } catch (err) {
            throwError(err);
        }
    },
    destroyInteractions: async (selectedInteractionIds: number[], transaction?: Transaction): Promise<number> => {
        try {
            return await interactionsModel.destroyInteractions(selectedInteractionIds, transaction);
        } catch (err) {
            throwError(err);
        }
    },
    createInteractions: async (addedInteractions: interactions[], transaction?: Transaction): Promise<interactions[]> => {
        try {
            return await interactionsModel.createInteractions(addedInteractions, transaction);
        } catch (err) {
            throwError(err);
        }
    },
    createInteraction: async (data: Partial<interactions>, transaction?: Transaction): Promise<interactions> => {
        try {
            return await interactionsModel.createInteraction(data, transaction);
        } catch (err) {
            throwError(err);
        }
    },
    destroyInteractionById: async (selectedId: number): Promise<number> => {
        try {
            return await interactionsModel.destroyInteraction({ id: selectedId })
        } catch (err) {
            throwError(err);
        }
    },
    destroyInteractionByIdPost: async (selectedIdPost: number): Promise<number> => {
        try {
            return await interactionsModel.destroyInteraction({ id_Posts: selectedIdPost })
        } catch (err) {
            throwError(err);
        }
    },
    updateInteraction: async (selectedId: number, selectedContent: string): Promise<number> => {
        try {
            return await interactionsModel.updateInteraction({ content: selectedContent }, { id: selectedId });
        } catch (err) {
            throwError(err);
        }
    }
}