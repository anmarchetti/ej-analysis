import { renderHook } from '@testing-library/react';

import { gaPaymentError } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';

import { usePaymentTracking } from './usePaymentTracking';
import useTrackPaymentErrors from './useTrackPaymentErrors';

jest.mock('frontend/components/renderings/Payment/GAPaymentEventHandlers', () => ({
    gaPaymentError: jest.fn(),
}));

jest.mock('./usePaymentTracking', () => ({
    usePaymentTracking: jest.fn(),
}));

describe('useTrackPaymentErrors', () => {
    let pushTrackingEvent: jest.Mock;

    beforeEach(() => {
        pushTrackingEvent = jest.fn();
        (usePaymentTracking as jest.Mock).mockReturnValue({
            pushTrackingEvent,
        });

        (gaPaymentError as jest.Mock).mockReset();
    });

    it('should not call pushTrackingEvent if there are no errors', () => {
        const transferErrors = [];
        const paymentErrors = [];

        renderHook(() => useTrackPaymentErrors(transferErrors, paymentErrors));

        expect(pushTrackingEvent).not.toHaveBeenCalled();
    });

    it('should call pushTrackingEvent with the correct error for transferErrors', () => {
        const transferErrors = [{ messageKey: 'error', descriptionKey: 'desc', code: '1000', isFatal: false }];
        const paymentErrors = [];

        (gaPaymentError as jest.Mock).mockReturnValue({
            event_action: 'payment error',
            event_label: 'error - desc',
        });

        renderHook(() => useTrackPaymentErrors(transferErrors, paymentErrors));
        expect(pushTrackingEvent).toHaveBeenCalledTimes(1);
        expect(gaPaymentError).toHaveBeenCalledWith(transferErrors[0]);
    });

    it('should call pushTrackingEvent with the correct error for paymentErrors', () => {
        const transferErrors = [];
        const paymentErrors = [{ messageKey: 'error', descriptionKey: 'desc', code: '1000', isFatal: false }];

        (gaPaymentError as jest.Mock).mockReturnValue({
            event_action: 'payment error',
            event_label: 'error - desc',
        });

        renderHook(() => useTrackPaymentErrors(transferErrors, paymentErrors));
        expect(pushTrackingEvent).toHaveBeenCalledTimes(1);
        expect(gaPaymentError).toHaveBeenCalledWith(paymentErrors[0]);
    });

    it('should call pushTrackingEvent for both transferErrors and paymentErrors', () => {
        const transferErrors = [{ messageKey: 'error1', descriptionKey: 'desc1', code: '1000', isFatal: false }];
        const paymentErrors = [{ messageKey: 'error2', descriptionKey: 'desc2', code: '1000', isFatal: false }];

        (gaPaymentError as jest.Mock)
            .mockReturnValueOnce({
                event_action: 'payment error',
                event_label: 'error1 - desc1',
            })
            .mockReturnValueOnce({
                event_action: 'payment error',
                event_label: 'error2 - desc2',
            });

        renderHook(() => useTrackPaymentErrors(transferErrors, paymentErrors));
        expect(pushTrackingEvent).toHaveBeenCalledTimes(2);
        expect(gaPaymentError).toHaveBeenCalledWith(transferErrors[0]);
        expect(gaPaymentError).toHaveBeenCalledWith(paymentErrors[0]);
    });

    it('should call pushTrackingEvent for both transferErrors and paymentErrors without duplicates', () => {
        const transferErrors = [
            { messageKey: 'error1', descriptionKey: 'desc1', code: '1000', isFatal: false },
            { messageKey: 'error1', descriptionKey: 'desc1', code: '1000', isFatal: false },
        ];
        const paymentErrors = [
            { messageKey: 'error2', descriptionKey: 'desc2', code: '1000', isFatal: false },
            { messageKey: 'error2', descriptionKey: 'desc2', code: '1000', isFatal: false },
        ];

        (gaPaymentError as jest.Mock)
            .mockReturnValueOnce({
                event_action: 'payment error',
                event_label: 'error1 - desc1',
            })
            .mockReturnValueOnce({
                event_action: 'payment error',
                event_label: 'error2 - desc2',
            });

        renderHook(() => useTrackPaymentErrors(transferErrors, paymentErrors));

        expect(pushTrackingEvent).toHaveBeenCalledTimes(2);
        expect(gaPaymentError).toHaveBeenCalledWith(transferErrors[0]);
        expect(gaPaymentError).toHaveBeenCalledWith(paymentErrors[0]);
    });
});
