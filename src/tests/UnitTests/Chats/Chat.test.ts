import { methods as chatModel } from ""
import { methods as chatController } from ""
import { methods as contentsChatModel } from ""
import { methods as configChatModel } from ""

import { contentsChat } from '../../Models/contentsChat';
import * as chatController from '../../Controllers/chatController';

jest.mock('../../Models/contentsChat', () => ({
    contentsChat: {
        createMes: jest.fn(),
        selectedChatsContentsWithSendAndReceive: jest.fn(),
        createChat: jest.fn()
    }
}));

//test case

describe("chatController lay danh sach", () => {
    //input dung
    it("selected susscesfully", async () => {
        (chatModel.selectedChatsContentsWithSendAndReceive as jest.Mock).mockResolvedValue([
            {
                id: 1,
                sender_id: "user 1",
                receiver_id: "user 2",
                admin: null,
                contentsChat: [
                    {
                        id: 1,
                        chatID: 1,
                        content: "abcdefg",
                        author: "user 2",
                        type: "text"
                    }
                ]
            }
        ])
        let value = await chatController.select_chats("user 1", "user 2");
        expect(value).toBe(
            `{id:1,
        sender_id:"user 1",
        receiver_id:"user 2",
        admin:null,
        contentsChat:[
            {
                id:1,
                chatID:1,
                content:"abcdefg",
                author:"user 2",
                type:"text"
            }
        ]}`
        )
        expect(chatMethods.selectedChatsContentsWithSendAndReceive).toHaveBeenCalled(
            expect.objectContaining({
                sender_id: "user 1", receiver_id: "user 2"
            })
        )
    });

    it("create successfull", async () => {
        (chatModel.createChat as jest.Mock).mockResolvedValue(
            {
                id: 1,
                sender_id: "user 1",
                receiver_id: "user 2",
                admin: null
            }
        )
        let vaule = await chatController.select_chats("user 1", "user 2");
        expect(value).toEqual({
            created: true,
            chatId: 1
        })
        expect(chatModel.createChat).toHaveBeenCalled(
            expect.objectContaining({
                sender_id: "user 1", receiver_id: "user 2"
            })
        )
    })
    //throw error: input sai( input không có trong db, input sai định dạng)
    it("throw error selected", async () => {
        (chatModel.selectedChatsContentsWithSendAndReceive as jest.Mock).mockResolvedValue(
            error
        )
        let value = await chatController.select_chats("user 3", "user 4");
        expect(value).toEqual({
            error
        })
    })

    it("throw error create", async () => {
        (chatModel.createChat as jest.mock).mockResolvedValue(
            error
        )
        let value = await chatController.select_chats("user 3", "user 4");
        expect(value).toEqual({
            error
        })
    })
})
//tao tin nhan (input dung, input sai)
describe("send mes succesful", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    //TC1 – Chỉ gửi text

    it('TC1 – Chỉ gửi text', async () => {
        (contentsChat.create as jest.Mock).mockResolvedValue({
            id: 1,
            chatID: '1',
            content: 'hello',
            author: 'user 2',
            type: 'text'
        });

        const value = await chatController.create_mes(
            '1',
            'user 2',
            { text: 'hello' }
        );

        expect(value).toEqual([
            {
                id: 1,
                chatID: '1',
                content: 'hello',
                author: 'user 2',
                type: 'text'
            }
        ]);

        expect(contentsChat.create).toHaveBeenCalledWith({
            chatID: '1',
            author: 'user 2',
            content: 'hello',
            type: 'text'
        });
    });

    //TC2 – Chỉ gửi image
    it('TC2 – Chỉ gửi image', async () => {
        (contentsChat.create as jest.Mock).mockResolvedValue({
            id: 2,
            chatID: '1',
            content: 'image-url',
            author: 'user 2',
            type: 'picture'
        });

        const value = await chatController.create_mes(
            '1',
            'user 2',
            { img: 'image-url' }
        );

        expect(value).toEqual([
            {
                id: 2,
                chatID: '1',
                content: 'image-url',
                author: 'user 2',
                type: 'picture'
            }
        ]);

        expect(contentsChat.create).toHaveBeenCalledWith({
            chatID: '1',
            author: 'user 2',
            content: 'image-url',
            type: 'picture'
        });
    });

    //TC3 – Chỉ gửi voice
    it('TC3 – Chỉ gửi voice', async () => {
        (contentsChat.create as jest.Mock).mockResolvedValue({
            id: 3,
            chatID: '1',
            content: 'voice-url',
            author: 'user 2',
            type: 'voice'
        });

        const value = await chatController.create_mes(
            '1',
            'user 2',
            { voice: 'voice-url' }
        );

        expect(value).toEqual([
            {
                id: 3,
                chatID: '1',
                content: 'voice-url',
                author: 'user 2',
                type: 'voice'
            }
        ]);
    });

    //TC4 – Gửi nhiều loại cùng lúc
    it('TC4 – Gửi text + image + voice', async () => {
        (contentsChat.create as jest.Mock)
            .mockResolvedValueOnce({
                id: 1,
                chatID: '1',
                content: 'hello',
                author: 'user 2',
                type: 'text'
            })
            .mockResolvedValueOnce({
                id: 2,
                chatID: '1',
                content: 'img-url',
                author: 'user 2',
                type: 'picture'
            })
            .mockResolvedValueOnce({
                id: 3,
                chatID: '1',
                content: 'voice-url',
                author: 'user 2',
                type: 'voice'
            });

        const value = await chatController.create_mes(
            '1',
            'user 2',
            {
                text: 'hello',
                img: 'img-url',
                voice: 'voice-url'
            }
        );

        expect(value).toHaveLength(3);
        expect(contentsChat.create).toHaveBeenCalledTimes(3);
    });

    //TC5 – Có field nhưng giá trị null / undefined
    it('TC5 – Bỏ qua field null / undefined', async () => {
        (contentsChat.create as jest.Mock).mockResolvedValue({
            id: 1,
            chatID: '1',
            content: 'hello',
            author: 'user 2',
            type: 'text'
        });

        const value = await chatController.create_mes(
            '1',
            'user 2',
            {
                text: 'hello',
                img: null,
                voice: undefined
            }
        );

        expect(value).toHaveLength(1);
        expect(contentsChat.create).toHaveBeenCalledTimes(1);
    });

    //TC6 – send_mesData rỗng
    it('TC6 – send_mesData rỗng', async () => {
        const value = await chatController.create_mes(
            '1',
            'user 2',
            {}
        );

        expect(value).toEqual([]);
        expect(contentsChat.create).not.toHaveBeenCalled();
    });

    //TC7 – contentsChat.create bị lỗi
    it('TC7 – contentsChat.create throw error', async () => {
        (contentsChat.create as jest.Mock).mockRejectedValue(
            new Error('DB error')
        );

        await expect(
            chatController.create_mes('1', 'user 2', { text: 'hello' })
        ).rejects.toThrow('DB error');
    });
});

