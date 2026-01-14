export default interface NotificationServerTake {
    id: number,
    selectedIdChatRoom: number,
    selectedSenderId: string,
    receiver_id: string,
    content: string,
    type: string
}