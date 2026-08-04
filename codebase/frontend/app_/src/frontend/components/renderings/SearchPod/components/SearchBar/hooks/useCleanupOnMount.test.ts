import { renderHook } from '@testing-library/react';

import { prepareBodyScrollLock } from 'frontend/utils/ui.utils';
import { useCleanupOnMount } from 'frontend/components/renderings/SearchPod/components/SearchBar/hooks/useCleanupOnMount';

jest.mock('frontend/utils/ui.utils');

describe('useCleanupOnMount', () => {
    let mockClearErrorMessage;

    beforeEach(() => {
        mockClearErrorMessage = jest.fn();
    });

    it('should call clearErrorMessage and prepareBodyScrollLock on mount', () => {
        renderHook(() =>
            useCleanupOnMount({
                clearErrorMessage: mockClearErrorMessage,
            }),
        );

        expect(mockClearErrorMessage).toHaveBeenCalled();
        expect(prepareBodyScrollLock).toHaveBeenCalled();
    });
});