//tao, sua config chat
//TC 1-load-input dung/ input sai( sai thong tin, thong tin khong dung dinh dang)
describe("config chat", () => {

    it("TC 1 load successfull", async () => {
        (configChatModel.createConfig as jest.Mock).mockResolvedValue(
            {
                chat_id: "1",
                author: "user 2",
                nickName: "abc"
            }
        )
        cont value = await chatController.createOrUpdateOrLoad_chat({
            chat_id: "1",
            author: "user 2",
            nickName: "abc"
        })
        expect(value).toEqual(
            {
                chat_id: "1",
                author: "user 2",
                nickName: "abc"
            }
        )
        expect(configChatModel.createConfig).toHaveBeenCalledWith(
            {
                chat_id: "1",
                author: "user 2",
                nickName: "abc"
            });
    })
    //TC 2-update

    it("TC 2 update successfull", async () => {
        (configChatModel.update_config as jest.Mock).mockResolvedValue([1]);
        const value = await chatController.createOrUpdateOrLoad_chat({ nickName: "bcd" },
            {
                chat_id: "1",
                author: "user 2",
                nickName: "abc"
            },
            {
                chat_id: "1",
                author: "user 2",
                nickName: "abc"
            }
        );
        expect(value).toEqual({
            chat_id: "1",
            author: "user 2",
            nickName: "bcd"
        })
    })
})
//TC 3-create

it("TC 3 create successfull", async () => {
    (configChatModel.create_config as jest.Mock).mockResolvedValue(
        {
            chat_id: "1",
            author: "user 2",
            nickName: "abc"
        }
    )
    const value = await chatController.createOrUpdateOrLoad_chat(
        {
            chat_id: "1",
            author: "user 2",
            nickName: "abc"
        },
        {
            chat_id: "1",
            author: "user 2",
            nickName: "abc"
        }
    )
    expect(value).toEqual(
        {
            chat_id: "1",
            author: "user 2",
            nickName: "abc"
        }
    )
    expect(configChatModel.createConfig).toHaveBeenCalledWith(
        {
            chat_id: "1",
            author: "user 2",
            nickName: "abc"
        });

})
//input sai( sai thong tin, sai dinh dang)
it("")
//TC7 – contentsChat.create bị lỗi
it('TC7 – contentsChat.create throw error', async () => {
    (contentsChat.create as jest.Mock).mockRejectedValue(
        new Error('DB error')
    );

    await expect(
        chatController.create_mes('1', 'user 2', { text: 'hello' })
    ).rejects.toThrow('DB error');
});