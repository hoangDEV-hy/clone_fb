import { Request, Response, NextFunction } from "express";

export default async function handleUpload(req: any, res: Response, next: NextFunction): Promise<void> {
    if (!req.file) {
        res.status(400).send('No file uploaded.');
        return;
    }
    next();
}