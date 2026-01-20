import { User } from '../../models/user'
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { methods as friendModel, user_user } from '../../models/user_user';
import throwError from '../../helpers/ThrowErrorOfController';
import { methods as userController } from '../User'

export let methods = {
    accepRequest: friendModel.up,
    sendRequest: friendModel.add,
    delRequest: friendModel.del,
    selectFriendsDone: async (id: string): Promise<user_user[]> => {
        try {
            const selectedFriended = await friendModel.selectFriendsDone(id);
            const idfriends = selectedFriended.map((g: any) => g.id_userB);

            const listFriends = await userController.selectUsersWithIdsList(idfriends);

            return listFriends.map((g: any) => g.toJSON());
        } catch (err) {
            throwError(err);
        }
    },
    selectFriendsRequest: async (id: string): Promise<user_user[]> => {
        try {
            const selectedFriended = await friendModel.selectFriendsRequest(id);
            const idfriends = selectedFriended.map((g: any) => g.id_userB);

            const listFriends = await userController.selectUsersWithIdsList(idfriends);

            return listFriends.map((g: any) => g.toJSON());
        } catch (err) {
            throwError(err);
        }
    },
    delFriend: async (idUserA: string, idUserB: string): Promise<number> => {
        try {
            return await friendModel.del({ id_userA: idUserA, id_userB: idUserB, status: 'done' });
        } catch (err) {
            throwError(err);
        }
    },
    delRequestFriend: async (idUserA: string, idUserB: string): Promise<number> => {
        try {
            return await friendModel.del({ id_userA: idUserA, id_userB: idUserB, status: 'pending' });
        } catch (err) {
            throwError(err);
        }
    }
}