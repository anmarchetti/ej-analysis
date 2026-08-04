import { renderHook } from '@testing-library/react';

import useClearOnUnmount, {
    IUseClearOnUnmountProps,
} from 'frontend/components/renderings/SearchPod/hooks/useClearOnUnmount';

const createMockProps = (): IUseClearOnUnmountProps => ({
    clearOldSearchParam: jest.fn(),
    clearSearchValues: jest.fn(),
    clearFilterStoreValues: jest.fn(),
    isDestinationPage: true,
    shouldSkipEffect: false,
});
let mockProps;

describe('useClearOnUnmount', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should call all clear functions on unmount if isDestinationPage is true', () => {
        const { unmount } = renderHook(() => useClearOnUnmount(mockProps));

        unmount();

        expect(mockProps.clearOldSearchParam).toHaveBeenCalledTimes(1);
        expect(mockProps.clearSearchValues).toHaveBeenCalledTimes(1);
        expect(mockProps.clearFilterStoreValues).toHaveBeenCalledTimes(1);
    });

    it('should only call clearOldSearchParam on unmount if isDestinationPage is false', () => {
        mockProps.isDestinationPage = false;
        const { unmount } = renderHook(() => useClearOnUnmount(mockProps));

        unmount();

        expect(mockProps.clearOldSearchParam).toHaveBeenCalledTimes(1);
        expect(mockProps.clearSearchValues).not.toHaveBeenCalled();
        expect(mockProps.clearFilterStoreValues).not.toHaveBeenCalled();
    });

    it('should do nothing if shouldSkipEffect is true', () => {
        mockProps.shouldSkipEffect = true;
        const { unmount } = renderHook(() => useClearOnUnmount(mockProps));

        unmount();

        expect(mockProps.clearOldSearchParam).not.toHaveBeenCalled();
        expect(mockProps.clearSearchValues).not.toHaveBeenCalled();
        expect(mockProps.clearFilterStoreValues).not.toHaveBeenCalled();
    });
});
