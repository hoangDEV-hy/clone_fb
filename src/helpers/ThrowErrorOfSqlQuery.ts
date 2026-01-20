export default function throwError(err: unknown): never {
    console.error('Error in model:', err);
    throw new Error('Error in model');
}