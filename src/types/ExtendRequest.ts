import { Request } from "express";

export default interface ExtendRequest extends Request {
    admin?: {
        id: string;
    }
}