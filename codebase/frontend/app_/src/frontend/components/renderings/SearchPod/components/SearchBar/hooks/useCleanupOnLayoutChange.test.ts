import { renderHook } from '@testing-library/react';

import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import { useCleanupOnLayoutChange } from 'frontend/components/renderings/SearchPod/components/SearchBar/hooks/useCleanupOnLayoutChange';

let mockUsePrevious: string | undefined;
jest.mock('frontend/hooks/usePrevious', () => jest.fn(() => mockUsePrevious));

describe('useCleanupOnLayoutChange', () => {
    let mockChangeSelectedDropdown;
    let mockClearErrorMessage;
    let mockLayoutId;
    let mockSelectedDropdown;

    beforeEach(() => {
        mockChangeSelectedDropdown = jest.fn();
        mockClearErrorMessage = jest.fn();
        mockUsePrevious = 'prevLayoutId';
        mockLayoutId = 'layoutId';
        mockSelectedDropdown = SearchBarDropdown.From;
    });

    it('should call clearErrorMessage and change methods when layout id is changed and selectedDropdown is defined', () => {
        renderHook(() =>
            useCleanupOnLayoutChange({
                changeSelectedDropdown: mockChangeSelectedDropdown,
                clearErrorMessage: mockClearErrorMessage,
                layoutId: mockLayoutId,
                selectedDropdown: mockSelectedDropdown,
            }),
        );

        expect(mockChangeSelectedDropdown).toHaveBeenCalledWith(null);
        expect(mockClearErrorMessage).toHaveBeenCalled();
    });

    it('should call clearErrorMessage and not call change methods when layout id is changed but selectedDropdown is not defined', () => {
        mockSelectedDropdown = null;

        renderHook(() =>
            useCleanupOnLayoutChange({
                changeSelectedDropdown: mockChangeSelectedDropdown,
                clearErrorMessage: mockClearErrorMessage,
                layoutId: mockLayoutId,
                selectedDropdown: mockSelectedDropdown,
            }),
        );

        expect(mockChangeSelectedDropdown).not.toHaveBeenCalled();
        expect(mockClearErrorMessage).toHaveBeenCalled();
    });

    it('should NOT call any method when layout id is not changed', () => {
        mockUsePrevious = mockLayoutId;

        renderHook(() =>
            useCleanupOnLayoutChange({
                changeSelectedDropdown: mockChangeSelectedDropdown,
                clearErrorMessage: mockClearErrorMessage,
                layoutId: mockLayoutId,
                selectedDropdown: mockSelectedDropdown,
            }),
        );

        expect(mockChangeSelectedDropdown).not.toHaveBeenCalled();
        expect(mockClearErrorMessage).not.toHaveBeenCalled();
    });
});
