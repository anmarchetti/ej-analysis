import { renderHook } from '@testing-library/react';

import useShouldRenderVideo from 'frontend/hooks/useShouldRenderVideo';
import * as cookieUtils from 'frontend/utils/cookies.utils';

describe('shouldRender', () => {
    it('shouldRender becomes true when the cookie value is 1', () => {
        jest.spyOn(cookieUtils, 'getCookie').mockReturnValue('1');

        const { result } = renderHook(() => useShouldRenderVideo());

        expect(result.current).toBe(true);
    });

    it('shouldRender becomes false when the cookie value is 0', () => {
        jest.spyOn(cookieUtils, 'getCookie').mockReturnValue('0');

        const { result } = renderHook(() => useShouldRenderVideo());

        expect(result.current).toBe(false);
    });
});
