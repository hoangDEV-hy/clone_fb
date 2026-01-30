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
        console.log("keys: ", Array.from(this.cache.keys()))
        for (const key of this.cache.keys()) {
            console.log("key: ", key)
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

// Cache Registry để quản lý nhiều cache instances
class CacheRegistry {
    private static caches: Set<CacheManager> = new Set();
    
    /**
     * Đăng ký cache instance vào registry
     */
    static register(cache: CacheManager): void {
        this.caches.add(cache);
    }
    
    /**
     * Xóa đăng ký cache instance khỏi registry
     */
    static unregister(cache: CacheManager): void {
        this.caches.delete(cache);
    }
    
    /**
     * Clear pattern trên tất cả registered caches
     */
    static clearPattern(pattern: string): void {
        console.log(`Clearing pattern "${pattern}" across ${this.caches.size} cache instances`);
        for (const cache of this.caches) {
            cache.clearPattern(pattern);
        }
    }
    
    /**
     * Clear tất cả caches
     */
    static clearAll(): void {
        for (const cache of this.caches) {
            cache.clear();
        }
    }
    
    /**
     * Lấy số lượng cache instances đã đăng ký
     */
    static getRegisteredCount(): number {
        return this.caches.size;
    }
}

export default CacheManager;
export { CacheRegistry };