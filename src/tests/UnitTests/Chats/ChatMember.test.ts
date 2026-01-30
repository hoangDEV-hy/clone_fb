jest.mock("../../src/Models/Chats/ChatMember", () => ({
    selectWhere: jest.fn().mockResolvedValue([{
        id: "1",
        name: "John Doe",
        email: "john.doe@example.com",
        password: "password",
        createdAt: new Date(),
        updatedAt: new Date(),
    }]) as jest.Mock,
    add_members: jest.fn().mockResolvedValue([{
        id: "1",
        name: "John Doe",
        email: "john.doe@example.com",
        password: "password",
        createdAt: new Date(),
        updatedAt: new Date(),
    }]) as jest.Mock,
}));

describe("ChatMemberController", () => {
    it("should return chat members", async () => {
        const chatMembers = await chatMemberController.selectWhere({ id: "1" });
        expect(chatMembers).toEqual([{
            id: "1",
            name: "John Doe",
            email: "john.doe@example.com",
            password: "password",
            createdAt: new Date(),
            updatedAt: new Date(),
        }]);
    });
});