import * as urls from 'frontend/utils/url.utils';

import { getParsedPath } from './getParsedPath';

describe('getParsedPath', () => {
    it('should return 1 object when no / in purify url', () => {
        jest.spyOn(urls, 'purifyUrl').mockReturnValue('purifyUrl');
        const path = 'path';
        const result = [{ label: 'PurifyUrl', path: '/purifyUrl' }];
        const parsedPath = getParsedPath(path);

        expect(parsedPath).toStrictEqual(result);
    });

    it('should return 2 objects when 1 / provided in purify url', () => {
        jest.spyOn(urls, 'purifyUrl').mockReturnValue('purify/Url');
        const path = 'path';
        const result = [
            { label: 'Purify', path: '/purify' },
            { label: 'Url', path: '/purify/Url' },
        ];
        const parsedPath = getParsedPath(path);

        expect(parsedPath).toStrictEqual(result);
    });
});
