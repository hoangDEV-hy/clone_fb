import { methods as selectMemberModel } from "../../../Models/Chats/ChatMember"
import { select_members, add_members } from "../../../Constrollers/Chats/ChatMembers"

import { Op } from "sequelize";

describe("ChatMemberController", () => {
    it("builds correct query from input", async () => {
        (selectMemberModel.selectWhere as jest.Mock).mockResolvedValue([
            {
                id: "1",
                name: "John Doe",
                email: "john.doe@example.com",
                password: "password",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);

        await select_members("user 1", "user 2", 1);

        expect(selectMemberModel.selectWhere).toHaveBeenCalledWith(
            expect.objectContaining({
                [Op.and]: {
                    idUser: { [Op.in]: ["user 1", "user 2"] },
                    chat_id: 1,
                },
            })
        );
    });
});


