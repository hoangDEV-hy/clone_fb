import { User, methods as userModel } from "../models/user";
import throwError from "../helpers/ThrowErrorOfController";

export const methods = {
    selectUser: async (selectedIdUser: string): Promise<User | null> => {
        try {
            return await userModel.selectUser({ id: selectedIdUser });
        } catch (err) {
            throwError(err);
        }
    }
}