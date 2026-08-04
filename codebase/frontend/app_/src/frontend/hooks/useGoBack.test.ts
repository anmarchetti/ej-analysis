import { renderHook } from '@testing-library/react';

import { useGoBack } from './useGoBack';

const mockRouterBack = jest.fn();
jest.mock('next/router', () => ({
    __esModule: true,
    useRouter: () => ({ back: mockRouterBack }),
}));

describe('useGoBack', () => {
    beforeEach(() => {
        mockRouterBack.mockClear();
    });

    it('should call goBackToPreviousPage when referrer is not a microapp', () => {
        const originalReferrer = Object.getOwnPropertyDescriptor(document, 'referrer');

        Object.defineProperty(document, 'referrer', {
            value: 'https://exp.test.com/en/holidays/booking/amend-payment',
            configurable: true,
        });

        const goBackToPreviousPage = jest.fn();
        const { result } = renderHook(() => useGoBack(goBackToPreviousPage, true));

        result.current();

        expect(goBackToPreviousPage).toHaveBeenCalledWith(true);
        expect(mockRouterBack).not.toHaveBeenCalled();

        Object.defineProperty(document, 'referrer', originalReferrer ?? { value: '', configurable: true });
    });

    it('should call router.back when referrer includes /manage', () => {
        const originalReferrer = Object.getOwnPropertyDescriptor(document, 'referrer');

        Object.defineProperty(document, 'referrer', {
            value: 'https://exp.test.com/en/holidays/manage/EJ123456/change-transfer',
            configurable: true,
        });

        const goBackToPreviousPage = jest.fn();
        const { result } = renderHook(() => useGoBack(goBackToPreviousPage));

        result.current();

        expect(mockRouterBack).toHaveBeenCalled();
        expect(goBackToPreviousPage).not.toHaveBeenCalled();

        Object.defineProperty(document, 'referrer', originalReferrer ?? { value: '', configurable: true });
    });

    it('should pass byBreadcrumbs to goBackToPreviousPage', () => {
        const originalReferrer = Object.getOwnPropertyDescriptor(document, 'referrer');

        Object.defineProperty(document, 'referrer', {
            value: 'https://exp.test.com/en/holidays/booking',
            configurable: true,
        });

        const goBackToPreviousPage = jest.fn();
        const { result } = renderHook(() => useGoBack(goBackToPreviousPage, false));

        result.current();

        expect(goBackToPreviousPage).toHaveBeenCalledWith(false);

        Object.defineProperty(document, 'referrer', originalReferrer ?? { value: '', configurable: true });
    });
});
