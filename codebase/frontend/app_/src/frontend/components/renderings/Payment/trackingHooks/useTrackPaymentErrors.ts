import { useEffect } from 'react';

import { IPaymentFailureItem } from 'frontend/store/holidays/payment/payment-failures.config';
import { gaPaymentError } from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';

import { usePaymentTracking } from './usePaymentTracking';

const useTrackPaymentErrors = (
    transferErrors: IPaymentFailureItem[],
    paymentErrors: IPaymentFailureItem[],
    enabled: boolean = true,
): void => {
    const { pushTrackingEvent } = usePaymentTracking();

    useEffect(() => {
        const seenKeys = new Set();
        const errors = [...(transferErrors || []), ...(paymentErrors || [])].filter(Boolean).filter(error => {
            const key = `${error.descriptionKey}_${error.messageKey}`;

            if (seenKeys.has(key)) {
                return false;
            }

            seenKeys.add(key);

            return true;
        });

        if (errors.length > 0) {
            errors.forEach(error => {
                if (enabled) pushTrackingEvent(gaPaymentError(error));
            });
        }
    }, [transferErrors, paymentErrors, pushTrackingEvent, enabled]);
};

export default useTrackPaymentErrors;
