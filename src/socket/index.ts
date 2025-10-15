import { Server } from "socket.io";
import { config_dataChat } from "./chat"
export function setup_chat(io: Server) {
    io.on('connection', (socket) => {
        console.log(`⚡ User connected: ${socket.id}`);
        //sending chatData to client
        config_dataChat.get_chatData(socket);
        //listening mesData to server
        config_dataChat.get_mesData(socket);
        socket.on('disconnect', () => {
            console.log(`❌ User disconnected: ${socket.id}`);
        })
    })

}