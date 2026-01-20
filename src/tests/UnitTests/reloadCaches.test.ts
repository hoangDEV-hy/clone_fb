class CacheService {
    private cache: Map<string, any> = new Map();

    set(key: string, value: any): void {
        this.cache.set(key, value);
    }

    get(key: string): any {
        return this.cache.get(key);
    }

    clearPattern(pattern: string): void {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    keys(): string[] {
        return Array.from(this.cache.keys());
    }

    size(): number {
        return this.cache.size;
    }
}

describe('CacheService Tests', () => {
    let cacheService: CacheService;

    beforeEach(() => {
        cacheService = new CacheService();
    });

    describe('clearPattern', () => {
        it('should clear all cache entries matching the pattern', () => {
            cacheService.set('user:123', { id: 123 });
            cacheService.set('user:456', { id: 456 });
            cacheService.set('group:789', { id: 789 });
            cacheService.set('user:settings:123', { theme: 'dark' });

            cacheService.clearPattern('user');

            expect(cacheService.get('user:123')).toBeUndefined();
            expect(cacheService.get('user:456')).toBeUndefined();
            expect(cacheService.get('user:settings:123')).toBeUndefined();
            expect(cacheService.get('group:789')).toEqual({ id: 789 });
        });

        it('should not clear any entries if pattern does not match', () => {
            cacheService.set('user:123', { id: 123 });
            cacheService.set('group:456', { id: 456 });

            cacheService.clearPattern('admin');

            expect(cacheService.get('user:123')).toEqual({ id: 123 });
            expect(cacheService.get('group:456')).toEqual({ id: 456 });
            expect(cacheService.size()).toBe(2);
        });

        it('should handle empty cache', () => {
            expect(() => cacheService.clearPattern('user')).not.toThrow();
            expect(cacheService.size()).toBe(0);
        });

        it('should handle exact pattern matches', () => {
            cacheService.set('cache:user:1', { id: 1 });
            cacheService.set('cache:user:2', { id: 2 });
            cacheService.set('cache:group:1', { id: 1 });

            cacheService.clearPattern('cache:user');

            expect(cacheService.get('cache:user:1')).toBeUndefined();
            expect(cacheService.get('cache:user:2')).toBeUndefined();
            expect(cacheService.get('cache:group:1')).toEqual({ id: 1 });
        });

        it('should clear all entries when pattern is empty string', () => {
            cacheService.set('user:123', { id: 123 });
            cacheService.set('group:456', { id: 456 });

            cacheService.clearPattern('');

            expect(cacheService.size()).toBe(0);
        });

        it('should be case-sensitive', () => {
            cacheService.set('User:123', { id: 123 });
            cacheService.set('user:456', { id: 456 });

            cacheService.clearPattern('user');

            expect(cacheService.get('User:123')).toEqual({ id: 123 });
            expect(cacheService.get('user:456')).toBeUndefined();
        });
    });
});