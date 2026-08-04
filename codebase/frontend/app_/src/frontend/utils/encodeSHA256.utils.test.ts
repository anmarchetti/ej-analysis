import crypto, { createHash } from 'crypto';
import { TextEncoder } from 'util';

import { encodeSHA256 } from './encodeSHA256.utils';

Object.assign(global, { TextEncoder });

Object.defineProperty(global.self, 'crypto', {
    value: {
        getRandomValues: (arr: any) => crypto.randomBytes(arr.length),
        subtle: {
            digest: (algorithm: string, data: Uint8Array) =>
                new Promise(resolve =>
                    resolve(createHash(algorithm.toLowerCase().replace('-', '')).update(data).digest()),
                ),
        },
    },
});

describe('encodeSHA256', () => {
    it('should return not empty string', async () => {
        const value = 'email@some.com';

        const hash = await encodeSHA256(value);

        expect(hash).not.toBe('');
    });
});
