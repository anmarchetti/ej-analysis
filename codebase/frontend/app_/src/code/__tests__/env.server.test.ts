import { getEnv } from 'code/env.server';

describe('getEnv', () => {
    it('Is Env generated correctly', () => {
        const env = getEnv();
        expect(env.public).toBeTruthy();
        expect(env.private).toBeTruthy();
    });
});
