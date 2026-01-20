export default function throwError(err: unknown, res: any): void {
    console.error('Error in Router:', err);
    res.status(500).json({ error: 'Internal server error' });
}