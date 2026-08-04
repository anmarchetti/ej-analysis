import { PromiseResolver } from './promiseResolverUtill';

describe('PromiseResolver', () => {
    test('should call action single time', async () => {
        const resolver = new PromiseResolver();
        const fn = jest.fn();
        const action = () => Promise.resolve(fn());
        const result = resolver.resolve('key', action);
        resolver.resolve('key', action);
        resolver.resolve('key', action);
        resolver.resolve('key', action);
        resolver.resolve('key', action);
        await result;
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('should should call action multiple times if promise was already resolved', async () => {
        const resolver = new PromiseResolver();
        const fn = jest.fn();
        const action = () => Promise.resolve(fn());
        const result = resolver.resolve('key', action);
        await result;
        const result1 = resolver.resolve('key', action);
        await result1;
        const result2 = resolver.resolve('key', action);
        await result2;
        const result3 = resolver.resolve('key', action);
        await result3;
        expect(fn).toHaveBeenCalledTimes(4);
    });

    test('should should call action multiple times if promise is under different keys', async () => {
        const resolver = new PromiseResolver();
        const fn = jest.fn();
        const action = () => Promise.resolve(fn());
        const result = resolver.resolve('key1', action);
        const result1 = resolver.resolve('key2', action);
        const result2 = resolver.resolve('key3', action);
        const result3 = resolver.resolve('key4', action);
        await result;
        await result1;
        await result2;
        await result3;
        expect(fn).toHaveBeenCalledTimes(4);
    });
});
