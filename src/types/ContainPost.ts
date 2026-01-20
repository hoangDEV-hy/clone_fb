import { Posts } from "../models/Posts";
import contentOfPost from "./ContentOfPost";


export default interface contain_posts extends Omit<Posts, 'contens'> {
    contens: string | contentOfPost,
}