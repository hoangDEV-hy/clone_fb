export default function throwError(err: unknown): never {
    console.error('Error in controller:', err);
    throw new Error('Error in controller');
}