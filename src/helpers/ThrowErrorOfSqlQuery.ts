function toError(err: unknown): Error {
    if (err instanceof Error) return err;

    if (typeof err === "string") return new Error(err);

    try {
        return new Error(JSON.stringify(err));
    } catch {
        return new Error(String(err));
    }
}

export default function throwError(err: unknown, context?: string): never {
    const error = toError(err);
    console.error(context ? `[Model] ${context}` : "[Model]", error);
    throw error;
}