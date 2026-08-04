import { renderHook, waitFor } from '@testing-library/react';

import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import { usePaymentTracking } from './trackingHooks/usePaymentTracking';
import { usePaymentInitialization } from './usePaymentInitialization';

jest.mock('frontend/components/renderings/Payment/trackingHooks/usePaymentTracking');

const mockUsePaymentTracking = jest.mocked(usePaymentTracking);
const initialize = jest.fn(() => Promise.resolve());

describe('usePaymentInitialization', () => {
    it('should initialize and set isInitialized to false initially', async () => {
        renderHook(() => usePaymentInitialization(initialize));

        expect(mockUsePaymentTracking).toHaveBeenCalledWith(false);

        await waitFor(() => expect(initialize).toHaveBeenCalled());
        await waitFor(() => expect(mockUsePaymentTracking).toHaveBeenCalledWith(true));
    });

    it('should remove data from session storage on unmount', () => {
        const removeItemSpy = jest.spyOn(sessionStorage, 'removeItem');

        const { unmount } = renderHook(() => usePaymentInitialization(initialize));
        unmount();

        expect(removeItemSpy).toHaveBeenCalledWith(WebStorageKeys.PrevPage);
    });
});
