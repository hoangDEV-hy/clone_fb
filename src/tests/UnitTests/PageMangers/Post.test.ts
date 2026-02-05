import { methods as PostModel } from "../../../Models/Post"
import { methods as postMangerController } from "../../../Constrollers/PageManagers/Posts"
import { methods as postController } from "../../../Constrollers/Posts"

//load post

//#b1: lay danh sach bai dang
//input dung-mang kq, mang rong
//input sai-nem loi

//#b2: transport
//input dung-object rong/ object {post, contentOfPost{ text, image} }
//input sai- nem loi

describe("load post", () => {
    it("input dung-return mang rong", async () => {
        (postController.selectPostsWithUser as jest.Mock).mockResolvedValue([]);
        let value = await postMangerController.loadPosts("user 1", 1);
        expect(value).toEqual([]);
        expect(postController.selectPostsWithUser).toHaveBeenCalled(e => {
            expect(e).toEqual({ user_id: "user 1", group_id: 1 })
        }
        )
    })
    it("input dung-return mang kq", async () => {
        (postController.selectPostsWithUser as jest.Mock).mockResolvedValue({ id: 1, user_id: "user 1", group_id: 1, contens: "abc", scope: "group" });
        let value = await postMangerController.loadPosts("user 1", 1);
        expect(value).toEqual({
            id: 1, user_id: "user 1", group_id: 1, contens: {
                text: "abc",
                contens: null
            }, scope: "group"
        });
        expect(postController.selectPostsWithUser).toHaveBeenCalled(e => {
            expect(e).toEqual({ user_id: "user 1", group_id: 1 })
        }
        )
    })
})

