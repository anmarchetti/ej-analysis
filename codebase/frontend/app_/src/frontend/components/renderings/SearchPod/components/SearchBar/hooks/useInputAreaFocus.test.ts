import { renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import useInputAreaFocus, {
    IUseInputAreaFocusProps,
} from 'frontend/components/renderings/SearchPod/components/SearchBar/hooks/useInputAreaFocus';

const isMobile = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    useMobileViewport: () => isMobile,
}));

const createMockProps = (): IUseInputAreaFocusProps => ({
    reset: jest.fn(),
    interactableFieldRef: { current: document.createElement('div') },
    isUserInteractingWithInput: true,
    isDropdownSelected: false,
});
let mockProps;

describe('useInputAreaFocus', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should reset on click outside the field if user is interacting', async () => {
        mockProps.isUserInteractingWithInput = true;
        mockProps.isDropdownSelected = false;
        renderHook(() => useInputAreaFocus(mockProps));

        await userEvent.click(document.body);

        expect(mockProps.reset).toHaveBeenCalled();
    });

    it('should not reset if the user is not interacting', async () => {
        mockProps.isUserInteractingWithInput = false;
        mockProps.isDropdownSelected = false;
        renderHook(() => useInputAreaFocus(mockProps));

        await userEvent.click(document.body);

        expect(mockProps.reset).not.toHaveBeenCalled();
    });

    it('should calls reset on unmount', () => {
        mockProps.isUserInteractingWithInput = true;
        mockProps.isDropdownSelected = true;
        const { unmount } = renderHook(() => useInputAreaFocus(mockProps));
        unmount();
        expect(mockProps.reset).toHaveBeenCalled();
    });
});
