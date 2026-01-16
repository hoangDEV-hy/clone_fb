class CacheManager {
    private cache: Map<string, { data: any; expiry: number }> = new Map();
    public readonly TTL = 10 * 60 * 1000; // 10 minutes

    set(key: string, data: any, ttl?: number): void {
        this.cache.set(key, {
            data,
            expiry: Date.now() + (ttl || this.TTL)
        });
    }

    get(key: string): any | null {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    clear(): void {
        this.cache.clear();
    }

    //delete all cache of pattern
    clearPattern(pattern: string): void {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    startCleanup(): void {
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.cache.entries()) {
                if (now > value.expiry) {
                    this.cache.delete(key);
                }
            }
        }, 5 * 60 * 1000);
    }
}


export default CacheManager;
