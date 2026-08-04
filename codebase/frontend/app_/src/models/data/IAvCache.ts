export interface IAVCache<T> {
    AvCache: {
        Result: T;
        Status: {
            Total: {
                Count: number;
            };
        };
    };
}
