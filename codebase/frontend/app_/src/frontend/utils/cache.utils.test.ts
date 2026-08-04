import AxiosRequest from 'frontend/utils/request';

import { CachedGetRequest } from './cache.utils';

jest.mock('frontend/utils/request', () => ({
    __esModule: true,
    default: {
        get: jest.fn(url => Promise.resolve(url)),
    },
}));

describe('CachedGetRequest', () => {
    let cachedGetRequest: CachedGetRequest;

    beforeEach(() => {
        cachedGetRequest = new CachedGetRequest();
    });

    it('should return the same request if the same URL is requested within 150ms', async () => {
        const url = 'https://example.com';

        const firstRequest = cachedGetRequest.getRequest(url);
        const secondRequest = cachedGetRequest.getRequest(url);

        expect(secondRequest).toBe(firstRequest);
        expect(AxiosRequest.get).toHaveBeenCalledTimes(1);
        expect(AxiosRequest.get).toHaveBeenCalledWith(url);
    });

    it('should make a new request if a different URL is requested', async () => {
        const firstUrl = 'https://example.com/1';
        const secondUrl = 'https://example.com/2';

        const firstRequest = cachedGetRequest.getRequest(firstUrl);
        const secondRequest = cachedGetRequest.getRequest(secondUrl);

        expect(secondRequest).not.toBe(firstRequest);
        expect(AxiosRequest.get).toHaveBeenCalledTimes(2);
        expect(AxiosRequest.get).toHaveBeenCalledWith(firstUrl);
        expect(AxiosRequest.get).toHaveBeenCalledWith(secondUrl);
    });

    it('should make a new request if the same URL is requested after 150ms', async () => {
        const url = 'https://example.com';
        jest.useFakeTimers();

        const firstRequest = cachedGetRequest.getRequest(url);
        jest.advanceTimersByTime(200);
        const secondRequest = cachedGetRequest.getRequest(url);

        expect(secondRequest).not.toBe(firstRequest);
        expect(AxiosRequest.get).toHaveBeenCalledTimes(2);
        expect(AxiosRequest.get).toHaveBeenCalledWith(url);
    });
});
