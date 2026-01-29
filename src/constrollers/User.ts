import { User, methods as userModel } from "../Models/user";
import throwError from "../Helpers/ThrowErrorOfController";

export const methods = {
    selectUser: async (selectedIdUser: string): Promise<User | null> => {
        try {
            return await userModel.selectUser({ id: selectedIdUser });
        } catch (err) {
            throwError(err);
        }
    },
    selectUsersWithName: async (selectedName: string): Promise<User[]> => {
        try {
            return await userModel.selectUsers({ name: selectedName });
        } catch (err) {
            throwError(err);
        }
    },
    selectUsersWithIdsList: async (idsList: string[]): Promise<User[]> => {
        try {
            return await userModel.selectUsersWithIdsList(idsList);
        } catch (err) {
            throwError(err);
        }
    }
}