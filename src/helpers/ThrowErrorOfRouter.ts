function toError(err: unknown): Error {
    if (err instanceof Error) return err;

    if (typeof err === "string") return new Error(err);

    try {
        return new Error(JSON.stringify(err));
    } catch {
        return new Error(String(err));
    }
}

export default function throwError(err: unknown, res: any, context?: string): void {
    const error = toError(err);

    console.error(context ? `[Router] ${context}` : "[Router]", error);

    // Không trả stack cho client (production); chỉ log ở server
    res.status(500).json({ error: "Internal server error" });
}