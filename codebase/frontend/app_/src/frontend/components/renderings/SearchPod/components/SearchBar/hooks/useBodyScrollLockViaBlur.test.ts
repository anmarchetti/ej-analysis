import { fireEvent, waitFor } from '@testing-library/dom';
import { act, renderHook } from '@testing-library/react';

import { useBodyScrollLockViaBlur } from 'frontend/components/renderings/SearchPod/components/SearchBar/hooks/useBodyScrollLockViaBlur';

let mockUseMobileViewport;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

describe('useBodyScrollLockViaBlur', () => {
    let mockMobileInputRef;
    let mockSetIsBodyScrollLockedViaBlur;

    beforeEach(() => {
        mockUseMobileViewport = true;
        mockSetIsBodyScrollLockedViaBlur = jest.fn();

        const input = document.createElement('input');
        document.body.appendChild(input);

        mockMobileInputRef = { current: input };
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should call setIsBodyScrollLockedViaBlur with true when blur event is triggered on input', async () => {
        renderHook(() =>
            useBodyScrollLockViaBlur({
                mobileInputRef: mockMobileInputRef,
                setIsBodyScrollLockedViaBlur: mockSetIsBodyScrollLockedViaBlur,
            }),
        );

        act(() => {
            fireEvent.blur(mockMobileInputRef.current);
        });

        expect(mockSetIsBodyScrollLockedViaBlur).toHaveBeenCalledWith(true);
        waitFor(() => {
            expect(mockSetIsBodyScrollLockedViaBlur).toHaveBeenCalledWith(false);
        });
    });

    it('should Not call setIsBodyScrollLockedViaBlur when blur event is triggered on input and isMobile is false', async () => {
        mockUseMobileViewport = false;
        renderHook(() =>
            useBodyScrollLockViaBlur({
                mobileInputRef: mockMobileInputRef,
                setIsBodyScrollLockedViaBlur: mockSetIsBodyScrollLockedViaBlur,
            }),
        );

        act(() => {
            fireEvent.blur(mockMobileInputRef.current);
        });

        expect(mockSetIsBodyScrollLockedViaBlur).not.toHaveBeenCalled();
        waitFor(() => {
            expect(mockSetIsBodyScrollLockedViaBlur).not.toHaveBeenCalled();
        });
    });

    it('should clean up listener on unmount', async () => {
        const addSpy = jest.spyOn(mockMobileInputRef.current, 'addEventListener');
        const removeSpy = jest.spyOn(mockMobileInputRef.current, 'removeEventListener');

        const { unmount } = renderHook(() =>
            useBodyScrollLockViaBlur({
                mobileInputRef: mockMobileInputRef,
                setIsBodyScrollLockedViaBlur: mockSetIsBodyScrollLockedViaBlur,
            }),
        );

        act(() => {
            fireEvent.blur(mockMobileInputRef.current);
        });

        expect(addSpy).toHaveBeenCalledWith('blur', expect.any(Function));

        unmount();

        expect(removeSpy).toHaveBeenCalledWith('blur', expect.any(Function));
    });
});
