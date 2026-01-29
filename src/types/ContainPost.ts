import { Posts } from "../Models/Post";
import contentOfPost from "./ContentOfPost";


export default interface contain_posts extends Omit<Posts, 'contens'> {
    contens: string | contentOfPost,
}