export class PromiseResolver {
    /**
     * Cache promise
     */
    private promisesQueue: { [key: string]: Nullable<Promise<any>> } = {};

    constructor() {}

    /**
     * Will store promise in cache by key until promise will be resoled or rejected.
     * @param key ket to check in cache
     * @param promise promise to execute
     * @param force should fire await promise in any way
     */
    public async resolve<T>(key: string, promise: () => Promise<T>, force?: boolean): Promise<T> {
        if (this.promisesQueue[key] && !force) {
            return this.promisesQueue[key];
        }

        let result;
        try {
            this.promisesQueue[key] = promise();
            result = await this.promisesQueue[key];
        } finally {
            this.promisesQueue[key] = undefined;
        }

        return result;
    }
}
