import "express-session";

declare module "express-session" {
    interface SessionData {
        currentGroupId?: number;
        admin?: boolean;
    }
}

export { };