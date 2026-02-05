//lay danh sach sach group da tham gia
//input dung-return group_user[]( null/ actually), 
//input sai-return loi sai dinh dang/loi sql

//lay danh sach id groups
//input dung-return groupIds[]( null->return luon/ actually)
//input sai-return loi

//tra ve group va thong tin thanh vien
//input dung-return group[]( null.actually),
//input sai-return loi sai dinh dang/ loi sql

import { methods as groupUserModel } from ""
import { methods as groupUserController } from ""
describe("selected groups joined", () => {
    it("lay danh sach group da tham ra-input dung-return group_user[]( null", async () => {
        (groupUserModel.selectGroupsJoined as jest.Mock).mockResolvedValue([]);
        let value = await groupUserController.selectGroupsJoined("user 1");
        expect(value).toEqual({
            success: true,
            data: []
        });
        expect(groupUserModel.selectGroupsJoined).toHaveBeenCalled((e) => {
            expect(e).toEqual("user 1");
        })
        it("lay danh sach group da tham ra-input dung-return group_user[]( actually", async () => {

        })
        it("lay danh sach group da tham ra-input sai-return loi sai dinh dang", async () => {

        })

    })
})