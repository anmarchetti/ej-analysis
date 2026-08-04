import { renderHook } from '@testing-library/react';

import { toDataURL } from 'frontend/utils/image.utils';

import useDataUrl from './useDataUrl';

jest.mock('frontend/utils/image.utils');

describe('useDataUrl', () => {
    it('should call toDataURL', () => {
        renderHook(() => useDataUrl('test'));

        expect(toDataURL).toBeCalled();
    });

    it('should not call toDataURL when url is empty', () => {
        renderHook(() => useDataUrl(''));

        expect(toDataURL).not.toBeCalled();
    });
});
