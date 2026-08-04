import { envPublic } from 'code/env';
import isBackend from 'frontend/utils/isBackend';

jest.mock('frontend/utils/isBackend', () => jest.fn());
const mockedIsBacked = isBackend as jest.MockedFn<typeof isBackend>;

describe('getEnv', () => {
    it('Is Env generated correctly', () => {
        mockedIsBacked.mockReturnValueOnce(true);
        expect(envPublic).toBe(window['NEXT_ENV']);
    });
});
